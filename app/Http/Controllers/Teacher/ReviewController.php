<?php

namespace App\Http\Controllers\Teacher;

use App\Models\AuditLog;
use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\StudyMaterial;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Questions, notes and memory tips sent by this college's students (and AI drafts) wait here. */
class ReviewController extends TeacherController
{
    public function index(Request $request)
    {
        $inst = $this->instituteId($request);
        $tab = $request->query('tab', 'questions');
        return view('teacher.reviews.index', [
            'tab' => $tab,
            'counts' => [
                'questions' => Question::where('institute_id', $inst)->where('status', 'pending')->count(),
                'materials' => StudyMaterial::where('institute_id', $inst)->where('status', 'pending')->count(),
                'tips' => MemoryTip::where('institute_id', $inst)->where('status', 'pending')->count(),
            ],
            'questions' => $tab === 'questions' ? Question::where('institute_id', $inst)->where('status', 'pending')->with('subject', 'topic', 'options', 'author', 'tips')->oldest()->paginate(15) : null,
            'materials' => $tab === 'materials' ? StudyMaterial::where('institute_id', $inst)->where('status', 'pending')->with('subject', 'topic', 'student')->oldest()->paginate(15) : null,
            'tips' => $tab === 'tips' ? MemoryTip::where('institute_id', $inst)->where('status', 'pending')->with('question', 'topic', 'student')->oldest()->paginate(20) : null,
        ]);
    }

    public function decide(Request $request, string $kind, int $id)
    {
        $model = match ($kind) {
            'questions' => Question::class, 'materials' => StudyMaterial::class, 'tips' => MemoryTip::class, default => abort(404),
        };
        $item = $model::where('institute_id', $this->instituteId($request))->where('status', 'pending')->findOrFail($id);
        $data = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected'])],
            'note' => ['nullable', 'string', 'max:300'],
        ]);
        $attrs = ['status' => $data['decision'], 'reviewed_by' => $request->user()->id];
        if ($kind !== 'tips') {
            $attrs['review_note'] = $data['note'] ?? null;
        }
        if ($kind === 'questions') {
            $attrs['reviewed_at'] = now();
            // The student's memory tip goes live with their question.
            MemoryTip::where('question_id', $item->id)->where('status', 'pending')->update(['status' => $data['decision']]);
        }
        $item->forceFill($attrs)->save();
        AuditLog::record("review.{$kind}.{$data['decision']}", $item);
        return back()->with('status', $data['decision'] === 'approved' ? __('Approved — it is now visible to all students.') : __('Marked as not approved.'));
    }
}
