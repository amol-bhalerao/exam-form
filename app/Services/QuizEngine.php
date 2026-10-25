<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Student;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/** Builds practice sets and tests, saves answers, grades, and enforces test rules. */
class QuizEngine
{
    /** A test is ended if the page has not checked in for this long (closed tab, lost device). */
    public const HEARTBEAT_GRACE = 75;

    /**
     * Pick questions: approved, from the subject (and topics/types/level if given), favouring
     * ones this student has not seen recently.
     */
    public function pick(int $subjectId, array $topicIds, array $types, string $difficulty, int $count, ?Student $student = null): Collection
    {
        $q = Question::approved()->where('subject_id', $subjectId)
            ->when($topicIds, fn ($w) => $w->whereIn('topic_id', $topicIds))
            ->when($types, fn ($w) => $w->whereIn('type', $types))
            ->when(in_array($difficulty, ['easy', 'medium', 'hard'], true), fn ($w) => $w->where('difficulty', $difficulty));

        $ids = $q->pluck('id');
        if ($student && $ids->count() > $count) {
            $recent = AttemptAnswer::query()->whereIn('attempt_id', Attempt::where('student_id', $student->id)->latest('id')->limit(10)->pluck('id'))
                ->pluck('question_id')->unique();
            $fresh = $ids->diff($recent)->shuffle();
            $ids = $fresh->concat($ids->intersect($recent)->shuffle())->take($count);
        } else {
            $ids = $ids->shuffle()->take($count);
        }
        return Question::with('options')->whereIn('id', $ids)->get()->shuffle();
    }

    public function startPractice(Student $student, int $userId, int $subjectId, array $config): Attempt
    {
        $questions = $this->pick($subjectId, $config['topic_ids'] ?? [], $config['types'] ?? [], $config['difficulty'] ?? 'mixed', (int) $config['count'], $student);
        if ($questions->isEmpty()) {
            throw new RuntimeException(__('No questions match these choices yet. Try another topic, level or question type.'));
        }
        $minutes = (int) ($config['minutes'] ?? 0);
        return $this->create($questions, [
            'student_id' => $student->id, 'user_id' => $userId, 'subject_id' => $subjectId, 'mode' => 'practice', 'config' => $config,
            'started_at' => now(), 'deadline_at' => $minutes > 0 ? now()->addMinutes($minutes) : null, 'last_seen_at' => now(),
        ], 1.0);
    }

    /** One sitting per student per test. */
    public function startTest(Quiz $quiz, Student $student, int $userId): Attempt
    {
        if ($existing = Attempt::where('quiz_id', $quiz->id)->where('student_id', $student->id)->first()) {
            return $existing;
        }
        $questions = $quiz->fixed_questions
            ? $quiz->questions()->with('options')->get()->shuffle()
            : $this->pick($quiz->subject_id, $quiz->topic_ids ?? [], $quiz->types ?? [], $quiz->difficulty, $quiz->question_count, $student);
        if ($questions->isEmpty()) {
            throw new RuntimeException(__('This test has no questions yet. Please tell your teacher.'));
        }
        // The timer never runs past the end of the test window.
        $deadline = now()->addMinutes($quiz->duration_minutes)->min($quiz->ends_at);
        return $this->create($questions, [
            'quiz_id' => $quiz->id, 'student_id' => $student->id, 'user_id' => $userId, 'subject_id' => $quiz->subject_id, 'mode' => 'test',
            'started_at' => now(), 'deadline_at' => $deadline, 'last_seen_at' => now(),
        ], (float) $quiz->marks_per_question);
    }

    private function create(Collection $questions, array $attrs, float $marks): Attempt
    {
        return DB::transaction(function () use ($questions, $attrs, $marks) {
            $attempt = Attempt::create($attrs + ['max_score' => $questions->count() * $marks]);
            foreach ($questions->values() as $i => $question) {
                $attempt->answers()->create(['question_id' => $question->id, 'sort' => $i, 'shown_options' => $question->pickOptions()]);
            }
            return $attempt;
        });
    }

