<?php

namespace App\Http\Controllers\Student\Learn;

use App\Http\Controllers\Teacher\ProgressController;
use App\Models\Attempt;
use App\Models\Quiz;
use App\Services\QuizEngine;
use Illuminate\Http\Request;

class HubController extends LearnController
{
    public function index(Request $request)
    {
        $student = $this->learner($request);
        $attempts = Attempt::where('student_id', $student->id)->where('created_at', '>=', now()->subDays(29)->startOfDay())->get(['id', 'created_at', 'status', 'correct', 'wrong']);
        $perDay = $attempts->groupBy(fn ($a) => $a->created_at->format('Y-m-d'))->map->count();
        $done = $attempts->where('status', '!=', Attempt::LIVE);
        $live = Attempt::where('student_id', $student->id)->where('status', Attempt::LIVE)->with('subject', 'quiz')->latest()->get();
        foreach ($live as $a) {
            app(QuizEngine::class)->enforce($a);
        }

        return view('learn.hub', [
            'student' => $student,
            'subjects' => $this->subjects($student),
            'streak' => ProgressController::streak($perDay),
            'today' => $perDay[now()->format('Y-m-d')] ?? 0,
            'accuracy' => ($t = $done->sum('correct') + $done->sum('wrong')) ? round($done->sum('correct') / $t * 100) : null,
            'sets' => $done->count(),
            'days' => collect(range(27, 0))->map(fn ($i) => now()->subDays($i)),
            'perDay' => $perDay,
            'live' => $live->filter->isLive(),
            'tests' => $this->tests($student),
            'recent' => Attempt::where('student_id', $student->id)->where('status', '!=', Attempt::LIVE)->with('subject', 'quiz')->latest()->limit(6)->get(),
        ]);
    }

    public function switch(Request $request)
    {
        $id = $request->user()->students()->findOrFail($request->integer('student'))->id;
        $request->session()->put('learner_id', $id);
        return back();
    }

    /** Published tests for this student's college and stream that are upcoming or open. */
    public static function tests($student)
    {
        if (! $student->institute_id) {
            return collect();
        }
        $taken = Attempt::where('student_id', $student->id)->whereNotNull('quiz_id')->get()->keyBy('quiz_id');
        return Quiz::where('institute_id', $student->institute_id)->where('status', 'published')
            ->where(fn ($q) => $q->whereNull('stream_id')->orWhere('stream_id', $student->stream_id))
            ->where('ends_at', '>=', now()->subDays(30))->with('subject')->orderBy('starts_at')->get()
            ->each(fn ($quiz) => $quiz->setAttribute('my_attempt', $taken[$quiz->id] ?? null));
    }
}
