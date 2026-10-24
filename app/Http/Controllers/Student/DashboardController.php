<?php

namespace App\Http\Controllers\Student;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\Notice;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $students = $request->user()->students()
            ->with(['institute', 'stream', 'board', 'applications' => fn ($q) => $q->with('exam')->latest()])
            ->orderBy('first_name')->get();

        return view('student.dashboard', [
            'students' => $students,
            'openExams' => Exam::open()->with('board', 'fees')->orderBy('closes_at')->get(),
            'notices' => Notice::live()->latest('published_at')->limit(4)->get(),
        ]);
    }
}
