<?php

namespace App\Http\Controllers\Student\Learn;

use App\Http\Controllers\Teacher\ProgressController as TeacherProgress;
use App\Models\Attempt;
use App\Models\AttemptAnswer;
use App\Models\Certificate;
use App\Services\Coach;
use App\Services\QuizEngine;
use Illuminate\Http\Request;

class ProgressController extends LearnController
{
    public function index(Request $request, Coach $coach)
    {
        $student = $this->learner($request);
        $attempts = Attempt::where('student_id', $student->id)->where('status', '!=', Attempt::LIVE)->with('subject', 'quiz')->latest()->limit(40)->get();
        $answers = AttemptAnswer::whereIn('attempt_id', $attempts->pluck('id'))->whereNotNull('is_correct')->with('question.topic', 'question.subject')->get();
        $perDay = $attempts->groupBy(fn ($a) => $a->created_at->format('Y-m-d'))->map->count();
        return view('learn.progress', [
            'student' => $student,
            'attempts' => $attempts,
            'subjects' => $answers->groupBy(fn ($a) => $a->question->subject->label)->map(fn ($g) => ['right' => $g->where('is_correct', true)->count(), 'total' => $g->count()])->sortByDesc('total'),
            'topics' => QuizEngine::topicStats($answers),
            'days' => collect(range(29, 0))->map(fn ($i) => now()->subDays($i)),
            'perDay' => $perDay,
            'streak' => TeacherProgress::streak($perDay),
            'aiEnabled' => $coach->enabled(),
            'certificates' => Certificate::where('student_id', $student->id)->with('quiz.subject')->latest()->get(),
        ]);
    }

    public function plan(Request $request, Coach $coach)
    {
        $student = $this->learner($request);
        return response()->json(['text' => $coach->overview($student, true)]);
    }

    public function certificate(Request $request, Certificate $certificate)
    {
        abort_unless($request->user()->students()->whereKey($certificate->student_id)->exists(), 404);
        return view('print.certificates', [
            'quiz' => $certificate->quiz->load('subject', 'institute'),
            'certificates' => collect([$certificate->load('student', 'attempt')]),
            'teacher' => $certificate->quiz->author,
        ]);
    }
}
