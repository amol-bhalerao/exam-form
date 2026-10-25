<?php

namespace App\Http\Controllers\Institute;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Student\ApplicationController as StudentForms;
use App\Models\Application;
use App\Models\Exam;
use App\Models\Subject;
use App\Services\ApplicationWorkflow;
use App\Services\SubjectOptions;
use App\Support\Codes;
use App\Support\FormQuery;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

/** The institute checks each paid form, corrects mistakes, and forwards it to the board (or sends it back). */
class FormController extends Controller
{
    public function __construct(private ApplicationWorkflow $workflow, private SubjectOptions $options) {}

    private function base(Request $request)
    {
        return Application::where('institute_id', $request->user()->institute_id);
    }

    public function index(Request $request)
    {
        $institute = $request->user()->institute;
        $query = FormQuery::apply($this->base($request)->where('status', '!=', Application::DRAFT), $request);
        if (! $request->filled('status') && ! $request->filled('q')) {
            $query->orderByRaw("CASE status WHEN 'submitted' THEN 0 WHEN 'board_returned' THEN 1 WHEN 'returned' THEN 2 WHEN 'verified' THEN 3 WHEN 'approved' THEN 4 ELSE 5 END");
        }

        return view('institute.forms.index', [
            'forms' => $query->with('student', 'exam', 'stream')->latest('submitted_at')->paginate(25)->withQueryString(),
            'counts' => FormQuery::statusCounts($this->base($request)),
            'exams' => Exam::where('board_id', $institute->board_id)->forDivision($institute->division_id)->latest('opens_at')->get(['id', 'name']),
            'streams' => $institute->streams,
            'drafts' => $this->base($request)->where('status', Application::DRAFT)->count(),
        ]);
    }

    public function export(Request $request)
    {
        $q = FormQuery::apply($this->base($request)->where('status', '!=', Application::DRAFT), $request);
        return FormQuery::export($q, 'exam-forms-' . $request->user()->institute->college_no . '-' . now()->format('Ymd') . '.csv');
    }

    public function show(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        $application->load('exam', 'student.previousExams', 'institute', 'stream', 'subjects.subject', 'events.user', 'payments');
        return view('institute.forms.show', ['application' => $application, 'workflow' => $this->workflow]);
    }

    public function edit(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        abort_unless($application->editableByInstitute(), 403, __('This form can no longer be corrected by the college.'));
        $application->load('exam', 'student', 'stream', 'subjects.subject');
        $opts = $this->options->for($application->institute, $application->stream, $application->board_id);
        return view('institute.forms.edit', [
            'application' => $application,
            'subjects' => $opts['subjects'],
            'selected' => $application->subjects->pluck('subject_id')->all(),
            'answerLanguages' => $application->subjects->pluck('answer_language', 'subject_id')->all(),
        ]);
    }

