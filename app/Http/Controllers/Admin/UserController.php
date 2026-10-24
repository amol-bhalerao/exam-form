<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Institute;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/** Staff logins (super admin, board, institute) and student Google accounts. */
class UserController extends Controller
{
    public function index(Request $request)
    {
        $users = User::query()->with('board', 'institute')
            ->when($request->query('role'), fn ($q, $r) => $q->where('role', $r))
            ->when($request->query('active') === 'no', fn ($q) => $q->where('is_active', false))
            ->when(trim((string) $request->query('q')), fn ($q, $t) => $q->where(fn ($w) => $w->where('name', 'like', "%{$t}%")
                ->orWhere('username', 'like', "%{$t}%")->orWhere('email', 'like', "%{$t}%")->orWhere('mobile', 'like', "%{$t}%")
                ->orWhereHas('institute', fn ($i) => $i->where('college_no', 'like', "{$t}%"))))
            ->withCount('students')
            ->orderByRaw("CASE role WHEN 'super_admin' THEN 0 WHEN 'board' THEN 1 WHEN 'institute' THEN 2 ELSE 3 END")->orderBy('name')
            ->paginate(40)->withQueryString();

        return view('admin.users.index', [
            'users' => $users,
            'counts' => User::selectRaw('role, count(*) as n')->groupBy('role')->pluck('n', 'role'),
        ]);
    }

    public function create(Request $request)
    {
        $institute = $request->filled('institute') ? Institute::find($request->integer('institute')) : null;
        $user = new User([
            'role' => $institute ? User::INSTITUTE : $request->query('role', User::INSTITUTE),
            'institute_id' => $institute?->id,
            'board_id' => $institute?->board_id,
            'name' => $institute ? 'Principal, ' . Str::limit($institute->name, 60, '') : null,
            'username' => $institute ? strtoupper(str_replace('.', '', $institute->college_no)) : null,
            'email' => $institute?->contact_email,
            'is_active' => true,
            'must_change_password' => true,
        ]);
        return view('admin.users.form', ['user' => $user, 'boards' => Board::orderBy('sort')->get(), 'institute' => $institute, 'suggested' => $this->suggestPassword()]);
    }

    public function store(Request $request)
    {
        $data = $this->validated($request);
        $user = User::create($data);
        AuditLog::record('user.created', $user, ['role' => $user->role]);
        return redirect()->route('admin.users.index', ['q' => $user->username ?? $user->email])
            ->with('status', __('Login created for :name. Share the username and password privately.', ['name' => $user->name]));
    }

    public function edit(User $user)
    {
        return view('admin.users.form', ['user' => $user->load('institute', 'students'), 'boards' => Board::orderBy('sort')->get(), 'institute' => $user->institute, 'suggested' => $this->suggestPassword()]);
    }

    public function update(Request $request, User $user)
    {
        $data = $this->validated($request, $user);
        if ($user->is($request->user())) {
            unset($data['role'], $data['is_active']); // never lock yourself out
        }
        $user->update($data);
        AuditLog::record('user.updated', $user, ['password_reset' => isset($data['password'])]);
        return redirect()->route('admin.users.index', ['q' => $user->username ?? $user->email])
            ->with('status', isset($data['password']) ? __('Password reset for :name.', ['name' => $user->name]) : __('Details saved for :name.', ['name' => $user->name]));
    }

    public function destroy(Request $request, User $user)
    {
        abort_if($user->is($request->user()), 403, __('You cannot remove your own login.'));
        if ($user->role === User::STUDENT && $user->students()->whereHas('applications', fn ($q) => $q->whereNotNull('paid_at'))->exists()) {
            $user->update(['is_active' => false]);
            return back()->with('status', __('This account has paid exam forms, so it was deactivated instead of deleted.'));
        }
        if ($user->role === User::SUPER_ADMIN && User::where('role', User::SUPER_ADMIN)->where('is_active', true)->count() <= 1) {
            return back()->with('warning', __('At least one super admin must remain.'));
        }
        $user->delete();
        AuditLog::record('user.deleted', null, ['name' => $user->name, 'role' => $user->role]);
        return redirect()->route('admin.users.index')->with('status', __(':name has been removed.', ['name' => $user->name]));
    }

    private function validated(Request $request, ?User $user = null): array
    {
        $role = $request->input('role', $user?->role);
        $isStaff = $role !== User::STUDENT;
        $v = $request->validate([
            'role' => ['required', Rule::in(array_keys(User::ROLES))],
            'name' => ['required', 'string', 'max:150'],
            'username' => [$isStaff ? 'required' : 'nullable', 'string', 'min:4', 'max:60', 'regex:/^[A-Za-z0-9._-]+$/', Rule::unique('users')->ignore($user?->id)],
            'email' => ['nullable', 'email', 'max:150', Rule::unique('users')->ignore($user?->id)],
            'mobile' => ['nullable', 'regex:/^[6-9]\d{9}$/'],
            'board_id' => [$role === User::BOARD ? 'required' : 'nullable', 'exists:boards,id'],
            'institute_id' => [$role === User::INSTITUTE ? 'required' : 'nullable', 'exists:institutes,id'],
            'password' => [$user ? 'nullable' : ($isStaff ? 'required' : 'nullable'), Password::min(8)->letters()->numbers()],
        ], ['username.regex' => __('Use letters, numbers, dot, dash or underscore only.')]);

        if (blank($v['password'] ?? null)) {
            unset($v['password']);
        }
        if ($role === User::INSTITUTE) {
            $v['board_id'] = Institute::whereKey($v['institute_id'])->value('board_id');
        } else {
            $v['institute_id'] = null;
        }
        if ($role === User::SUPER_ADMIN) {
            $v['board_id'] = null;
        }
        $v['is_active'] = $request->boolean('is_active');
        $v['must_change_password'] = $request->boolean('must_change_password');
        return $v;
    }

    private function suggestPassword(): string
    {
        $words = ['Lotus', 'River', 'Tiger', 'Mango', 'Peacock', 'Banyan', 'Monsoon', 'Sahyadri'];
        return $words[array_rand($words)] . '@' . random_int(1000, 9999) . Str::upper(Str::random(2));
    }
}
