<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Institute;
use App\Support\FormQuery;
use Illuminate\Http\Request;

/** Read-only directory of the board's colleges / schools with their form and teacher counts. */
class InstituteController extends Controller
{
    public function index(Request $request)
    {
        $board = $request->user()->board;
        $institutes = Institute::forOfficer($request->user())
            ->search($request->query('q'))
            ->when($request->query('district'), fn ($q, $d) => $q->where('district', $d))
            ->when($request->query('activity') === 'with', fn ($q) => $q->whereHas('applications', fn ($a) => $a->whereNotNull('paid_at')))
            ->when($request->query('activity') === 'without', fn ($q) => $q->whereDoesntHave('applications', fn ($a) => $a->whereNotNull('paid_at')))
            ->withCount([
                'applications as forms_count' => fn ($q) => $q->whereNotNull('paid_at'),
                'applications as pending_count' => fn ($q) => $q->whereIn('status', [Application::SUBMITTED, Application::BOARD_RETURNED]),
                'applications as verified_count' => fn ($q) => $q->where('status', Application::VERIFIED),
                'teachers' => fn ($q) => $q->where('is_active', true),
            ])
            ->orderBy('college_no')
            ->paginate(40)->withQueryString();

        return view('board.institutes.index', [
            'institutes' => $institutes,
            'districts' => Institute::forOfficer($request->user())->whereNotNull('district')->distinct()->orderBy('district')->pluck('district'),
        ]);
    }

    public function show(Request $request, Institute $institute)
    {
        abort_unless(Institute::forOfficer($request->user())->whereKey($institute->id)->exists(), 404);
        $institute->load('streams', 'users');
        $base = Application::where('institute_id', $institute->id);
        return view('board.institutes.show', [
            'institute' => $institute,
            'counts' => FormQuery::statusCounts($base),
            'fees' => (int) (clone $base)->whereNotNull('paid_at')->sum('fee_amount'),
            'teachers' => $institute->teachers()->where('is_active', true)->with('subject')->orderBy('full_name')->get(),
            'offered' => $institute->offeredSubjects()->count(),
        ]);
    }
}
