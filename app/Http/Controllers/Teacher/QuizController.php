<?php

namespace App\Http\Controllers\Teacher;

use App\Models\Attempt;
use App\Models\AuditLog;
use App\Models\Certificate;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\Topic;
use App\Services\QuizEngine;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/** Unit tests / class tests scheduled for this college's students, their results and certificates. */
class QuizController extends TeacherController
{
    public function index(Request $request)
    {
        $quizzes = Quiz::where('institute_id', $this->instituteId($request))->with('subject', 'stream', 'author')
            ->withCount(['attempts', 'attempts as finished_count' => fn ($q) => $q->where('status', '!=', Attempt::LIVE)])
            ->latest('starts_at')->paginate(20);
        return view('teacher.quizzes.index', compact('quizzes'));
    }

    public function create(Request $request)
    {
        $start = now()->addDay()->setTime(10, 0);
        return $this->form($request, new Quiz([
            'subject_id' => $this->defaultSubjectId($request), 'difficulty' => 'mixed', 'question_count' => 20, 'duration_minutes' => 30,
            'starts_at' => $start, 'ends_at' => $start->copy()->addHours(2), 'marks_per_question' => 1, 'negative_marks' => 0,
            'pass_percent' => 35, 'max_warnings' => 1, 'show_answers_after' => true, 'certificate_template' => 'paithani',
        ]));
    }

    public function store(Request $request)
    {
        [$data, $questionIds] = $this->validated($request);
        $quiz = DB::transaction(function () use ($request, $data, $questionIds) {
            $quiz = Quiz::create($data + ['institute_id' => $this->instituteId($request), 'created_by' => $request->user()->id]);
            $quiz->questions()->sync(collect($questionIds)->mapWithKeys(fn ($id, $i) => [$id => ['sort' => $i]])->all());
            return $quiz;
        });
        AuditLog::record('quiz.created', $quiz);
        return redirect()->route('teacher.quizzes.show', $quiz)->with('status', $quiz->status === 'published' ? __('Test scheduled. Students will see it on their dashboard.') : __('Test saved as a draft.'));
    }

    public function show(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        // Close sittings whose time is over before showing results.
        foreach ($quiz->attempts()->where('status', Attempt::LIVE)->get() as $a) {
            app(QuizEngine::class)->enforce($a->setRelation('quiz', $quiz));
        }
        $attempts = $quiz->attempts()->with('student', 'certificate')->orderByDesc('score')->get();
        $eligible = Student::where('institute_id', $quiz->institute_id)->when($quiz->stream_id, fn ($q) => $q->where('stream_id', $quiz->stream_id))->count();
        $byQuestion = DB::table('attempt_answers')->join('attempts', 'attempts.id', '=', 'attempt_answers.attempt_id')
            ->where('attempts.quiz_id', $quiz->id)->where('attempts.status', '!=', Attempt::LIVE)
            ->selectRaw('attempt_answers.question_id, count(*) as seen, sum(case when attempt_answers.is_correct = 1 then 1 else 0 end) as right_count')
            ->groupBy('attempt_answers.question_id')->get()->keyBy('question_id');
        $hardest = Question::whereIn('id', $byQuestion->keys())->with('topic')->get()
            ->map(fn ($q) => ['q' => $q, 'seen' => (int) $byQuestion[$q->id]->seen, 'right' => (int) $byQuestion[$q->id]->right_count])
            ->sortBy(fn ($r) => $r['right'] / max(1, $r['seen']))->take(8)->values();

        return view('teacher.quizzes.show', [
            'quiz' => $quiz->load('subject', 'stream'),
            'attempts' => $attempts,
            'eligible' => $eligible,
            'hardest' => $hardest,
            'templates' => Certificate::TEMPLATES,
        ]);
    }

    public function edit(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        return $this->form($request, $quiz->load('questions'));
    }

    public function update(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        [$data, $questionIds] = $this->validated($request, $quiz);
        if ($quiz->attempts()->exists()) {
            // Once students have started, only the window, rules text and certificate choice can change.
            $data = collect($data)->only(['title', 'instructions', 'ends_at', 'certificate_template', 'show_answers_after', 'status'])->all();
            $questionIds = null;
        }
        $quiz->update($data);
        if ($questionIds !== null) {
            $quiz->questions()->sync(collect($questionIds)->mapWithKeys(fn ($id, $i) => [$id => ['sort' => $i]])->all());
        }
        return redirect()->route('teacher.quizzes.show', $quiz)->with('status', __('Test saved.'));
    }

    public function destroy(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        if ($quiz->attempts()->exists()) {
            return back()->with('warning', __('Students have already taken this test, so it cannot be deleted.'));
        }
        $quiz->delete();
        return redirect()->route('teacher.quizzes.index')->with('status', __('Test deleted.'));
    }

