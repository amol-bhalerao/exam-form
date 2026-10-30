<?php

namespace App\Http\Controllers;

use App\Models\Exam;
use App\Models\Institute;
use App\Models\Subject;
use App\Models\Teacher;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Printable panel lists of teachers (examiners, moderators, paper setters …) for colleges and the
 * board office: filter by duty, subject, status; choose columns; optional signature column and a
 * cover description like the board's "subject-wise list of teachers appointed as moderator/examiner".
 */
class PanelController extends Controller
{
    /** Column key => [label, default on]. */
    public const COLUMNS = [
        'sr' => ['Sr. no.', true],
        'name' => ['Name of the teacher', true],
        'subject_code' => ['Subject code', true],
        'subject' => ['Subject name', true],
        'appointment_no' => ['Examiner / appointment no.', true],
        'duties' => ['Duty', false],
        'designation' => ['Designation', false],
        'qualification' => ['Qualification', false],
        'experience' => ['Experience (years)', true],
        'examiner_years' => ['Years as examiner', false],
        'appointment_type' => ['Appointment', false],
        'mobile' => ['Mobile no.', true],
        'email' => ['Email', false],
        'college' => ['College / school', false],
        'status' => ['Board review', false],
        'signature' => ['Signature', true],
    ];

    public function index(Request $request)
    {
        $user = $request->user();
        $isBoard = $user->role === 'board';
        $f = $this->filters($request, $isBoard);
        $teachers = $this->query($request, $f)->get();

        $data = [
            'isBoard' => $isBoard,
            'f' => $f,
            'teachers' => $teachers,
            'columns' => self::COLUMNS,
            'subjects' => Subject::where('board_id', $user->board_id ?? $user->institute->board_id)->orderBy('sort')->orderBy('code')->get(),
            'exams' => Exam::where('board_id', $user->board_id ?? $user->institute->board_id)
                ->forDivision($isBoard ? $user->division_id : $user->institute->division_id)->latest('opens_at')->get(['id', 'name', 'code']),
            'institutes' => $isBoard ? Institute::forOfficer($user)->whereHas('teachers', fn ($q) => $q->where('is_active', true))->orderBy('college_no')->get(['id', 'college_no', 'name']) : collect(),
            'districts' => $isBoard ? Institute::forOfficer($user)->whereNotNull('district')->distinct()->orderBy('district')->pluck('district') : collect(),
        ];

        if ($request->boolean('print')) {
            return view('print.panel', $data + ['groups' => $this->group($teachers, $f, $isBoard), 'cover' => $this->cover($request, $f, $isBoard)]);
        }
        return view('panel.index', $data + ['cover' => $this->cover($request, $f, $isBoard)]);
    }

    private function filters(Request $request, bool $isBoard): array
    {
        $cols = $request->has('cols') ? array_values(array_intersect(array_keys(self::COLUMNS), (array) $request->query('cols')))
            : array_keys(array_filter(self::COLUMNS, fn ($c) => $c[1]));
        if ($isBoard && ! $request->has('cols') && $request->has('per_college') && ! $request->boolean('per_college')) {
            array_splice($cols, 2, 0, ['college']); // one combined list: show each teacher's college
        }
        return [
            'duties' => array_values(array_intersect(array_keys(Codes::DUTY_ROLES), (array) $request->query('duties', []))),
            'subject' => $request->integer('subject') ?: null,
            'status' => in_array($request->query('status'), ['approved', 'pending', 'rejected', 'all'], true) ? $request->query('status') : ($isBoard ? 'approved' : 'all'),
            'available' => $request->boolean('available'),
            'institute' => $isBoard ? ($request->integer('institute') ?: null) : null,
            'district' => $isBoard ? $request->query('district') : null,
            'exam' => $request->integer('exam') ?: null,
            'order' => in_array($request->query('order'), ['subject', 'name'], true) ? $request->query('order') : 'subject',
            'per_college' => $isBoard ? $request->boolean('per_college', true) : false,
            'cols' => $cols,
            'orientation' => $request->query('orientation') === 'landscape' ? 'landscape' : 'portrait',
        ];
    }

