<?php

namespace App\Http\Controllers\Institute;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\InstituteSubject;
use App\Models\Stream;
use App\Models\Subject;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

/** Subjects the college teaches per stream. Students only see these; if none are set, they see all subjects. */
class SubjectController extends Controller
{
    public function index(Request $request)
    {
        $institute = $request->user()->institute()->with('streams')->first();
        $streams = $institute->streams->sortBy('sort')->values();
        if ($streams->isEmpty()) {
            $streams = Stream::where('board_id', $institute->board_id)->orderBy('sort')->get();
        }
        $active = $streams->firstWhere('id', (int) $request->query('stream')) ?? $streams->first();

        $offered = InstituteSubject::where('institute_id', $institute->id)->get()->groupBy('stream_id');
        $candidates = $active ? $active->subjects()->where('is_active', true)->orderBy('sort')->get() : collect();
        if ($candidates->isEmpty()) {
            $candidates = Subject::where('board_id', $institute->board_id)->where('is_active', true)->orderBy('sort')->get();
        }

        return view('institute.subjects.index', [
            'streams' => $streams,
            'active' => $active,
            'subjects' => $candidates->groupBy('kind'),
            'offered' => ($offered[$active?->id] ?? collect())->keyBy('subject_id'),
            'counts' => $offered->map->count(),
        ]);
    }

    public function update(Request $request, Stream $stream)
    {
        $institute = $request->user()->institute;
        abort_unless($stream->board_id === $institute->board_id, 404);
        $data = $request->validate([
            'subjects' => ['array'],
            'subjects.*' => ['integer', Rule::exists('subjects', 'id')->where('board_id', $institute->board_id)],
            'language' => ['array'],
            'language.*' => ['nullable', Rule::in(array_keys(Codes::MEDIUMS))],
        ]);
        $ids = array_map('intval', $data['subjects'] ?? []);

        DB::transaction(function () use ($institute, $stream, $ids, $data) {
            InstituteSubject::where('institute_id', $institute->id)->where('stream_id', $stream->id)->whereNotIn('subject_id', $ids)->delete();
            foreach ($ids as $id) {
                InstituteSubject::updateOrCreate(
                    ['institute_id' => $institute->id, 'stream_id' => $stream->id, 'subject_id' => $id],
                    ['answer_language' => $data['language'][$id] ?? null]
                );
            }
            $institute->streams()->syncWithoutDetaching([$stream->id]);
        });
        AuditLog::record('institute.subjects', $institute, ['stream' => $stream->code, 'count' => count($ids)]);

        return redirect()->route('institute.subjects.index', ['stream' => $stream->id])
            ->with('status', trans_choice(':count subject saved for :stream.|:count subjects saved for :stream.', count($ids), ['count' => count($ids), 'stream' => $stream->label]));
    }
}
