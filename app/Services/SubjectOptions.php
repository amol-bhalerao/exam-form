<?php

namespace App\Services;

use App\Models\Institute;
use App\Models\InstituteSubject;
use App\Models\Stream;
use App\Models\Subject;
use Illuminate\Support\Collection;

/**
 * Which subjects a candidate may choose on the exam form.
 *
 * 1. The subjects the institute has registered for the stream (with their answer language).
 * 2. If the institute has not registered any, every active subject of the board.
 */
class SubjectOptions
{
    /**
     * @return array{source: string, subjects: Collection<int, Subject>, languages: array<int, string|null>}
     */
    public function for(?Institute $institute, ?Stream $stream, int $boardId): array
    {
        if ($institute && $stream) {
            $offered = InstituteSubject::with('subject')
                ->where('institute_id', $institute->id)
                ->where('stream_id', $stream->id)
                ->get()
                ->filter(fn ($row) => $row->subject && $row->subject->is_active);

            if ($offered->isNotEmpty()) {
                return [
                    'source' => 'institute',
                    'subjects' => $offered->pluck('subject')->sortBy(fn ($s) => [$s->sort, $s->code])->values(),
                    'languages' => $offered->mapWithKeys(fn ($row) => [$row->subject_id => $row->answer_language])->all(),
                ];
            }
        }

        return [
            'source' => 'all',
            'subjects' => Subject::where('board_id', $boardId)->where('is_active', true)->orderBy('sort')->orderBy('code')->get(),
            'languages' => [],
        ];
    }

    /** Subject ids that every candidate must take (pre-selected and locked in the picker). */
    public function compulsoryIds(Collection $subjects): array
    {
        return $subjects->filter(fn (Subject $s) => $s->kind === 'COMPULSORY')->pluck('id')->values()->all();
    }
}
