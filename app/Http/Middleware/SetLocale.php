<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Language: ?lang= → session → signed-in user's choice → Marathi. */
class SetLocale
{
    public function handle(Request $request, Closure $next)
    {
        $supported = array_keys(config('portal.locales'));
        $locale = $request->query('lang');
        if (in_array($locale, $supported, true)) {
            $request->session()->put('locale', $locale);
        }
        $locale = $request->session()->get('locale') ?? $request->user()?->locale ?? config('app.locale');
        app()->setLocale(in_array($locale, $supported, true) ? $locale : 'mr');
        return $next($request);
    }
}
