<?php

namespace App\Http\Controllers\Student\Learn;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Base for the study area. One Google account can hold several students (a parent, a cyber café);
 * the one practising is kept in the session as the "learner".
 */
abstract class LearnController extends Controller
{
    protected function learner(Request $request): Student
    {
        $students = $request->user()->students()->orderBy('first_name')->get();
        if ($students->isEmpty()) {
            abort(redirect()->route('student.students.create')->with('warning', __('Add the student first — practice and tests are saved for each student.')));
        }
        $id = (int) $request->session()->get('learner_id');
        $learner = $students->firstWhere('id', $id) ?? $students->first();
        $request->session()->put('learner_id', $learner->id);
        view()->share('learner', $learner);
        view()->share('learners', $students);
        return $learner;
    }

    /** Subjects of the learner's board that have approved questions. */
    protected function subjects(Student $student): Collection
    {
        return Subject::where('board_id', $student->board_id)->where('is_active', true)
            ->withCount(['questions' => fn ($q) => $q->where('status', 'approved')])
            ->orderBy('sort')->orderBy('code')->get();
    }
}
