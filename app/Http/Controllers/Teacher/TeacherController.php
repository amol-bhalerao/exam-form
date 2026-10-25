<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\Subject;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/** Base for the teacher area: every query is limited to the teacher's college and its board's subjects. */
abstract class TeacherController extends Controller
{
    protected function instituteId(Request $request): int
    {
        return (int) $request->user()->institute_id;
    }

    protected function subjects(Request $request): Collection
    {
        return Subject::where('board_id', $request->user()->institute->board_id)->where('is_active', true)
            ->withCount(['questions' => fn ($q) => $q->where('status', 'approved')])->orderBy('sort')->orderBy('code')->get();
    }

    protected function defaultSubjectId(Request $request): ?int
    {
        return $request->user()->teacher?->subject_id;
    }
}
