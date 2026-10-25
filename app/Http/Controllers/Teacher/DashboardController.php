<?php

namespace App\Http\Controllers\Teacher;

use App\Models\Attempt;
use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\StudyMaterial;
use Illuminate\Http\Request;

class DashboardController extends TeacherController
{
    public function index(Request $request)
    {
        $inst = $this->instituteId($request);
        $studentIds = Student::where('institute_id', $inst)->pluck('id');
        $today = Attempt::whereIn('student_id', $studentIds)->where('created_at', '>=', now()->startOfDay());
        $week = Attempt::whereIn('student_id', $studentIds)->where('created_at', '>=', now()->subDays(6)->startOfDay());

        return view('teacher.dashboard', [
            'pending' => Question::where('institute_id', $inst)->where('status', 'pending')->count()
                + StudyMaterial::where('institute_id', $inst)->where('status', 'pending')->count()
                + MemoryTip::where('institute_id', $inst)->where('status', 'pending')->count(),
            'myQuestions' => Question::where('created_by', $request->user()->id)->count(),
            'bank' => Question::approved()->whereIn('subject_id', $this->subjects($request)->pluck('id'))->count(),
            'students' => $studentIds->count(),
            'activeToday' => (clone $today)->distinct()->count('student_id'),
            'setsToday' => (clone $today)->count(),
            'activeWeek' => (clone $week)->distinct()->count('student_id'),
            'tests' => Quiz::where('institute_id', $inst)->where('status', 'published')->where('ends_at', '>=', now())->with('subject')->withCount('attempts')->orderBy('starts_at')->limit(5)->get(),
            'recent' => Attempt::whereIn('student_id', $studentIds)->where('status', '!=', Attempt::LIVE)->with('student', 'subject', 'quiz')->latest('submitted_at')->limit(8)->get(),
        ]);
    }
}
