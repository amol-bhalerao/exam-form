<?php

namespace App\Support;

use App\Models\Application;
use App\Support\Codes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

/** Shared filtering and CSV export of exam forms for institute and board screens. */
final class FormQuery
{
    public const FILTERS = ['exam', 'status', 'stream', 'type', 'institute', 'paid', 'q', 'district'];

    public static function apply(Builder $q, Request $request): Builder
    {
        return $q
            ->when($request->query('exam'), fn ($w, $v) => $w->where('exam_id', $v))
            ->when($request->query('status'), fn ($w, $v) => $w->where('status', $v))
            ->when($request->query('stream'), fn ($w, $v) => $w->where('stream_id', $v))
            ->when($request->query('type'), fn ($w, $v) => $w->where('candidate_type', $v))
            ->when($request->query('institute'), fn ($w, $v) => $w->where('institute_id', $v))
            ->when($request->query('district'), fn ($w, $v) => $w->whereHas('institute', fn ($i) => $i->where('district', $v)))
            ->when($request->query('paid') === 'yes', fn ($w) => $w->whereNotNull('paid_at'))
            ->when($request->query('paid') === 'no', fn ($w) => $w->whereNull('paid_at'))
            ->when(trim((string) $request->query('q')), function ($w, $term) {
                $w->where(fn ($x) => $x->where('application_no', 'like', "%{$term}%")
                    ->orWhere('institute_seq', 'like', "%{$term}%")
                    ->orWhereHas('student', fn ($s) => $s->where('surname', 'like', "%{$term}%")
                        ->orWhere('first_name', 'like', "%{$term}%")
                        ->orWhere('mobile', 'like', "%{$term}%")));
            });
    }

    public static function export(Builder $q, string $filename): StreamedResponse
    {
        $q->with(['student', 'institute', 'exam', 'stream', 'subjects.subject']);
        return response()->streamDownload(function () use ($q) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel shows Marathi text
            fputcsv($out, ['Application no', 'Institute seq', 'Board seq', 'Exam', 'College no', 'College', 'Stream', 'Candidate type',
                'Surname', 'First name', 'Middle name', 'Mother name', 'Gender', 'DOB', 'Category', 'Medium', 'Mobile',
                'Subjects', 'Fee', 'Paid on', 'Status', 'Submitted on', 'Verified on']);
            $q->orderBy('application_no')->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $a) {
                    $s = $a->student;
                    fputcsv($out, [
                        $a->application_no, $a->institute_seq, $a->board_seq, $a->exam->code, $a->institute->college_no, $a->institute->name,
                        $a->stream?->name, $a->candidate_type, $s->surname, $s->first_name, $s->middle_name, $s->mother_name, $s->gender,
                        $s->dob?->format('Y-m-d'), $s->category, $s->medium, $s->mobile,
                        $a->subjects->map(fn ($r) => $r->subject->code)->implode(' '),
                        $a->fee_amount, $a->paid_at?->format('Y-m-d H:i'), Codes::label(Codes::STATUSES, $a->status),
                        $a->submitted_at?->format('Y-m-d'), $a->verified_at?->format('Y-m-d'),
                    ]);
                }
            });
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** Count of forms per status for a base query. */
    public static function statusCounts(Builder $q): array
    {
        $counts = (clone $q)->reorder()->toBase()->selectRaw('status, count(*) as n')->groupBy('status')->pluck('n', 'status')->all();
        return collect(array_keys(Codes::STATUSES))->mapWithKeys(fn ($s) => [$s => (int) ($counts[$s] ?? 0)])->all();
    }
}