    private function query(Request $request, array $f)
    {
        $user = $request->user();
        return Teacher::query()->with('subject', 'institute')
            ->where('teachers.is_active', true)
            ->when($user->role === 'board', fn ($q) => $q->whereHas('institute', fn ($i) => $i->forOfficer($user)))
            ->when($user->role === 'institute', fn ($q) => $q->where('teachers.institute_id', $user->institute_id))
            ->when($f['duties'], fn ($q, $d) => $q->where(fn ($w) => collect($d)->each(fn ($r) => $w->orWhereJsonContains('teachers.duty_roles', $r))))
            ->when($f['subject'], fn ($q, $s) => $q->where('teachers.subject_id', $s))
            ->when($f['status'] !== 'all', fn ($q) => $q->where('teachers.board_status', $f['status']))
            ->when($f['available'], fn ($q) => $q->where('teachers.available_for_duty', true))
            ->when($f['institute'], fn ($q, $i) => $q->where('teachers.institute_id', $i))
            ->when($f['district'], fn ($q, $d) => $q->whereHas('institute', fn ($i) => $i->where('district', $d)))
            ->leftJoin('subjects', 'subjects.id', '=', 'teachers.subject_id')
            ->select('teachers.*')
            ->when($f['order'] === 'subject', fn ($q) => $q->orderByRaw('subjects.sort is null')->orderBy('subjects.sort')->orderBy('subjects.code'))
            ->orderBy('teachers.full_name');
    }

    /** One page per college for the board (like the board's printed lists), else one list. */
    private function group(Collection $teachers, array $f, bool $isBoard): Collection
    {
        if ($isBoard && $f['per_college']) {
            return $teachers->groupBy('institute_id')->map(fn ($g) => ['institute' => $g->first()->institute, 'rows' => $g->values()])
                ->sortBy(fn ($g) => $g['institute']->college_no)->values();
        }
        return collect([['institute' => $isBoard ? null : request()->user()->institute, 'rows' => $teachers->values()]]);
    }

    /** Cover text above the list; every line can be edited on the form. */
    private function cover(Request $request, array $f, bool $isBoard): array
    {
        $user = $request->user();
        $board = $user->board ?? $user->institute->board;
        $exam = $f['exam'] ? Exam::find($f['exam']) : null;
        $duties = collect($f['duties'] ?: ['examiner', 'moderator'])->map(fn ($d) => mb_strtoupper(__(Codes::DUTY_ROLES[$d])))->implode('/');
        $defaults = [
            'title' => mb_strtoupper(($board?->label ?? '') . ($exam ? ' — ' . $exam->name : '')),
            'subtitle' => __('Subject-wise list of teachers appointed as :duties in the subject shown against their names', ['duties' => $duties]),
            'note' => $isBoard
                ? __('Inform all concerned, obtain their signatures, and hand over the same copy, duly signed by the principal, to this office representative before :date.', ['date' => ':date'])
                : __('Certified that the above teachers are working in this college and the details given are correct.'),
            'due' => '',
            'footer' => __('Signature of the principal with stamp'),
        ];
        $c = [];
        foreach ($defaults as $k => $v) {
            $given = $request->has("c_$k") ? trim((string) $request->query("c_$k")) : null;
            // Title and description rebuild when cleared; note, date and signature line may stay empty.
            $c[$k] = $given === null || ($given === '' && in_array($k, ['title', 'subtitle'], true)) ? $v : $given;
        }
        $due = $c['due'] ? \Illuminate\Support\Carbon::parse($c['due'])->format('d-m-Y') : '____________';
        $c['note_text'] = str_replace(':date', $due, $c['note']);
        $c['board'] = $board;
        $c['division'] = $isBoard ? $user->division : $user->institute->division;
        return $c;
    }
}
