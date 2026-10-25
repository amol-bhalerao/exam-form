<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Username + password sign-in for super admin, board and institute staff.
 * Each role has its own unlisted address (config/portal.php → login_paths).
 */
class StaffLoginController extends Controller
{
    private const LABELS = [
        'super_admin' => 'Administration',
        'board' => 'Board office',
        'institute' => 'College / school',
        'teacher' => 'Teacher',
    ];

    public function show(Request $request, string $role)
    {
        $request->attributes->set('noindex', true);
        return view('auth.staff', ['role' => $role, 'label' => __(self::LABELS[$role])]);
    }

    public function login(Request $request, string $role)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:150'],
            'password' => ['required', 'string', 'max:200'],
        ]);
        $field = filter_var($data['username'], FILTER_VALIDATE_EMAIL) ? 'email' : 'username';
        if (in_array(strtolower($data['username']), array_column(\Database\Seeders\DemoAccountsSeeder::ACCOUNTS, 0), true)
            && ($error = \Database\Seeders\DemoAccountsSeeder::ensure())) {
            return back()->withInput($request->only('username'))->withErrors(['username' => $error]);
        }

        $ok = Auth::attempt([$field => $data['username'], 'password' => $data['password'], 'role' => $role, 'is_active' => true], $request->boolean('remember'));
        if (! $ok) {
            AuditLog::record('login.failed', null, ['username' => $data['username'], 'role' => $role]);
            return back()->withInput($request->only('username'))->withErrors(['username' => __('Incorrect username or password.')]);
        }

        $request->session()->regenerate();
        $user = $request->user();
        $user->forceFill(['last_login_at' => now()])->save();
        AuditLog::record('login', $user);

        return redirect()->intended(route($user->homeRoute()));
    }

    public function logout(Request $request)
    {
        $role = $request->user()?->role;
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        if ($request->input('next') === 'demo' && config('portal.demo_logins')) {
            return redirect()->route('demo');
        }

        return $role && $role !== User::STUDENT && isset(config('portal.login_paths')[$role])
            ? redirect()->route("staff.login.$role")->with('status', __('You have signed out.'))
            : redirect()->route('home');
    }
}
