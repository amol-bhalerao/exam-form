<?php

namespace App\Services;

use App\Models\Attempt;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Study coach: reads a finished attempt (or a student's practice history) and writes short,
 * practical advice. Uses the Claude API when a key is configured, otherwise a built-in analysis.
 */
class Coach
{
    public function enabled(): bool
    {
        return filled(config('services.anthropic.key'));
    }

    /** Feedback for one finished attempt, stored on the attempt so it is generated once. */
    public function forAttempt(Attempt $attempt): string
    {
        if ($attempt->ai_feedback) {
            return $attempt->ai_feedback;
        }
        $attempt->loadMissing('answers.question.topic', 'answers.question.options', 'subject');
        $stats = QuizEngine::topicStats($attempt->answers);
        $text = null;
        $source = 'builtin';
        if ($this->enabled()) {
            $wrong = $attempt->answers->filter(fn ($a) => $a->is_correct === false)->take(12)->map(fn ($a) => sprintf(
                '- [%s] %s | correct: %s', $a->question->topic?->name ?? 'General', strip_tags($a->question->text), $a->question->answerText()
            ))->implode("\n");
            $topicLines = collect($stats)->map(fn ($s, $t) => "- {$t}: {$s['right']}/{$s['total']} correct, avg " . round($s['seconds'] / max(1, $s['total'])) . 's per question')->implode("\n");
            $prompt = "Subject: {$attempt->subject->name}. Score: {$attempt->correct} correct, {$attempt->wrong} wrong, {$attempt->skipped} skipped out of " . $attempt->answers->count() . ".\n"
                . "By topic:\n{$topicLines}\nQuestions answered wrongly:\n" . ($wrong ?: '- none') . "\n\n"
                . "Write feedback for this student in 120-180 words: 1) what went well, 2) the two or three topics to focus on and why, "
                . "3) a concrete plan for the next 3 days (short daily sessions), 4) one memory trick for a question they got wrong. "
                . 'Use simple language a 15-17 year old understands. Use short headings and bullet points. No preamble.';
            $text = $this->ask($prompt);
            $source = $text ? 'ai' : 'builtin';
        }
        $text ??= $this->builtin($attempt, $stats);
        $attempt->forceFill(['ai_feedback' => $text, 'ai_source' => $source])->save();
        return $text;
    }

    /** Overview of a student's recent practice (progress page). Not stored; cheap built-in version unless asked. */
    public function overview(Student $student, bool $useAi = false): string
    {
        $answers = \App\Models\AttemptAnswer::query()
            ->whereIn('attempt_id', Attempt::where('student_id', $student->id)->where('status', '!=', Attempt::LIVE)->where('created_at', '>=', now()->subDays(30))->pluck('id'))
            ->whereNotNull('is_correct')->with('question.topic', 'question.subject')->get();
        if ($answers->isEmpty()) {
            return __('Start a practice set and your personal study plan will appear here.');
        }
        $bySubject = $answers->groupBy(fn ($a) => $a->question->subject->label);
        $lines = [];
        foreach ($bySubject as $subject => $list) {
            $stats = QuizEngine::topicStats($list);
            $weak = collect($stats)->filter(fn ($s) => $s['total'] >= 2 && $s['right'] / $s['total'] < .6)->keys()->take(3);
            $acc = round($list->where('is_correct', true)->count() / $list->count() * 100);
            $lines[] = ['subject' => $subject, 'accuracy' => $acc, 'weak' => $weak->all(), 'count' => $list->count()];
        }
        if ($useAi && $this->enabled()) {
            $summary = collect($lines)->map(fn ($l) => "- {$l['subject']}: {$l['accuracy']}% of {$l['count']} answers correct; weak topics: " . (implode(', ', $l['weak']) ?: 'none'))->implode("\n");
            $ai = $this->ask("A student's last 30 days of practice:\n{$summary}\n\nWrite a weekly study plan in 120-160 words with short headings and bullets: which subjects/topics first, how many minutes a day, and one motivating line. Simple language, no preamble.");
            if ($ai) {
                return $ai;
            }
        }
        $out = [];
        foreach (collect($lines)->sortBy('accuracy') as $l) {
            $out[] = '• ' . __(':subject — :pct% correct over :n answers.', ['subject' => $l['subject'], 'pct' => $l['accuracy'], 'n' => $l['count']])
                . ($l['weak'] ? ' ' . __('Focus on: :topics.', ['topics' => implode(', ', $l['weak'])]) : ' ' . __('Keep it up — try harder questions.'));
        }
        return implode("\n", $out);
    }

    /** Draft questions for a teacher to review (AI only). Returns a list of question arrays. */
    public function draftQuestions(Subject $subject, string $topic, int $count, string $difficulty, string $language = 'English'): array
    {
        if (! $this->enabled()) {
            return [];
        }
        $board = $subject->board->code === 'SSC' ? 'Maharashtra State Board SSC (Std X)' : 'Maharashtra State Board HSC (Std XII)';
        $prompt = "Write {$count} {$difficulty} exam practice questions in {$language} for {$board}, subject \"{$subject->name}\", topic \"{$topic}\". "
            . 'Mix types: single (one correct + 5 wrong options), multi (2-3 correct + 3-4 wrong), true_false, fill_blank (accepted answers as correct options). '
            . 'Facts must be accurate for the current textbook. Return ONLY a JSON array, each item: '
            . '{"type":"single|multi|true_false|fill_blank","text":"...","options":[{"text":"...","correct":true}],"explanation":"one or two sentences","tip":"a short way to remember the answer"}';
        $raw = $this->ask($prompt, 4000);
        if (! $raw) {
            return [];
        }
        $json = substr($raw, (int) strpos($raw, '['), strrpos($raw, ']') - (int) strpos($raw, '[') + 1);
        $items = json_decode($json, true);
        return is_array($items) ? array_values(array_filter($items, fn ($i) => isset($i['type'], $i['text']) && is_array($i['options'] ?? null))) : [];
    }

    private function ask(string $prompt, int $maxTokens = 900): ?string
    {
        try {
            $lang = ['mr' => 'Marathi', 'hi' => 'Hindi'][app()->getLocale()] ?? 'English';
            $res = Http::timeout(40)->withHeaders([
                'x-api-key' => config('services.anthropic.key'),
                'anthropic-version' => '2023-06-01',
            ])->post('https://api.anthropic.com/v1/messages', [
                'model' => config('services.anthropic.model'),
                'max_tokens' => $maxTokens,
                'system' => "You are a friendly, precise study coach for Maharashtra board students. Reply in {$lang} unless asked to produce JSON.",
                'messages' => [['role' => 'user', 'content' => $prompt]],
            ]);
            if (! $res->successful()) {
                report(new \RuntimeException('Claude API error: ' . $res->status() . ' ' . mb_substr($res->body(), 0, 300)));
                return null;
            }
            return trim(collect($res->json('content'))->where('type', 'text')->pluck('text')->implode("\n")) ?: null;
        } catch (Throwable $e) {
            report($e);
            return null;
        }
    }

    /** Built-in analysis: strengths, weak topics, speed and a 3-day plan. */
    private function builtin(Attempt $attempt, array $stats): string
    {
        $total = max(1, $attempt->answers->count());
        $pct = round($attempt->correct / $total * 100);
        $lines = [];
        $lines[] = $pct >= 80 ? __('Excellent work — :pct% correct.', ['pct' => $pct])
            : ($pct >= 50 ? __('Good effort — :pct% correct. A little more practice will lift this quickly.', ['pct' => $pct])
            : __(':pct% correct. Do not worry — this shows exactly where to practise next.', ['pct' => $pct]));

        $strong = collect($stats)->filter(fn ($s) => $s['total'] >= 1 && $s['right'] === $s['total'])->keys()->take(3);
        $weak = collect($stats)->filter(fn ($s) => $s['right'] / max(1, $s['total']) < .6)->keys()->take(3);
        if ($strong->isNotEmpty()) {
            $lines[] = '✓ ' . __('Strong: :topics.', ['topics' => $strong->implode(', ')]);
        }
        if ($weak->isNotEmpty()) {
            $lines[] = '→ ' . __('Focus next on: :topics.', ['topics' => $weak->implode(', ')]);
        }
        if ($attempt->skipped > 0) {
            $lines[] = '• ' . __(':n question(s) were left blank. In the board exam, attempt every objective question — there is no negative marking.', ['n' => $attempt->skipped]);
        }
        $avg = round($attempt->answers->sum('seconds') / $total);
        if ($avg > 0) {
            $lines[] = '• ' . ($avg > 75 ? __('You took about :s seconds per question. Read the options first, eliminate the clearly wrong ones, then decide.', ['s' => $avg])
                : __('Good speed — about :s seconds per question.', ['s' => $avg]));
        }
        $first = $weak->first() ?? collect($stats)->keys()->first();
        $lines[] = __('3-day plan:');
        $lines[] = '1. ' . __('Today: read the explanations of every wrong answer below and note one memory tip for each.');
        $lines[] = '2. ' . __('Tomorrow: practise 10 easy questions on :topic, then 10 medium ones.', ['topic' => $first]);
        $lines[] = '3. ' . __('Day 3: take a timed mixed practice set and compare your score with today.');
        return implode("\n", $lines);
    }
}
