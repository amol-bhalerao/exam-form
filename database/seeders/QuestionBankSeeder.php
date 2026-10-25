<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\Subject;
use App\Models\Topic;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Starter question bank (database/data/questions/*.txt). Safe to run again: questions that already
 * exist (same subject and text) are skipped.
 */
class QuestionBankSeeder extends Seeder
{
    public function run(): void
    {
        $added = 0;
        DB::transaction(function () use (&$added) {
            foreach (glob(database_path('data/questions/*.txt')) as $file) {
                $subject = null;
                $topic = null;
                $sort = [];
                foreach (file($file, FILE_IGNORE_NEW_LINES) as $line) {
                    $line = trim($line);
                    if ($line === '' || str_starts_with($line, '# Format') || str_starts_with($line, '#   ') || str_starts_with($line, '# "@')) {
                        continue;
                    }
                    if (str_starts_with($line, '@')) {
                        [$boardCode, $code] = preg_split('/\s+/', trim(substr($line, 1)));
                        $boardId = Board::where('code', $boardCode)->value('id');
                        $subject = Subject::where('board_id', $boardId)->where('code', $code)->first();
                        $topic = null;
                        continue;
                    }
                    if (! $subject) {
                        continue;
                    }
                    if (str_starts_with($line, '#')) {
                        if (str_starts_with($line, '# Chapter lists')) {
                            continue;
                        }
                        [$name, $mr] = array_pad(array_map('trim', explode('|', substr($line, 1), 2)), 2, null);
                        $sort[$subject->id] = ($sort[$subject->id] ?? Topic::where('subject_id', $subject->id)->max('sort') ?? 0) + 1;
                        $topic = Topic::firstOrCreate(['subject_id' => $subject->id, 'name' => $name], ['name_mr' => $mr, 'sort' => $sort[$subject->id]]);
                        continue;
                    }
                    $added += $this->question($subject, $topic, $line) ? 1 : 0;
                }
            }
        });
        $this->command?->info("Question bank: {$added} questions added.");
    }

    private function question(Subject $subject, ?Topic $topic, string $line): bool
    {
        $p = array_map('trim', explode('~', $line));
        if (count($p) === 8) {
            $p = [...array_slice($p, 0, 4), $p[4] . ' ^ ' . $p[5], $p[6], $p[7]];
        }
        if (count($p) !== 7) {
            return false;
        }
        [$type, $level, $text, $right, $wrong, $explanation, $tip] = $p;
        $type = ['s' => 'single', 'm' => 'multi', 'tf' => 'true_false', 'f' => 'fill_blank'][$type] ?? null;
        if (! $type || Question::where('subject_id', $subject->id)->where('text', $text)->exists()) {
            return false;
        }
        $split = fn ($s) => array_values(array_filter(array_map('trim', explode('^', $s)), 'strlen'));
        $question = Question::create([
            'subject_id' => $subject->id, 'topic_id' => $topic?->id, 'type' => $type, 'text' => $text,
            'explanation' => $explanation ?: null, 'difficulty' => $level, 'status' => 'approved', 'source' => 'seed',
        ]);
        $options = [];
        if ($type === 'true_false') {
            $options = [['True', $right === 'True'], ['False', $right === 'False']];
        } else {
            foreach ($split($right) as $o) {
                $options[] = [$o, true];
            }
            foreach ($split($wrong) as $o) {
                $options[] = [$o, false];
            }
        }
        foreach ($options as $i => [$o, $correct]) {
            $question->options()->create(['text' => $o, 'is_correct' => $correct, 'sort' => $i]);
        }
        if ($tip) {
            MemoryTip::create(['question_id' => $question->id, 'topic_id' => $topic?->id, 'text' => $tip, 'status' => 'approved']);
        }
        return true;
    }
}