    /** Issue certificates (for passed students, or everyone who finished) using one template. */
    public function certificates(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        $data = $request->validate([
            'template' => ['required', Rule::in(array_keys(Certificate::TEMPLATES))],
            'who' => ['required', Rule::in(['passed', 'all'])],
        ]);
        $attempts = $quiz->attempts()->where('status', '!=', Attempt::LIVE)->with('quiz')->get()
            ->filter(fn ($a) => $data['who'] === 'all' || $a->passed());
        $made = 0;
        foreach ($attempts as $a) {
            $cert = Certificate::firstOrNew(['quiz_id' => $quiz->id, 'student_id' => $a->student_id]);
            $cert->serial ??= strtoupper('C' . now()->format('y') . '-' . Str::random(8));
            $cert->fill(['attempt_id' => $a->id, 'template' => $data['template'], 'issued_by' => $request->user()->id])->save();
            $made++;
        }
        $quiz->update(['certificate_template' => $data['template']]);
        if (! $made) {
            return back()->with('warning', __('No student qualifies for a certificate yet.'));
        }
        return redirect()->route('teacher.quizzes.print', $quiz);
    }

    public function print(Request $request, Quiz $quiz)
    {
        $this->authorizeQuiz($request, $quiz);
        $certs = $quiz->certificates()->with('student', 'attempt')->get()->sortBy(fn ($c) => $c->student->full_name)->values();
        abort_if($certs->isEmpty(), 404);
        return view('print.certificates', ['quiz' => $quiz->load('subject', 'institute'), 'certificates' => $certs, 'teacher' => $request->user()]);
    }

    private function form(Request $request, Quiz $quiz)
    {
        $subjects = $this->subjects($request);
        $inst = $request->user()->institute;
        return view('teacher.quizzes.form', [
            'quiz' => $quiz, 'subjects' => $subjects, 'streams' => $inst->streams,
            'topics' => Topic::whereIn('subject_id', $subjects->pluck('id'))->withCount(['questions' => fn ($q) => $q->where('status', 'approved')])->orderBy('sort')->get()
                ->groupBy('subject_id')->map(fn ($g) => $g->map(fn ($t) => ['id' => $t->id, 'label' => $t->label, 'n' => $t->questions_count])->values()),
            'templates' => Certificate::TEMPLATES,
            'locked' => $quiz->exists && $quiz->attempts()->exists(),
        ]);
    }

    private function validated(Request $request, ?Quiz $quiz = null): array
    {
        $v = $request->validate([
            'title' => ['required', 'string', 'max:200'],
            'instructions' => ['nullable', 'string', 'max:2000'],
            'subject_id' => ['required', Rule::in($this->subjects($request)->pluck('id')->all())],
            'stream_id' => ['nullable', Rule::exists('institute_stream', 'stream_id')->where('institute_id', $this->instituteId($request))],
            'topic_ids' => ['array'],
            'topic_ids.*' => ['integer', Rule::exists('topics', 'id')->where('subject_id', $request->input('subject_id'))],
            'types' => ['array'],
            'types.*' => [Rule::in(array_keys(Question::TYPES))],
            'difficulty' => ['required', Rule::in(['mixed', 'easy', 'medium', 'hard'])],
            'question_count' => ['required', 'integer', 'between:1,200'],
            'duration_minutes' => ['required', 'integer', 'between:1,300'],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['required', 'date', 'after:starts_at'],
            'marks_per_question' => ['required', 'numeric', 'between:0.25,20'],
            'negative_marks' => ['nullable', 'numeric', 'between:0,10'],
            'pass_percent' => ['required', 'integer', 'between:0,100'],
            'max_warnings' => ['required', 'integer', 'between:0,5'],
            'show_answers_after' => ['nullable', 'boolean'],
            'certificate_template' => ['nullable', Rule::in(array_keys(Certificate::TEMPLATES))],
            'publish' => ['nullable', 'boolean'],
            'question_ids' => ['array'],
            'question_ids.*' => ['integer', 'exists:questions,id'],
        ]);
        $questionIds = array_values(array_unique(array_map('intval', $v['question_ids'] ?? [])));
        $available = Question::approved()->where('subject_id', $v['subject_id'])
            ->when($v['topic_ids'] ?? [], fn ($q, $t) => $q->whereIn('topic_id', $t))
            ->when($v['types'] ?? [], fn ($q, $t) => $q->whereIn('type', $t))
            ->when($v['difficulty'] !== 'mixed', fn ($q) => $q->where('difficulty', $v['difficulty']))->count();
        if (! $questionIds && $available === 0) {
            throw \Illuminate\Validation\ValidationException::withMessages(['topic_ids' => __('No approved questions match these choices. Add questions first or widen the topics, types or level.')]);
        }
        $data = collect($v)->except(['question_ids', 'publish'])->all();
        $data['topic_ids'] = array_map('intval', $v['topic_ids'] ?? []);
        $data['types'] = $v['types'] ?? [];
        $data['fixed_questions'] = $questionIds !== [];
        $data['question_count'] = $questionIds ? count($questionIds) : min((int) $v['question_count'], $available);
        $data['negative_marks'] = (float) ($v['negative_marks'] ?? 0);
        $data['show_answers_after'] = $request->boolean('show_answers_after');
        $data['starts_at'] = Carbon::parse($v['starts_at']);
        $data['ends_at'] = Carbon::parse($v['ends_at']);
        $data['status'] = $request->boolean('publish') ? 'published' : 'draft';
        return [$data, $questionIds];
    }

    private function authorizeQuiz(Request $request, Quiz $quiz): void
    {
        abort_unless($quiz->institute_id === $this->instituteId($request), 404);
    }
}
