<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Throwable;

/** Students (and parents filling forms for them) sign in with Google only. */
class GoogleController extends Controller
{
    public function login()
    {
        return view('auth.login', [
            'googleReady' => filled(config('services.google.client_id')) && filled(config('services.google.client_secret')),
            'demo' => config('portal.allow_demo_student_login'),
        ]);
    }

    public function redirect()
    {
        if (blank(config('services.google.client_id'))) {
            return redirect()->route('login')->withErrors(['google' => __('Google sign-in is not set up yet. Please try again later.')]);
        }
        return Socialite::driver('google')->with(['prompt' => 'select_account'])->redirect();
    }

    public function callback(Request $request)
    {
        try {
            $google = Socialite::driver('google')->user();
        } catch (Throwable $e) {
            report($e);
            return redirect()->route('login')->withErrors(['google' => __('Google sign-in did not complete. Please try again.')]);
        }

        $user = User::where('google_id', $google->getId())->first()
            ?? User::where('email', $google->getEmail())->first();

        if ($user && $user->role !== User::STUDENT) {
            return redirect()->route('login')->withErrors(['google' => __('This email belongs to a staff account. Use the sign-in link shared by the board.')]);
        }
        if ($user && ! $user->is_active) {
            return redirect()->route('login')->withErrors(['google' => __('This account is disabled. Contact the board office.')]);
        }

        if (! $user && \App\Models\Setting::get('registration_open', '1') === '0') {
            return redirect()->route('login')->withErrors(['google' => __('New sign-ups are closed right now. Please check the notices for dates.')]);
        }
        $user ??= new User(['role' => User::STUDENT]);
        $user->fill([
            'name' => $google->getName() ?: $google->getEmail(),
            'email' => $google->getEmail(),
            'google_id' => $google->getId(),
            'avatar' => $google->getAvatar(),
        ]);
        $user->email_verified_at ??= now();
        $user->last_login_at = now();
        $user->save();

        Auth::login($user, remember: true);
        $request->session()->regenerate();
        AuditLog::record('login.google', $user);

        return redirect()->intended(route('student.dashboard'));
    }

    /** Local testing only: sign in as the demo student account without Google. */
    public function demo(Request $request)
    {
        abort_unless(config('portal.allow_demo_student_login'), 404);
        $user = User::firstOrCreate(['email' => 'student.demo@example.com'], ['name' => 'Demo Student', 'role' => User::STUDENT]);
        abort_unless($user->role === User::STUDENT, 404);
        $user->forceFill(['is_active' => true, 'is_demo' => (bool) config('portal.demo_logins') || $user->is_demo])->save();
        Auth::login($user);
        $request->session()->regenerate();
        return redirect()->route('student.dashboard');
    }
}
