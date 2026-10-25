<?php

namespace App\Http\Controllers\Teacher;

use App\Models\AuditLog;
use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use App\Services\Coach;
use App\Support\QuestionForm;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/** The shared question bank: browse everything approved, add and edit your own. */
class QuestionController extends TeacherController
{
    public function index(Request $request)
    {
        $subjects = $this->subjects($request);
        $subjectId = $request->integer('subject') ?: $this->defaultSubjectId($request) ?: $subjects->first()?->id;
        $questions = Question::query()->with('topic', 'options', 'author')->where('subject_id', $subjectId)
            ->when($request->query('topic'), fn ($q, $t) => $q->where('topic_id', $t))
            ->when($request->query('type'), fn ($q, $t) => $q->where('type', $t))
            ->when($request->query('level'), fn ($q, $l) => $q->where('difficulty', $l))
            ->when($request->query('mine'), fn ($q) => $q->where('created_by', $request->user()->id))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where('text', 'like', "%{$t}%"))
            ->where(fn ($q) => $q->where('status', 'approved')->orWhere('created_by', $request->user()->id))
            ->latest('id')->paginate(20)->withQueryString();

        return view('teacher.questions.index', [
            'subjects' => $subjects,
            'subject' => $subjects->firstWhere('id', $subjectId),
            'topics' => Topic::where('subject_id', $subjectId)->withCount('questions')->orderBy('sort')->get(),
            'questions' => $questions,
            'aiEnabled' => app(Coach::class)->enabled(),
        ]);
    }

    public function create(Request $request)
    {
        return $this->form($request, new Question([
            'subject_id' => $request->integer('subject') ?: $this->defaultSubjectId($request),
            'topic_id' => $request->integer('topic') ?: null, 'type' => 'single', 'difficulty' => 'medium',
        ]));
    }

    public function store(Request $request)
    {
        $v = QuestionForm::validate($request, $this->subjects($request)->pluck('id')->all());
        $q = QuestionForm::save(null, $v, ['status' => 'approved', 'source' => 'teacher', 'created_by' => $request->user()->id, 'institute_id' => $this->instituteId($request)]);
        AuditLog::record('question.created', $q);
        $next = $request->input('after') === 'another'
            ? redirect()->route('teacher.questions.create', ['subject' => $q->subject_id, 'topic' => $q->topic_id])
            : redirect()->route('teacher.questions.index', ['subject' => $q->subject_id, 'topic' => $q->topic_id]);
        return $next->with('status', __('Question saved.'));
    }

    public function edit(Request $request, Question $question)
    {
        $this->authorizeEdit($request, $question);
        return $this->form($request, $question->load('options', 'tips'));
    }

    public function update(Request $request, Question $question)
    {
        $this->authorizeEdit($request, $question);
        $v = QuestionForm::validate($request, $this->subjects($request)->pluck('id')->all());
        // Editing a student's pending question and saving it publishes it.
        $attrs = $question->status === 'pending'
            ? ['status' => 'approved', 'reviewed_by' => $request->user()->id, 'reviewed_at' => now()]
            : [];
        QuestionForm::save($question, $v, $attrs + ['created_by' => $question->created_by ?? $request->user()->id]);
        AuditLog::record('question.updated', $question);
        return redirect()->route('teacher.questions.index', ['subject' => $question->subject_id, 'topic' => $question->topic_id])->with('status', __('Question saved.'));
    }

    public function destroy(Request $request, Question $question)
    {
        $this->authorizeEdit($request, $question);
        if (DB::table('attempt_answers')->where('question_id', $question->id)->exists()) {
            $question->update(['status' => 'rejected']);
            return back()->with('status', __('Students have already answered this question, so it was hidden instead of deleted.'));
        }
        $question->delete();
        return back()->with('status', __('Question deleted.'));
    }

    /** Topics of a subject, for the cascading select. */
    public function topics(Request $request, Subject $subject)
    {
        abort_unless($this->subjects($request)->contains('id', $subject->id), 404);
        return response()->json(Topic::where('subject_id', $subject->id)->orderBy('sort')->get()->map(fn ($t) => ['id' => $t->id, 'label' => $t->label]));
    }

    /** Ask the AI for draft questions; they are saved for review by this teacher, not published. */
    public function draft(Request $request, Coach $coach)
    {
        $v = $request->validate([
            'subject_id' => ['required', 'in:' . $this->subjects($request)->pluck('id')->implode(',')],
            'topic_id' => ['required', 'exists:topics,id'],
            'count' => ['required', 'integer', 'between:1,15'],
            'difficulty' => ['required', 'in:easy,medium,hard'],
            'language' => ['required', 'in:English,Marathi,Hindi'],
        ]);
        abort_unless($coach->enabled(), 404);
        $subject = Subject::with('board')->findOrFail($v['subject_id']);
        $topic = Topic::findOrFail($v['topic_id']);
        $items = $coach->draftQuestions($subject, $topic->name, $v['count'], $v['difficulty'], $v['language']);
        $saved = 0;
        foreach ($items as $item) {
            $type = in_array($item['type'], array_keys(Question::TYPES), true) ? $item['type'] : 'single';
            $options = collect($item['options'])->map(fn ($o) => ['text' => trim((string) ($o['text'] ?? '')), 'correct' => (bool) ($o['correct'] ?? false)])->filter(fn ($o) => $o['text'] !== '')->values();
            if ($options->where('correct', true)->isEmpty() && $type !== 'fill_blank') {
                continue;
            }
            QuestionForm::save(null, [
                'subject_id' => $subject->id, 'topic_id' => $topic->id, 'type' => $type, 'difficulty' => $v['difficulty'],
                'text' => (string) $item['text'], 'explanation' => $item['explanation'] ?? null, 'tip' => $item['tip'] ?? null,
                'clean_options' => $type === 'fill_blank' ? $options->map(fn ($o) => ['text' => $o['text'], 'correct' => true])->all() : $options->all(),
            ], ['status' => 'pending', 'source' => 'ai', 'created_by' => $request->user()->id, 'institute_id' => $this->instituteId($request)]);
            $saved++;
        }
        return redirect()->route('teacher.reviews.index', ['tab' => 'questions'])
            ->with($saved ? 'status' : 'warning', $saved ? trans_choice(':count AI draft is waiting for your review.|:count AI drafts are waiting for your review.', $saved, ['count' => $saved]) : __('The AI could not draft questions right now. Try again in a minute.'));
    }

    private function form(Request $request, Question $question)
    {
        $subjects = $this->subjects($request);
        return view('teacher.questions.form', [
            'question' => $question,
            'subjects' => $subjects,
            'topics' => Topic::whereIn('subject_id', $subjects->pluck('id'))->orderBy('sort')->get(['id', 'subject_id', 'name', 'name_mr', 'name_hi'])
                ->groupBy('subject_id')->map(fn ($g) => $g->map(fn ($t) => ['id' => $t->id, 'label' => $t->label])->values()),
            'tip' => $question->exists ? $question->tips->first()?->text : null,
        ]);
    }

    private function authorizeEdit(Request $request, Question $question): void
    {
        $own = $question->created_by === $request->user()->id;
        $reviewable = $question->status === 'pending' && $question->institute_id === $this->instituteId($request);
        abort_unless($own || $reviewable, 403, __('You can edit only the questions you added, or students\' questions waiting for your review.'));
    }
}