    public function update(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        abort_unless($application->editableByInstitute(), 403);
        $student = $application->student;
        $opts = $this->options->for($application->institute, $application->stream, $application->board_id);

        $v = $request->validate([
            'surname' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'first_name' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'middle_name' => ['nullable', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'mother_name' => ['required', 'string', 'max:80', 'regex:/^[A-Za-z .\'-]+$/'],
            'gender' => ['required', Rule::in(array_keys(Codes::GENDERS))],
            'dob' => ['required', 'date'],
            'category' => ['required', Rule::in(array_keys(Codes::CATEGORIES))],
            'medium' => ['required', Rule::in(array_keys(Codes::MEDIUMS))],
            'minority_religion' => ['nullable', Rule::in(array_keys(Codes::RELIGIONS))],
            'divyang' => ['nullable', Rule::in(array_keys(Codes::DIVYANG))],
            'mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'address' => ['required', 'string', 'max:300'],
            'exemption_status' => ['required', Rule::in(['NON_EXEMPTED', 'EXEMPTED'])],
            'exemptions_claimed' => ['nullable', 'integer', 'between:0,8'],
            'subject_group' => ['nullable', Rule::in(array_keys(Codes::SUBJECT_GROUPS))],
            'centre_no' => ['nullable', 'string', 'max:20'],
            'index_no' => ['nullable', 'string', 'max:20'],
            'subject_ids' => ['required', 'array', 'min:1', 'max:12'],
            'subject_ids.*' => ['integer', Rule::in($opts['subjects']->pluck('id')->all())],
            'answer_language' => ['array'],
            'answer_language.*' => ['nullable', Rule::in(array_keys(Codes::MEDIUMS))],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $ids = array_values(array_unique(array_map('intval', $v['subject_ids'])));
        $check = app(StudentForms::class)->evaluate($application, $ids);
        if (! $check['ok']) {
            return back()->withInput()->withErrors(['subject_ids' => array_column($check['errors'], 'message')]);
        }

        $changes = [];
        DB::transaction(function () use ($v, $student, $application, $ids, &$changes) {
            $studentFields = ['surname', 'first_name', 'middle_name', 'mother_name', 'gender', 'dob', 'category', 'medium', 'minority_religion', 'divyang', 'mobile', 'address'];
            foreach ($studentFields as $f) {
                $new = in_array($f, ['surname', 'first_name', 'middle_name', 'mother_name'], true) ? mb_strtoupper(trim((string) ($v[$f] ?? ''))) ?: null : ($v[$f] ?? null);
                $old = $f === 'dob' ? $student->dob?->format('Y-m-d') : $student->{$f};
                if ((string) $old !== (string) $new) {
                    $changes[$f] = ['from' => $old, 'to' => $new];
                    $student->{$f} = $new;
                }
            }
            $student->save();

            foreach (['exemption_status', 'exemptions_claimed', 'subject_group', 'centre_no', 'index_no'] as $f) {
                $new = $v[$f] ?? null;
                if ((string) $application->{$f} !== (string) $new) {
                    $changes[$f] = ['from' => $application->{$f}, 'to' => $new];
                    $application->{$f} = $f === 'exemptions_claimed' ? (int) $new : $new;
                }
            }
            $application->save();

            $before = $application->subjects()->with('subject')->get()->pluck('subject.code')->sort()->values()->all();
            $application->subjects()->whereNotIn('subject_id', $ids)->delete();
            $order = Subject::whereIn('id', $ids)->orderBy('sort')->orderBy('code')->pluck('id')->all();
            foreach ($order as $i => $id) {
                $application->subjects()->updateOrCreate(['subject_id' => $id], [
                    'answer_language' => $v['answer_language'][$id] ?? $student->medium, 'sort' => $i,
                ]);
            }
            $after = Subject::whereIn('id', $ids)->orderBy('code')->pluck('code')->sort()->values()->all();
            if ($before !== $after) {
                $changes['subjects'] = ['from' => implode(' ', $before), 'to' => implode(' ', $after)];
            }
            $this->workflow->logEdit($application, request()->user(), $changes, $v['note'] ?? null);
        });

        return redirect()->route('institute.forms.show', $application)
            ->with('status', $changes ? __('Corrections saved.') : __('No changes were made.'));
    }

    public function checkSubjects(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        return response()->json(app(StudentForms::class)->evaluate($application, array_map('intval', (array) $request->input('subject_ids', []))));
    }

    public function decide(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        $data = $request->validate([
            'action' => ['required', Rule::in(['verify', 'return'])],
            'note' => [$request->input('action') === 'return' ? 'required' : 'nullable', 'string', 'max:500'],
        ], ['note.required' => __('Write what the student must correct.')]);

        try {
            $this->workflow->apply($application, $data['action'], $request->user(), $data['note'] ?? null);
        } catch (InvalidArgumentException $e) {
            return back()->with('warning', $e->getMessage());
        }
        $msg = $data['action'] === 'verify'
            ? __('Form :no verified and forwarded to the board.', ['no' => $application->application_no])
            : __('Form :no sent back to the student for correction.', ['no' => $application->application_no]);

        $next = $request->boolean('next') ? $this->nextPending($request, $application) : null;
        return ($next ? redirect()->route('institute.forms.show', $next) : redirect()->route('institute.forms.index', ['status' => 'submitted']))->with('status', $msg);
    }

    /** Verify / forward many forms at once, or print them. */
    public function bulk(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['verify', 'print'])],
        ], ['ids.required' => __('Select at least one form.')]);

        $forms = $this->base($request)->whereIn('id', $data['ids'])->get();
        if ($data['action'] === 'print') {
            return redirect()->route('forms.print.bulk', ['ids' => $forms->pluck('id')->implode(',')]);
        }

        $done = 0;
        $skipped = 0;
        foreach ($forms as $form) {
            if ($this->workflow->can($form, 'verify', $request->user())) {
                $this->workflow->apply($form, 'verify', $request->user());
                $done++;
            } else {
                $skipped++;
            }
        }
        return back()->with('status', trans_choice(':count form forwarded to the board.|:count forms forwarded to the board.', $done, ['count' => $done]))
            ->with('warning', $skipped ? trans_choice(':count selected form was not waiting for verification and was skipped.|:count selected forms were not waiting for verification and were skipped.', $skipped, ['count' => $skipped]) : null);
    }

    private function authorizeForm(Request $request, Application $application): void
    {
        abort_unless($application->institute_id === $request->user()->institute_id && $application->status !== Application::DRAFT, 404);
    }

    private function nextPending(Request $request, Application $current): ?Application
    {
        return $this->base($request)->whereIn('status', [Application::SUBMITTED, Application::BOARD_RETURNED])
            ->where('id', '!=', $current->id)->oldest('submitted_at')->first();
    }
}
