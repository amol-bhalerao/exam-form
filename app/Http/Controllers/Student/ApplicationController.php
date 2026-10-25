<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Exam;
use App\Models\Student;
use App\Models\Subject;
use App\Services\ApplicationWorkflow;
use App\Services\SubjectOptions;
use App\Services\SubjectRules;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Exam form in three steps: exam & candidate type → subjects → review & pay.
 * Paying the fee sends the form to the student's institute.
 */
class ApplicationController extends Controller
{
    public const STEPS = ['exam' => 'Exam and candidate type', 'subjects' => 'Subjects', 'review' => 'Review and pay'];

    /** Candidate types that must take the full subject scheme (others appear only for some subjects). */
    public const FULL_SCHEME_TYPES = ['regular', 'private'];

    public function __construct(private SubjectOptions $options, private SubjectRules $rules, private ApplicationWorkflow $workflow) {}

    public function create(Request $request, Student $student)
    {
        $this->authorizeStudent($request, $student);
        if ($missing = $student->missingFields()) {
            return redirect()->route('student.students.edit', $student)
                ->with('warning', __('Complete these details before filling the exam form: :fields', ['fields' => implode(', ', $missing)]));
        }

        $exams = Exam::open()->where('board_id', $student->board_id)->forDivision($student->institute?->division_id)->with('fees', 'stream')->orderBy('closes_at')->get()
            ->filter(fn (Exam $e) => $e->appliesToStream($student->stream_id));
        $existing = $student->applications()->pluck('id', 'exam_id');

        return view('student.applications.exam', [
            'student' => $student, 'application' => null, 'exams' => $exams, 'existing' => $existing,
        ]);
    }

    public function store(Request $request, Student $student)
    {
        $this->authorizeStudent($request, $student);
        abort_if($student->missingFields(), 422);

        $data = $this->validateExamStep($request, $student);
        $exam = $data['exam'];

        if ($old = $student->applications()->where('exam_id', $exam->id)->first()) {
            return redirect()->route('student.applications.show', $old)->with('warning', __('A form for this exam already exists for :name.', ['name' => $student->full_name]));
        }

        $application = DB::transaction(function () use ($request, $student, $exam, $data) {
            $application = Application::create($data['fields'] + [
                'application_no' => Application::nextNumber($student->board),
                'exam_id' => $exam->id,
                'student_id' => $student->id,
                'institute_id' => $student->institute_id,
                'board_id' => $student->board_id,
                'stream_id' => $student->stream_id,
                'created_by' => $request->user()->id,
                'status' => Application::DRAFT,
                'fee_amount' => $exam->feeFor($data['fields']['candidate_type'])['total'],
            ]);
            $this->preselectCompulsory($application);
            return $application;
        });

        return redirect()->route('student.applications.edit', [$application, 'subjects']);
    }

    public function show(Request $request, Application $application)
    {
        $this->authorizeApplication($request, $application);
        $application->load('exam.fees', 'student', 'institute', 'stream', 'subjects.subject', 'events.user', 'payments');
        return view('student.applications.show', ['application' => $application]);
    }

    public function edit(Request $request, Application $application, string $step)
    {
        $this->authorizeApplication($request, $application);
        abort_unless(isset(self::STEPS[$step]), 404);
        if (! $application->editableByStudent() && $step !== 'review') {
            return redirect()->route('student.applications.show', $application)->with('warning', __('This form is with your college and cannot be changed now.'));
        }
        $application->load('exam.fees', 'student.institute', 'student.stream', 'student.previousExams', 'institute', 'stream', 'subjects.subject');

        return match ($step) {
            'exam' => view('student.applications.exam', [
                'student' => $application->student, 'application' => $application,
                'exams' => collect([$application->exam]), 'existing' => collect(),
            ]),
            'subjects' => view('student.applications.subjects', $this->subjectData($application)),
            'review' => view('student.applications.review', $this->reviewData($application)),
        };
    }

