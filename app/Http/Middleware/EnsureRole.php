<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/** role:board,institute — signed-in, active, and one of the given roles (with its board/institute set). */
class EnsureRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();
        if (! $user) {
            return redirect()->guest(route('login'));
        }
        if (! $user->is_active) {
            Auth::logout();
            return redirect()->route('login')->withErrors(['email' => __('This account is disabled. Contact the board office.')]);
        }
        if (! in_array($user->role, $roles, true)) {
            abort(403, __('This page is not available for your account.'));
        }
        if ($user->role === 'institute' && ! $user->institute_id) {
            abort(403, __('No institute is linked to this account.'));
        }
        if ($user->role === 'board' && ! $user->board_id) {
            abort(403, __('No board is linked to this account.'));
        }
        if ($user->must_change_password && ! $request->routeIs('password.*', 'logout')) {
            return redirect()->route('password.edit')->with('status', __('Please set a new password to continue.'));
        }
        return $next($request);
    }
}
