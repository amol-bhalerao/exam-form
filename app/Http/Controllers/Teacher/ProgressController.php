<?php

namespace App\Http\Controllers\Teacher;

use App\Models\Attempt;
use App\Models\Student;
use App\Services\Coach;
use App\Services\QuizEngine;
use Illuminate\Http\Request;

/** Who is practising, how often, and how well — for the teacher's college. */
class ProgressController extends TeacherController
{
    public function index(Request $request)
    {
        $inst = $this->instituteId($request);
        $from = now()->subDays(13)->startOfDay();
        $students = Student::where('institute_id', $inst)
            ->when($request->query('stream'), fn ($q, $s) => $q->where('stream_id', $s))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('surname', 'like', "%{$t}%")->orWhere('first_name', 'like', "%{$t}%")))
            ->with('stream')->orderBy('surname')->paginate(40)->withQueryString();

        $attempts = Attempt::whereIn('student_id', $students->pluck('id'))->where('created_at', '>=', $from)->where('status', '!=', Attempt::LIVE)
            ->get(['student_id', 'created_at', 'correct', 'wrong', 'skipped', 'mode']);
        $grid = [];
        foreach ($attempts as $a) {
            $grid[$a->student_id][$a->created_at->format('Y-m-d')] = ($grid[$a->student_id][$a->created_at->format('Y-m-d')] ?? 0) + 1;
        }
        $stats = $attempts->groupBy('student_id')->map(fn ($g) => [
            'sets' => $g->count(),
            'accuracy' => ($t = $g->sum('correct') + $g->sum('wrong')) ? round($g->sum('correct') / $t * 100) : null,
        ]);
        $last = Attempt::whereIn('student_id', $students->pluck('id'))->selectRaw('student_id, max(created_at) as last_at')->groupBy('student_id')->pluck('last_at', 'student_id');

        return view('teacher.progress.index', [
            'students' => $students, 'grid' => $grid, 'stats' => $stats, 'last' => $last,
            'days' => collect(range(13, 0))->map(fn ($i) => now()->subDays($i)),
            'streams' => $request->user()->institute->streams,
        ]);
    }

    public function show(Request $request, Student $student, Coach $coach)
    {
        abort_unless($student->institute_id === $this->instituteId($request), 404);
        $attempts = Attempt::where('student_id', $student->id)->where('status', '!=', Attempt::LIVE)->with('subject', 'quiz')->latest()->limit(30)->get();
        $answers = \App\Models\AttemptAnswer::whereIn('attempt_id', $attempts->pluck('id'))->whereNotNull('is_correct')->with('question.topic')->get();
        $days = collect(range(29, 0))->map(fn ($i) => now()->subDays($i));
        $perDay = $attempts->groupBy(fn ($a) => $a->created_at->format('Y-m-d'))->map->count();
        return view('teacher.progress.show', [
            'student' => $student->load('stream'),
            'attempts' => $attempts,
            'days' => $days,
            'perDay' => $perDay,
            'streak' => self::streak($perDay),
            'topics' => QuizEngine::topicStats($answers),
            'overview' => $coach->overview($student),
        ]);
    }

    /** Consecutive days with at least one practice set, ending today or yesterday. */
    public static function streak($perDay): int
    {
        $n = 0;
        $day = now()->startOfDay();
        if (! isset($perDay[$day->format('Y-m-d')])) {
            $day->subDay();
        }
        while (isset($perDay[$day->format('Y-m-d')])) {
            $n++;
            $day->subDay();
        }
        return $n;
    }
}
