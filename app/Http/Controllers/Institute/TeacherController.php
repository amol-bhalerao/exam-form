<?php

namespace App\Http\Controllers\Institute;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Str;
use App\Support\Codes;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/** Teachers and their board duties (examiner, moderator ...). The board reviews them. */
class TeacherController extends Controller
{
    public function index(Request $request)
    {
        $institute = $request->user()->institute;
        $teachers = $institute->teachers()->with('subject')
            ->when($request->query('role'), fn ($q, $r) => $q->whereJsonContains('duty_roles', $r))
            ->when($request->query('status'), fn ($q, $s) => $q->where('board_status', $s))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('full_name', 'like', "%{$t}%")->orWhere('mobile', 'like', "%{$t}%")))
            ->orderBy('full_name')->paginate(30)->withQueryString();

        $all = $institute->teachers()->get(['id', 'duty_roles', 'board_status', 'is_active']);
        return view('institute.teachers.index', [
            'teachers' => $teachers,
            'stats' => [
                'total' => $all->count(),
                'examiners' => $all->filter->isExaminer()->count(),
                'approved' => $all->where('board_status', 'approved')->count(),
                'pending' => $all->where('board_status', 'pending')->count(),
                'rejected' => $all->where('board_status', 'rejected')->count(),
            ],
        ]);
    }

    public function create(Request $request)
    {
        return view('institute.teachers.form', ['teacher' => new Teacher(['available_for_duty' => true, 'duty_roles' => ['examiner']]), 'subjects' => $this->subjects($request)]);
    }

    public function store(Request $request)
    {
        $teacher = $request->user()->institute->teachers()->create($this->validated($request) + ['board_status' => 'pending']);
        AuditLog::record('teacher.created', $teacher);
        return redirect()->route('institute.teachers.index')->with('status', __(':name added. The board will review the duty details.', ['name' => $teacher->full_name]));
    }

    public function edit(Request $request, Teacher $teacher)
    {
        $this->authorizeTeacher($request, $teacher);
        return view('institute.teachers.form', ['teacher' => $teacher, 'subjects' => $this->subjects($request)]);
    }

    public function update(Request $request, Teacher $teacher)
    {
        $this->authorizeTeacher($request, $teacher);
        $data = $this->validated($request);
        $teacher->fill($data);
        // Changing duties or subject needs a fresh board review.
        if ($teacher->isDirty(['duty_roles', 'subject_id', 'examiner_years']) && $teacher->board_status !== 'pending') {
            $teacher->board_status = 'pending';
            $teacher->board_note = null;
        }
        $teacher->save();
        AuditLog::record('teacher.updated', $teacher);
        return redirect()->route('institute.teachers.index')->with('status', __('Details saved for :name.', ['name' => $teacher->full_name]));
    }

    public function destroy(Request $request, Teacher $teacher)
    {
        $this->authorizeTeacher($request, $teacher);
        $teacher->delete();
        AuditLog::record('teacher.deleted', null, ['name' => $teacher->full_name]);
        return redirect()->route('institute.teachers.index')->with('status', __(':name has been removed.', ['name' => $teacher->full_name]));
    }

    /**
     * Create (or reset) the teacher's portal login for questions, tests and student progress.
     * The password is shown once to the college; the teacher must change it at first sign-in.
     */
    public function portalLogin(Request $request, Teacher $teacher)
    {
        $this->authorizeTeacher($request, $teacher);
        $password = ['Lotus', 'River', 'Tiger', 'Mango', 'Peacock', 'Banyan', 'Monsoon'][random_int(0, 6)] . '@' . random_int(1000, 9999) . Str::upper(Str::random(2));
        $user = $teacher->user;
        if ($user) {
            $user->forceFill(['password' => $password, 'must_change_password' => true, 'is_active' => true])->save();
        } else {
            $base = 't' . ($teacher->mobile ?: Str::lower(Str::random(6)));
            $username = $base;
            for ($i = 2; User::where('username', $username)->exists(); $i++) {
                $username = $base . '-' . $i;
            }
            $user = User::create([
                'name' => $teacher->full_name, 'username' => $username,
                'email' => $teacher->email && ! User::where('email', $teacher->email)->exists() ? $teacher->email : null,
                'mobile' => $teacher->mobile, 'password' => $password, 'role' => User::TEACHER,
                'institute_id' => $teacher->institute_id, 'division_id' => $request->user()->institute->division_id, 'board_id' => $request->user()->board_id ?? $request->user()->institute->board_id,
                'is_active' => true, 'must_change_password' => true, 'is_demo' => (bool) $request->user()->is_demo,
            ]);
            $teacher->forceFill(['user_id' => $user->id])->save();
        }
        AuditLog::record('teacher.login', $teacher);
        return back()->with('login_card', [
            'name' => $teacher->full_name, 'username' => $user->username, 'password' => $password,
            'url' => route('staff.login.teacher'),
        ]);
    }

    private function authorizeTeacher(Request $request, Teacher $teacher): void
    {
        abort_unless($teacher->institute_id === $request->user()->institute_id, 404);
    }

    private function subjects(Request $request)
    {
        return Subject::where('board_id', $request->user()->board_id ?? $request->user()->institute->board_id)->where('is_active', true)->orderBy('sort')->get();
    }

    private function validated(Request $request): array
    {
        $v = $request->validate([
            'full_name' => ['required', 'string', 'max:150'],
            'gender' => ['nullable', Rule::in(array_keys(Codes::GENDERS))],
            'dob' => ['nullable', 'date', 'before:-20 years'],
            'mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'email' => ['nullable', 'email', 'max:150'],
            'qualification' => ['nullable', 'string', 'max:150'],
            'subject_id' => ['nullable', 'exists:subjects,id'],
            'designation' => ['nullable', 'string', 'max:80'],
            'appointment_type' => ['nullable', Rule::in(array_keys(Codes::APPOINTMENT_TYPES))],
            'joined_on' => ['nullable', 'date', 'before_or_equal:today'],
            'experience_years' => ['nullable', 'integer', 'between:0,45'],
            'duty_roles' => ['array'],
            'duty_roles.*' => [Rule::in(array_keys(Codes::DUTY_ROLES))],
            'examiner_years' => ['nullable', 'integer', 'between:0,45'],
            'last_appointment_no' => ['nullable', 'string', 'max:60'],
            'available_for_duty' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
        ], ['mobile.regex' => __('Enter a 10-digit mobile number.')]);
        $v['full_name'] = mb_strtoupper(trim($v['full_name']));
        $v['duty_roles'] = array_values($v['duty_roles'] ?? []);
        $v['available_for_duty'] = $request->boolean('available_for_duty');
        $v['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : true;
        return $v;
    }
}
