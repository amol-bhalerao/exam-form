<?php

namespace App\Http\Controllers\Student\Learn;

use App\Models\Question;
use App\Models\Topic;
use App\Services\QuizEngine;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use RuntimeException;

/** Self-practice: the student chooses subject, topics, level, question types, count and timer. */
class PracticeController extends LearnController
{
    public const PRESETS = [
        'quick' => ['count' => 10, 'minutes' => 0, 'difficulty' => 'mixed'],
        'timed' => ['count' => 20, 'minutes' => 15, 'difficulty' => 'mixed'],
        'challenge' => ['count' => 25, 'minutes' => 20, 'difficulty' => 'hard'],
    ];

    public function create(Request $request)
    {
        $student = $this->learner($request);
        $subjects = $this->subjects($student)->where('questions_count', '>', 0)->values();
        $topics = Topic::whereIn('subject_id', $subjects->pluck('id'))
            ->withCount(['questions' => fn ($q) => $q->where('status', 'approved')])->orderBy('sort')->get()
            ->groupBy('subject_id')->map(fn ($g) => $g->filter(fn ($t) => $t->questions_count > 0)->map(fn ($t) => ['id' => $t->id, 'label' => $t->label, 'n' => $t->questions_count])->values());
        return view('learn.practice', [
            'subjects' => $subjects,
            'topics' => $topics,
            'subjectId' => $request->integer('subject') ?: $subjects->first()?->id,
            'topicId' => $request->integer('topic') ?: null,
        ]);
    }

    public function store(Request $request, QuizEngine $engine)
    {
        $student = $this->learner($request);
        $v = $request->validate([
            'subject_id' => ['required', Rule::in($this->subjects($student)->pluck('id')->all())],
            'topic_ids' => ['array'],
            'topic_ids.*' => ['integer'],
            'types' => ['array'],
            'types.*' => [Rule::in(array_keys(Question::TYPES))],
            'difficulty' => ['required', Rule::in(['mixed', 'easy', 'medium', 'hard'])],
            'count' => ['required', 'integer', 'between:5,50'],
            'minutes' => ['required', 'integer', 'between:0,120'],
        ]);
        try {
            $attempt = $engine->startPractice($student, $request->user()->id, (int) $v['subject_id'], [
                'topic_ids' => array_map('intval', $v['topic_ids'] ?? []), 'types' => $v['types'] ?? [],
                'difficulty' => $v['difficulty'], 'count' => (int) $v['count'], 'minutes' => (int) $v['minutes'],
            ]);
        } catch (RuntimeException $e) {
            return back()->withInput()->with('warning', $e->getMessage());
        }
        return redirect()->route('learn.attempts.show', $attempt);
    }

    /** "Practise my weak topics" — builds a set from the topics answered worst in the last 30 days. */
    public function weak(Request $request, QuizEngine $engine)
    {
        $student = $this->learner($request);
        $answers = \App\Models\AttemptAnswer::whereIn('attempt_id', \App\Models\Attempt::where('student_id', $student->id)->where('created_at', '>=', now()->subDays(30))->pluck('id'))
            ->whereNotNull('is_correct')->with('question:id,subject_id,topic_id')->get();
        $bySubject = $answers->groupBy(fn ($a) => $a->question->subject_id)->sortByDesc(fn ($g) => $g->where('is_correct', false)->count());
        $subjectId = $request->integer('subject') ?: $bySubject->keys()->first();
        if (! $subjectId) {
            return redirect()->route('learn.practice.create')->with('warning', __('Practise a few sets first — then the portal knows your weak topics.'));
        }
        $topicIds = ($bySubject[$subjectId] ?? collect())->groupBy(fn ($a) => $a->question->topic_id)
            ->map(fn ($g) => $g->where('is_correct', true)->count() / $g->count())->sort()->keys()->filter()->take(3)->values()->all();
        try {
            $attempt = $engine->startPractice($student, $request->user()->id, (int) $subjectId, ['topic_ids' => $topicIds, 'types' => [], 'difficulty' => 'mixed', 'count' => 15, 'minutes' => 0, 'weak' => true]);
        } catch (RuntimeException $e) {
            return redirect()->route('learn.practice.create')->with('warning', $e->getMessage());
        }
        return redirect()->route('learn.attempts.show', $attempt);
    }
}
