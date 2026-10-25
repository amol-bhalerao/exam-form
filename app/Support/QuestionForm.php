<?php

namespace App\Support;

use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\Topic;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/** Validates and saves a question with its options — shared by teachers and student contributions. */
final class QuestionForm
{
    public static function validate(Request $request, array $subjectIds): array
    {
        $v = $request->validate([
            'subject_id' => ['required', Rule::in($subjectIds)],
            'topic_id' => ['nullable', Rule::exists('topics', 'id')->where('subject_id', $request->input('subject_id'))],
            'new_topic' => ['nullable', 'string', 'max:150'],
            'type' => ['required', Rule::in(array_keys(Question::TYPES))],
            'difficulty' => ['required', Rule::in(array_keys(Question::LEVELS))],
            'text' => ['required', 'string', 'max:2000'],
            'explanation' => ['nullable', 'string', 'max:2000'],
            'tip' => ['nullable', 'string', 'max:500'],
            'tf_answer' => ['nullable', Rule::in(['True', 'False'])],
            'options' => ['array', 'max:12'],
            'options.*.text' => ['nullable', 'string', 'max:500'],
            'options.*.correct' => ['nullable', 'boolean'],
        ]);

        $options = collect($v['options'] ?? [])->map(fn ($o) => ['text' => trim((string) ($o['text'] ?? '')), 'correct' => (bool) ($o['correct'] ?? false)])
            ->filter(fn ($o) => $o['text'] !== '')->unique('text')->values();
        $right = $options->where('correct', true)->count();
        $wrong = $options->where('correct', false)->count();
        $error = match ($v['type']) {
            'single' => $right !== 1 ? __('Mark exactly one correct answer.') : ($wrong < 3 ? __('Add at least three wrong answers. Add more than three and the portal shows a different set each time.') : null),
            'multi' => $right < 2 ? __('Mark at least two correct answers.') : ($wrong < 2 ? __('Add at least two wrong answers.') : null),
            'true_false' => empty($v['tf_answer']) ? __('Choose whether the statement is true or false.') : null,
            'fill_blank' => ! str_contains($v['text'], '___') ? __('Put ____ (four underscores) where the blank should be.') : ($right + $wrong < 1 ? __('Add at least one accepted answer.') : null),
        };
        if ($error) {
            throw ValidationException::withMessages(['options' => $error]);
        }
        $v['clean_options'] = match ($v['type']) {
            'true_false' => [['text' => 'True', 'correct' => $v['tf_answer'] === 'True'], ['text' => 'False', 'correct' => $v['tf_answer'] === 'False']],
            'fill_blank' => $options->map(fn ($o) => ['text' => $o['text'], 'correct' => true])->all(),
            default => $options->all(),
        };
        return $v;
    }

    public static function save(?Question $question, array $v, array $attrs): Question
    {
        return DB::transaction(function () use ($question, $v, $attrs) {
            $topicId = $v['topic_id'] ?? null;
            if (! $topicId && filled($v['new_topic'] ?? null)) {
                $topicId = Topic::firstOrCreate(['subject_id' => $v['subject_id'], 'name' => trim($v['new_topic'])],
                    ['sort' => (Topic::where('subject_id', $v['subject_id'])->max('sort') ?? 0) + 1])->id;
            }
            $data = ['subject_id' => $v['subject_id'], 'topic_id' => $topicId, 'type' => $v['type'], 'difficulty' => $v['difficulty'],
                'text' => trim($v['text']), 'explanation' => $v['explanation'] ?? null] + $attrs;
            $question ? $question->update($data) : $question = Question::create($data);
            // Keep option ids that still exist so earlier results still show what was chosen.
            $existing = $question->options()->get()->keyBy(fn ($o) => mb_strtolower($o->text));
            $keep = [];
            foreach ($v['clean_options'] as $i => $o) {
                $row = $existing->pull(mb_strtolower($o['text'])) ?? $question->options()->make();
                $row->fill(['text' => $o['text'], 'is_correct' => $o['correct'], 'sort' => $i])->save();
                $keep[] = $row->id;
            }
            $question->options()->whereNotIn('id', $keep)->delete();
            if (filled($v['tip'] ?? null)) {
                MemoryTip::updateOrCreate(['question_id' => $question->id, 'user_id' => $attrs['created_by'] ?? null],
                    ['text' => trim($v['tip']), 'topic_id' => $topicId, 'status' => $attrs['status'] ?? 'approved', 'institute_id' => $attrs['institute_id'] ?? null]);
            }
            return $question;
        });
    }
}
