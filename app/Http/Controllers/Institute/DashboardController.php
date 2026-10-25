<?php

namespace App\Http\Controllers\Institute;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Exam;
use App\Models\InstituteSubject;
use App\Support\FormQuery;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $institute = $request->user()->institute()->with('streams', 'board')->first();
        $base = Application::where('institute_id', $institute->id);

        $teachers = $institute->teachers()->where('is_active', true)->get(['id', 'duty_roles', 'board_status', 'available_for_duty']);

        return view('institute.dashboard', [
            'institute' => $institute,
            'counts' => FormQuery::statusCounts($base),
            'feesCollected' => (int) (clone $base)->whereNotNull('paid_at')->sum('fee_amount'),
            'waiting' => (clone $base)->whereIn('status', [Application::SUBMITTED, Application::BOARD_RETURNED])
                ->with('student', 'exam')->oldest('submitted_at')->limit(8)->get(),
            'openExams' => Exam::open()->where('board_id', $institute->board_id)->forDivision($institute->division_id)->withCount(['applications' => fn ($q) => $q->where('institute_id', $institute->id)])->get(),
            'teacherStats' => [
                'total' => $teachers->count(),
                'examiners' => $teachers->filter->isExaminer()->count(),
                'approved' => $teachers->where('board_status', 'approved')->count(),
                'pending' => $teachers->where('board_status', 'pending')->count(),
            ],
            'streamsWithoutSubjects' => $institute->streams->filter(fn ($s) => ! InstituteSubject::where('institute_id', $institute->id)->where('stream_id', $s->id)->exists()),
        ]);
    }
}