    public function update(Request $request, Application $application, string $step)
    {
        $this->authorizeApplication($request, $application);
        abort_unless($application->editableByStudent(), 403, __('This form is with your college and cannot be changed now.'));

        if ($step === 'exam') {
            $data = $this->validateExamStep($request, $application->student, $application);
            $application->fill($data['fields']);
            if (! $application->isPaid()) {
                $application->fee_amount = $application->exam->feeFor($application->candidate_type)['total'];
            }
            $application->save();
            return redirect()->route('student.applications.edit', [$application, 'subjects']);
        }

        if ($step === 'subjects') {
            $this->saveSubjects($request, $application);
            return redirect()->route('student.applications.edit', [$application, 'review']);
        }

        abort(404);
    }

    /** Live check used by the subject picker. */
    public function checkSubjects(Request $request, Application $application)
    {
        $this->authorizeApplication($request, $application);
        $ids = array_map('intval', (array) $request->input('subject_ids', []));
        return response()->json($this->evaluate($application, $ids));
    }

    /** After the institute returned the form, the (already paid) form goes back to the institute. */
    public function submit(Request $request, Application $application)
    {
        $this->authorizeApplication($request, $application);
        $request->validate(['declaration' => ['accepted']], ['declaration.accepted' => __('Please confirm the declaration.')]);

        if (! $application->isPaid()) {
            return redirect()->route('student.applications.edit', [$application, 'review'])->with('warning', __('Pay the exam fee to send the form to your college.'));
        }
        if ($problems = $this->blockingProblems($application)) {
            return redirect()->route('student.applications.edit', [$application, 'review'])->withErrors($problems);
        }
        $this->workflow->apply($application, 'submit', $request->user());

        return redirect()->route('student.applications.show', $application)->with('status', __('Your form has been sent to your college for verification.'));
    }

    public function destroy(Request $request, Application $application)
    {
        $this->authorizeApplication($request, $application);
        abort_unless($application->status === Application::DRAFT && ! $application->isPaid(), 403);
        $application->delete();
        return redirect()->route('student.dashboard')->with('status', __('The draft form has been deleted.'));
    }

    // ------------------------------------------------------------------ helpers

    private function authorizeStudent(Request $request, Student $student): void
    {
        abort_unless($student->owner_id === $request->user()->id, 404);
    }

    private function authorizeApplication(Request $request, Application $application): void
    {
        abort_unless($application->student && $application->student->owner_id === $request->user()->id, 404);
    }

    private function validateExamStep(Request $request, Student $student, ?Application $application = null): array
    {
        $examId = $application?->exam_id ?? $request->input('exam_id');
        $exam = Exam::with('fees')->find($examId);
        if (! $exam || $exam->board_id !== $student->board_id || ! $exam->appliesToStream($student->stream_id)
            || ($exam->division_id && $exam->division_id !== $student->institute?->division_id)) {
            throw ValidationException::withMessages(['exam_id' => __('Choose an exam that is open for this student.')]);
        }
        if (! $application && ! $exam->isOpen()) {
            throw ValidationException::withMessages(['exam_id' => __('This exam is not accepting forms now.')]);
        }

        $year = (int) now()->format('Y');
        $type = $request->input('candidate_type');
        $needsLastExam = in_array($type, ['repeater', 'improvement', 'isolated'], true);

        $v = $request->validate([
            'candidate_type' => ['required', Rule::in($exam->candidate_types ?? [])],
            'exemption_status' => ['nullable', Rule::in(['NON_EXEMPTED', 'EXEMPTED'])],
            'exemptions_claimed' => ['nullable', 'integer', 'between:0,8'],
            'subject_group' => ['nullable', Rule::in(array_keys(Codes::SUBJECT_GROUPS))],
            'is_foreigner' => ['nullable', 'boolean'],
            'enrolment_cert_no' => [$type === 'private' ? 'required' : 'nullable', 'string', 'max:50'],
            'last_exam_month' => [$needsLastExam ? 'required' : 'nullable', Rule::in(array_keys(Codes::MONTHS))],
            'last_exam_year' => [$needsLastExam ? 'required' : 'nullable', 'integer', 'between:1990,' . $year],
            'last_exam_seat_no' => [$needsLastExam ? 'required' : 'nullable', 'string', 'max:30'],
        ], [
            'candidate_type.in' => __('This exam does not accept this type of candidate.'),
            'enrolment_cert_no.required' => __('Private candidates must enter the Form No. 17 enrolment certificate number.'),
            'last_exam_seat_no.required' => __('Enter the seat number of the last exam you appeared for.'),
        ]);

        $fields = [
            'candidate_type' => $v['candidate_type'],
            'exemption_status' => $v['exemption_status'] ?? 'NON_EXEMPTED',
            'exemptions_claimed' => (int) ($v['exemptions_claimed'] ?? 0),
            'subject_group' => $v['subject_group'] ?? 'GENERAL',
            'is_foreigner' => (bool) ($v['is_foreigner'] ?? false),
            'enrolment_cert_no' => $v['enrolment_cert_no'] ?? null,
            'last_exam_month' => $needsLastExam ? $v['last_exam_month'] : null,
            'last_exam_year' => $needsLastExam ? $v['last_exam_year'] : null,
            'last_exam_seat_no' => $needsLastExam ? strtoupper($v['last_exam_seat_no']) : null,
        ];
        if ($application?->isPaid() && $fields['candidate_type'] !== $application->candidate_type) {
            throw ValidationException::withMessages(['candidate_type' => __('The fee is already paid, so the candidate type cannot be changed. Ask your college for help.')]);
        }

        return ['exam' => $exam, 'fields' => $fields];
    }

