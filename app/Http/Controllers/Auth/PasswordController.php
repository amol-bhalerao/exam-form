<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Illuminate\Validation\Rules\Password;

class PasswordController extends Controller
{
    public function edit()
    {
        abort_if(auth()->user()->role === 'student', 404);
        return view('auth.password');
    }

    public function update(Request $request)
    {
        $user = $request->user();
        abort_if($user->role === 'student', 404);
        if ($user->is_demo) {
            return back()->with('warning', __('Demo accounts are shared, so their password cannot be changed.'));
        }
        $request->validate([
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::min(10)->mixedCase()->numbers()],
        ]);
        $user->forceFill(['password' => $request->password, 'must_change_password' => false])->save();
        AuditLog::record('password.changed', $user);

        return redirect()->route($user->homeRoute())->with('status', __('Password changed.'));
    }
}
