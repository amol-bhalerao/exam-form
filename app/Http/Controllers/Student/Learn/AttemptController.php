<?php

namespace App\Http\Controllers\Student\Learn;

use App\Models\Attempt;
use App\Models\MemoryTip;
use App\Models\QuestionOption;
use App\Services\Coach;
use App\Services\QuizEngine;
use Illuminate\Http\Request;

/** Taking a practice set or test: the page, autosave, timer/heartbeat, warnings, submit and result. */
class AttemptController extends LearnController
{
    public function show(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $attempt = $engine->enforce($attempt->load('quiz'));
        if (! $attempt->isLive()) {
            return redirect()->route('learn.attempts.result', $attempt);
        }
        $attempt->load('answers.question.options', 'subject');
        $questions = $attempt->answers->sortBy('sort')->values()->map(function ($row) use ($attempt) {
            $q = $row->question;
            $byId = $q->options->keyBy('id');
            return [
                'id' => $q->id,
                'type' => $q->type,
                'text' => $q->text,
                'level' => $q->difficulty,
                'options' => collect($row->shown_options ?? [])->map(fn ($id) => $byId[$id] ?? null)->filter()->map(fn ($o) => ['id' => $o->id, 'text' => $o->text])->values(),
                'answer' => $row->answer ?? [],
                'checked' => $attempt->mode === 'practice' && $row->is_correct !== null ? $this->reveal($row) : null,
            ];
        });
        return view('learn.attempt', [
            'attempt' => $attempt,
            'questions' => $questions,
            'secondsLeft' => $attempt->secondsLeft(),
        ]);
    }

    /** Autosave one answer. In practice mode, "check" also grades it and returns the explanation. */
    public function answer(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $attempt = $engine->enforce($attempt->load('quiz'));
        if (! $attempt->isLive()) {
            return response()->json(['ended' => true, 'redirect' => route('learn.attempts.result', $attempt)]);
        }
        $v = $request->validate([
            'question_id' => ['required', 'integer'],
            'answer' => ['array', 'max:12'],
            'answer.*' => ['nullable', 'string', 'max:300'],
            'seconds' => ['nullable', 'integer', 'min:0'],
            'check' => ['nullable', 'boolean'],
        ]);
        $row = $attempt->answers()->where('question_id', $v['question_id'])->firstOrFail();
        if ($attempt->mode === 'practice' && $row->is_correct !== null) {
            return response()->json(['ok' => true, 'checked' => $this->reveal($row->load('question.options'))]);
        }
        $answer = array_values(array_filter($v['answer'] ?? [], fn ($a) => $a !== null && $a !== ''));
        $engine->saveAnswer($attempt, $row->question_id, $answer, (int) ($v['seconds'] ?? 0));
        $out = ['ok' => true];
        if ($attempt->mode === 'practice' && $request->boolean('check') && $answer) {
            $row->refresh()->load('question.options');
            $row->forceFill(['is_correct' => $row->question->check($answer)])->save();
            $out['checked'] = $this->reveal($row);
        }
        return response()->json($out);
    }

    public function heartbeat(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $attempt = $engine->heartbeat($attempt->load('quiz'));
        return response()->json($attempt->isLive()
            ? ['ok' => true, 'seconds_left' => $attempt->secondsLeft(), 'warnings' => $attempt->warnings]
            : ['ended' => true, 'redirect' => route('learn.attempts.result', $attempt)]);
    }

    /** The test page was hidden (switched app/tab) or closed. Also called with navigator.sendBeacon. */
    public function warn(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $what = $request->input('what') === 'closed' ? 'closed' : 'hidden';
        $attempt = $engine->warn($attempt->load('quiz'), $what);
        return response()->json($attempt->isLive()
            ? ['ok' => true, 'warnings' => $attempt->warnings, 'limit' => $attempt->quiz?->max_warnings ?? 1]
            : ['ended' => true, 'redirect' => route('learn.attempts.result', $attempt)]);
    }

    public function submit(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $engine->finish($attempt->load('quiz'));
        return redirect()->route('learn.attempts.result', $attempt);
    }

    public function result(Request $request, Attempt $attempt, QuizEngine $engine)
    {
        $this->own($request, $attempt);
        $attempt = $engine->enforce($attempt->load('quiz'));
        if ($attempt->isLive()) {
            return redirect()->route('learn.attempts.show', $attempt);
        }
        $attempt->load('answers.question.options', 'answers.question.topic', 'subject', 'quiz', 'certificate');
        $showAnswers = $attempt->mode === 'practice' || ($attempt->quiz?->show_answers_after && $attempt->quiz->ends_at->isPast());
        $tips = $showAnswers ? MemoryTip::approved()->whereIn('question_id', $attempt->answers->pluck('question_id'))->orderByDesc('likes')->get()->groupBy('question_id') : collect();
        $liked = $showAnswers ? \DB::table('memory_tip_likes')->where('user_id', $request->user()->id)->pluck('memory_tip_id')->all() : [];
        return view('learn.result', [
            'attempt' => $attempt,
            'answers' => $attempt->answers->sortBy('sort')->values(),
            'topics' => QuizEngine::topicStats($attempt->answers->whereNotNull('is_correct')),
            'showAnswers' => $showAnswers,
            'tips' => $tips,
            'liked' => $liked,
            'feedback' => $attempt->ai_feedback,
        ]);
    }

    /** AI / built-in feedback is generated on demand (it can take a few seconds). */
    public function feedback(Request $request, Attempt $attempt, Coach $coach)
    {
        $this->own($request, $attempt);
        abort_if($attempt->isLive(), 409);
        return response()->json(['text' => $coach->forAttempt($attempt), 'source' => $attempt->fresh()->ai_source]);
    }

    private function reveal($row): array
    {
        $q = $row->question;
        return [
            'correct' => (bool) $row->is_correct,
            'right_ids' => $q->options->where('is_correct', true)->pluck('id')->values(),
            'answer_text' => $q->answerText(),
            'explanation' => $q->explanation,
            'tips' => MemoryTip::approved()->where('question_id', $q->id)->orderByDesc('likes')->limit(3)->pluck('text'),
        ];
    }

    private function own(Request $request, Attempt $attempt): void
    {
        abort_unless($attempt->user_id === $request->user()->id && $request->user()->students()->whereKey($attempt->student_id)->exists(), 404);
    }
}