    private function preselectCompulsory(Application $application): void
    {
        if (! in_array($application->candidate_type, self::FULL_SCHEME_TYPES, true)) {
            return;
        }
        $opts = $this->options->for($application->institute, $application->stream, $application->board_id);
        foreach ($this->options->compulsoryIds($opts['subjects']) as $i => $id) {
            $application->subjects()->firstOrCreate(['subject_id' => $id], [
                'answer_language' => $opts['languages'][$id] ?? $application->student->medium, 'sort' => $i,
            ]);
        }
    }

    private function subjectData(Application $application): array
    {
        $opts = $this->options->for($application->institute, $application->stream, $application->board_id);
        $subjects = $opts['subjects'];
        $grKey = $application->stream?->gr_key;
        $fullScheme = in_array($application->candidate_type, self::FULL_SCHEME_TYPES, true);

        // Group the list the way the 2019 GR scheme does (HSC streams covered by the GR), otherwise by kind.
        $groups = [];
        if ($fullScheme && $this->rules->covers($grKey)) {
            $byCode = $subjects->keyBy('code');
            $used = [];
            foreach ($this->rules->layout($grKey) as $g) {
                $items = collect($g['codes'])->map(fn ($c) => $byCode[$c] ?? null)->filter()->values();
                if ($items->isEmpty()) {
                    continue;
                }
                $groups[] = ['label' => $g['label'], 'hint' => $this->pickHint($g['min'], $g['max']), 'subjects' => $items];
                $used = array_merge($used, $items->pluck('id')->all());
            }
            $rest = $subjects->reject(fn ($s) => in_array($s->id, $used, true));
            if ($rest->isNotEmpty()) {
                $groups[] = ['label' => __('Other subjects'), 'hint' => null, 'subjects' => $rest->values()];
            }
        } else {
            foreach ($subjects->groupBy('kind') as $kind => $items) {
                $groups[] = ['label' => __(Subject::KINDS[$kind] ?? $kind), 'hint' => null, 'subjects' => $items->values()];
            }
        }

        $selected = $application->subjects->pluck('subject_id')->all();
        $locked = $fullScheme ? $this->options->compulsoryIds($subjects) : [];

        return [
            'application' => $application,
            'groups' => $groups,
            'source' => $opts['source'],
            'languages' => $opts['languages'],
            'selected' => array_values(array_unique(array_merge($selected, $locked))),
            'locked' => $locked,
            'answerLanguages' => $application->subjects->pluck('answer_language', 'subject_id')->all(),
            'fullScheme' => $fullScheme,
            'reference' => $this->rules->covers($grKey) ? $this->rules->reference : null,
        ];
    }

    private function pickHint(int $min, int $max): string
    {
        if ($min === $max) {
            return __('Choose :count', ['count' => $min]);
        }
        return $min === 0 ? __('Up to :max', ['max' => $max]) : __('Choose :min to :max', ['min' => $min, 'max' => $max]);
    }

