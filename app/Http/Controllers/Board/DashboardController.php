<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\Teacher;
use App\Support\Codes;
use App\Support\FormQuery;
use Illuminate\Http\Request;

/** Board overview: where every form is, how many came in each day, and what needs action. */
class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $boardId = $request->user()->board_id;
        $exams = Exam::where('board_id', $boardId)->latest('opens_at')->get(['id', 'name', 'code', 'opens_at', 'closes_at', 'late_closes_at', 'is_published']);
        // Default to the published exam taking forms now, else the latest published, else the latest.
        $examId = $request->integer('exam') ?: ($exams->first(fn ($e) => $e->is_published && $e->opens_at->isPast() && ($e->late_closes_at ?? $e->closes_at)->isFuture())
            ?? $exams->firstWhere('is_published', true) ?? $exams->first())?->id;

        $base = Application::where('board_id', $boardId)->when($examId, fn ($q) => $q->where('exam_id', $examId));
        $paid = (clone $base)->whereNotNull('paid_at');

        // Forms paid per day for the last 30 days (portable SQL: group in PHP).
        $from = now()->subDays(29)->startOfDay();
        $perDay = (clone $paid)->where('paid_at', '>=', $from)->pluck('paid_at')
            ->countBy(fn ($d) => $d->format('Y-m-d'));
        $daily = collect(range(0, 29))->map(function ($i) use ($from, $perDay) {
            $d = $from->copy()->addDays($i);
            return ['date' => $d, 'count' => (int) ($perDay[$d->format('Y-m-d')] ?? 0)];
        });

        $byStream = (clone $paid)->reorder()->toBase()->selectRaw('stream_id, count(*) as n')->groupBy('stream_id')->pluck('n', 'stream_id');
        $streams = $request->user()->board->streams()->orderBy('sort')->get();
        $byType = (clone $paid)->reorder()->toBase()->selectRaw('candidate_type, count(*) as n')->groupBy('candidate_type')->pluck('n', 'candidate_type');
        $byDistrict = \Illuminate\Support\Facades\DB::table('applications')
            ->join('institutes', 'institutes.id', '=', 'applications.institute_id')
            ->where('applications.board_id', $boardId)->whereNotNull('applications.paid_at')
            ->when($examId, fn ($q) => $q->where('applications.exam_id', $examId))
            ->selectRaw('institutes.district as district, count(*) as n')->groupBy('institutes.district')->orderByDesc('n')->limit(10)->pluck('n', 'district');

        $teachers = Teacher::whereHas('institute', fn ($q) => $q->where('board_id', $boardId))->where('is_active', true);

        return view('board.dashboard', [
            'exams' => $exams,
            'exam' => $exams->firstWhere('id', $examId),
            'counts' => FormQuery::statusCounts($base),
            'fees' => (int) (clone $paid)->sum('fee_amount'),
            'paidCount' => (clone $paid)->count(),
            'daily' => $daily,
            'byStream' => $streams->map(fn ($s) => ['label' => $s->label, 'count' => (int) ($byStream[$s->id] ?? 0)])->filter(fn ($r) => $r['count'] > 0 || true)->values(),
            'byType' => collect(Codes::CANDIDATE_TYPES)->map(fn ($l, $k) => ['label' => __($l), 'count' => (int) ($byType[$k] ?? 0)])->values(),
            'byDistrict' => $byDistrict->map(fn ($n, $d) => ['label' => $d ?: __('Not set'), 'count' => (int) $n])->values(),
            'institutes' => [
                'total' => Institute::where('board_id', $boardId)->where('is_active', true)->count(),
                'active' => (clone $paid)->distinct()->count('institute_id'),
            ],
            'examiners' => [
                'pending' => (clone $teachers)->where('board_status', 'pending')->count(),
                'approved' => (clone $teachers)->where('board_status', 'approved')->count(),
            ],
            'oldest' => (clone $base)->where('status', Application::VERIFIED)->with('student', 'institute')->oldest('verified_at')->limit(6)->get(),
        ]);
    }
}
