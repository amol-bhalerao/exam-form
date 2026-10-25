<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Subject;
use App\Models\Teacher;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Teachers sent by colleges for board duties (examiner, moderator, …). The board approves or declines them. */
class ExaminerController extends Controller
{
    private function query(Request $request)
    {
        $user = $request->user();
        return Teacher::query()
            ->whereHas('institute', fn ($q) => $q->forOfficer($user))
            ->where('is_active', true)
            ->when($request->query('status'), fn ($q, $s) => $q->where('board_status', $s))
            ->when($request->query('role'), fn ($q, $r) => $q->whereJsonContains('duty_roles', $r))
            ->when($request->query('subject'), fn ($q, $s) => $q->where('subject_id', $s))
            ->when($request->query('district'), fn ($q, $d) => $q->whereHas('institute', fn ($i) => $i->where('district', $d)))
            ->when($request->query('institute'), fn ($q, $i) => $q->where('institute_id', $i))
            ->when($request->query('available') === 'yes', fn ($q) => $q->where('available_for_duty', true))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('full_name', 'like', "%{$t}%")->orWhere('mobile', 'like', "%{$t}%")));
    }

    public function index(Request $request)
    {
        $board = $request->user()->board;
        $all = Teacher::whereHas('institute', fn ($q) => $q->forOfficer($request->user()))->where('is_active', true);
        return view('board.examiners.index', [
            'teachers' => $this->query($request)->with('institute', 'subject')
                ->orderByRaw("CASE board_status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END")->orderBy('full_name')
                ->paginate(30)->withQueryString(),
            'stats' => [
                'total' => (clone $all)->count(),
                'pending' => (clone $all)->where('board_status', 'pending')->count(),
                'approved' => (clone $all)->where('board_status', 'approved')->count(),
                'rejected' => (clone $all)->where('board_status', 'rejected')->count(),
                'available' => (clone $all)->where('available_for_duty', true)->count(),
            ],
            'subjects' => Subject::where('board_id', $board->id)->orderBy('sort')->orderBy('code')->get(),
            'districts' => \App\Models\Institute::forOfficer($request->user())->whereNotNull('district')->distinct()->orderBy('district')->pluck('district'),
        ]);
    }

    public function decide(Request $request, Teacher $teacher)
    {
        abort_unless(\App\Models\Institute::forOfficer($request->user())->whereKey($teacher->institute_id)->exists(), 404);
        $data = $request->validate([
            'decision' => ['required', Rule::in(['approved', 'rejected', 'pending'])],
            'note' => [$request->input('decision') === 'rejected' ? 'required' : 'nullable', 'string', 'max:300'],
        ], ['note.required' => __('Write the reason so the college can update the details.')]);

        $teacher->forceFill([
            'board_status' => $data['decision'],
            'board_note' => $data['note'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ])->save();
        AuditLog::record('teacher.' . $data['decision'], $teacher);

        return back()->with('status', [
            'approved' => __(':name approved for board duty.', ['name' => $teacher->full_name]),
            'rejected' => __(':name marked as not approved.', ['name' => $teacher->full_name]),
            'pending' => __(':name moved back to pending.', ['name' => $teacher->full_name]),
        ][$data['decision']]);
    }

    public function export(Request $request)
    {
        $q = $this->query($request)->with('institute', 'subject')->orderBy('institute_id')->orderBy('full_name');
        return response()->streamDownload(function () use ($q) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['College no', 'College', 'District', 'Name', 'Gender', 'Mobile', 'Email', 'Qualification', 'Designation',
                'Subject', 'Appointment', 'Experience (years)', 'Duties', 'Examiner years', 'Last appointment no', 'Available', 'Board status', 'Board note']);
            $q->chunk(500, function ($rows) use ($out) {
                foreach ($rows as $t) {
                    fputcsv($out, [
                        $t->institute->college_no, $t->institute->name, $t->institute->district, $t->full_name, $t->gender, $t->mobile, $t->email,
                        $t->qualification, $t->designation, $t->subject ? $t->subject->code . ' ' . $t->subject->name : '',
                        Codes::label(Codes::APPOINTMENT_TYPES, $t->appointment_type), $t->experience_years, $t->rolesLabel(),
                        $t->examiner_years, $t->last_appointment_no, $t->available_for_duty ? 'Yes' : 'No', $t->board_status, $t->board_note,
                    ]);
                }
            });
            fclose($out);
        }, 'teachers-examiners-' . now()->format('Ymd') . '.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }
}