    private function saveSubjects(Request $request, Application $application): void
    {
        $opts = $this->options->for($application->institute, $application->stream, $application->board_id);
        $allowed = $opts['subjects']->pluck('id')->all();

        $data = $request->validate([
            'subject_ids' => ['required', 'array', 'min:1', 'max:12'],
            'subject_ids.*' => ['integer', Rule::in($allowed)],
            'answer_language' => ['array'],
            'answer_language.*' => ['nullable', Rule::in(array_keys(Codes::MEDIUMS))],
        ], [
            'subject_ids.required' => __('Choose at least one subject.'),
            'subject_ids.*.in' => __('One of the chosen subjects is not offered by your college.'),
        ]);

        $ids = array_values(array_unique(array_map('intval', $data['subject_ids'])));
        if (in_array($application->candidate_type, self::FULL_SCHEME_TYPES, true)) {
            $ids = array_values(array_unique(array_merge($this->options->compulsoryIds($opts['subjects']), $ids)));
        }

        $result = $this->evaluate($application, $ids);
        if (! $result['ok']) {
            throw ValidationException::withMessages(['subject_ids' => array_column($result['errors'], 'message')]);
        }

        DB::transaction(function () use ($application, $ids, $data, $opts) {
            $application->subjects()->whereNotIn('subject_id', $ids)->delete();
            $order = Subject::whereIn('id', $ids)->orderBy('sort')->orderBy('code')->pluck('id')->all();
            foreach ($order as $i => $id) {
                $language = $data['answer_language'][$id] ?? null;
                $language = $opts['languages'][$id] ?? $language ?: $application->student->medium;
                $application->subjects()->updateOrCreate(['subject_id' => $id], ['answer_language' => $language, 'sort' => $i]);
            }
        });
    }

    /** Rule check: the GR scheme for full-scheme candidates in covered HSC streams; basic checks otherwise. */
    public function evaluate(Application $application, array $ids): array
    {
        $subjects = Subject::whereIn('id', $ids)->get(['id', 'code', 'name', 'kind', 'papers']);
        $grKey = $application->stream?->gr_key;
        $fullScheme = in_array($application->candidate_type, self::FULL_SCHEME_TYPES, true);

        if ($subjects->isEmpty()) {
            return ['ok' => false, 'errors' => [['code' => 'NONE', 'message' => __('Choose at least one subject.')]], 'warnings' => [], 'summary' => ['papers' => 0]];
        }
        if ($fullScheme && $this->rules->covers($grKey)) {
            return $this->rules->validate($grKey, $subjects->pluck('code')->all(), $subjects->pluck('name', 'code')->all());
        }

        $warnings = [];
        if (! $fullScheme) {
            $warnings[] = ['code' => 'PARTIAL', 'message' => __('Choose only the subjects you are appearing for in this exam.')];
        } elseif ($subjects->count() < 6) {
            $warnings[] = ['code' => 'FEW', 'message' => __('Most candidates take 6 or more subjects. Check with your school if unsure.')];
        }
        return ['ok' => true, 'errors' => [], 'warnings' => $warnings, 'summary' => ['papers' => (int) $subjects->sum('papers')]];
    }

    /** Problems that stop the form from being paid for / sent. */
    public function blockingProblems(Application $application): array
    {
        $problems = [];
        if ($missing = $application->student->missingFields()) {
            $problems[] = __('Complete these student details: :fields', ['fields' => implode(', ', $missing)]);
        }
        $result = $this->evaluate($application, $application->subjects()->pluck('subject_id')->all());
        foreach ($result['errors'] as $e) {
            $problems[] = $e['message'];
        }
        if (! $application->exam->isOpen() && ! $application->isPaid()) {
            $problems[] = __('This exam is not accepting forms now.');
        }
        return $problems;
    }

    private function reviewData(Application $application): array
    {
        return [
            'application' => $application,
            'student' => $application->student,
            'fee' => $application->exam->feeFor($application->candidate_type),
            'problems' => $this->blockingProblems($application),
            'steps' => self::STEPS,
        ];
    }
}
