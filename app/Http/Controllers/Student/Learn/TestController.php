<?php

namespace App\Http\Controllers\Student\Learn;

use App\Models\Attempt;
use App\Models\Quiz;
use App\Services\QuizEngine;
use Illuminate\Http\Request;
use RuntimeException;

/** Tests scheduled by the student's teachers: rules page, then a single sitting. */
class TestController extends LearnController
{
    public function index(Request $request)
    {
        $student = $this->learner($request);
        return view('learn.tests', ['tests' => HubController::tests($student), 'student' => $student]);
    }

    public function show(Request $request, Quiz $quiz)
    {
        $student = $this->learner($request);
        abort_unless($quiz->status === 'published' && $quiz->isFor($student), 404);
        $attempt = Attempt::where('quiz_id', $quiz->id)->where('student_id', $student->id)->first();
        if ($attempt) {
            return redirect()->route($attempt->isLive() ? 'learn.attempts.show' : 'learn.attempts.result', $attempt);
        }
        return view('learn.test-rules', ['quiz' => $quiz->load('subject', 'author'), 'student' => $student]);
    }

    public function start(Request $request, Quiz $quiz, QuizEngine $engine)
    {
        $student = $this->learner($request);
        abort_unless($quiz->status === 'published' && $quiz->isFor($student), 404);
        $request->validate(['agree' => ['accepted']], ['agree.accepted' => __('Please confirm you have read the rules.')]);
        if ($quiz->state() !== 'live') {
            return back()->with('warning', $quiz->state() === 'upcoming' ? __('This test has not started yet.') : __('This test has ended.'));
        }
        try {
            $attempt = $engine->startTest($quiz, $student, $request->user()->id);
        } catch (RuntimeException $e) {
            return back()->with('warning', $e->getMessage());
        }
        return redirect()->route($attempt->isLive() ? 'learn.attempts.show' : 'learn.attempts.result', $attempt);
    }
}