    /** Close the attempt if its time is up or (tests only) the page stopped checking in. */
    public function enforce(Attempt $attempt): Attempt
    {
        if (! $attempt->isLive()) {
            return $attempt;
        }
        if ($attempt->deadline_at && now()->gte($attempt->deadline_at)) {
            return $this->finish($attempt, 'timed_out', __('Time was up.'));
        }
        if ($attempt->mode === 'test' && $attempt->last_seen_at && $attempt->last_seen_at->diffInSeconds(now()) > self::HEARTBEAT_GRACE) {
            return $this->finish($attempt, 'terminated', __('The test page was closed during the test.'));
        }
        return $attempt;
    }

    public function heartbeat(Attempt $attempt): Attempt
    {
        $attempt = $this->enforce($attempt);
        if ($attempt->isLive()) {
            $attempt->forceFill(['last_seen_at' => now()])->save();
        }
        return $attempt;
    }

    public function saveAnswer(Attempt $attempt, int $questionId, array $answer, int $seconds = 0): void
    {
        $row = $attempt->answers()->where('question_id', $questionId)->firstOrFail();
        $row->forceFill(['answer' => array_values($answer), 'seconds' => min(3600, $row->seconds + max(0, $seconds))])->save();
        $attempt->forceFill(['last_seen_at' => now()])->save();
    }

    /** The page was hidden or closed. Returns the attempt (ended if over the allowed warnings). */
    public function warn(Attempt $attempt, string $what): Attempt
    {
        if (! $attempt->isLive() || $attempt->mode !== 'test') {
            return $attempt;
        }
        $attempt->increment('warnings');
        $limit = $attempt->quiz?->max_warnings ?? 1;
        if ($what === 'closed' || $attempt->warnings > $limit) {
            return $this->finish($attempt, 'terminated', $what === 'closed' ? __('The test page was closed during the test.') : __('Left the test page too many times.'));
        }
        return $attempt;
    }

    /** Grade every answer and close the attempt. Unanswered questions count as skipped. */
    public function finish(Attempt $attempt, string $status = 'submitted', ?string $reason = null): Attempt
    {
        return DB::transaction(function () use ($attempt, $status, $reason) {
            $attempt = Attempt::lockForUpdate()->findOrFail($attempt->id);
            if (! $attempt->isLive()) {
                return $attempt;
            }
            $perQuestion = $attempt->mode === 'test' ? (float) ($attempt->quiz->marks_per_question ?? 1) : 1.0;
            $negative = $attempt->mode === 'test' ? (float) ($attempt->quiz->negative_marks ?? 0) : 0.0;
            $correct = $wrong = $skipped = 0;
            $score = 0.0;
            foreach ($attempt->answers()->with('question.options')->get() as $row) {
                $result = $row->question->check($row->answer ?? []);
                $marks = $result === true ? $perQuestion : ($result === false ? -$negative : 0);
                $row->forceFill(['is_correct' => $result, 'marks' => $marks])->save();
                $result === true ? $correct++ : ($result === false ? $wrong++ : $skipped++);
                $score += $marks;
            }
            $attempt->forceFill([
                'status' => $status, 'end_reason' => $reason, 'submitted_at' => now(),
                'score' => round($score, 2), 'correct' => $correct, 'wrong' => $wrong, 'skipped' => $skipped,
            ])->save();
            return $attempt;
        });
    }

    /** Accuracy per topic over a set of graded answers: [topic name => [right, total]]. */
    public static function topicStats(iterable $answers): array
    {
        $stats = [];
        foreach ($answers as $a) {
            $name = $a->question->topic?->label ?? __('General');
            $stats[$name] ??= ['right' => 0, 'total' => 0, 'seconds' => 0];
            $stats[$name]['total']++;
            $stats[$name]['right'] += $a->is_correct ? 1 : 0;
            $stats[$name]['seconds'] += $a->seconds;
        }
        uasort($stats, fn ($x, $y) => ($x['right'] / max(1, $x['total'])) <=> ($y['right'] / max(1, $y['total'])));
        return $stats;
    }
}
