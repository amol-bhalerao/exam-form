<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeaders
{
    public function handle(Request $request, Closure $next)
    {
        // One address for the whole site: send www.hscexam.in to hscexam.in (sessions and assets live there).
        $appHost = parse_url((string) config('app.url'), PHP_URL_HOST);
        if ($appHost && $request->getHost() === 'www.' . $appHost) {
            return redirect()->away(rtrim((string) config('app.url'), '/') . $request->getRequestUri(), 301);
        }

        $response = $next($request);

        // Phones that visited the previous website may still hold its cached files. On the first
        // visit to this version, ask the browser to drop them once.
        if ($request->isMethod('GET') && ! $request->cookies->has('site_v2') && str_contains((string) $response->headers->get('Content-Type'), 'text/html')) {
            $response->headers->set('Clear-Site-Data', '"cache", "storage"');
            $response->headers->setCookie(cookie('site_v2', '1', 60 * 24 * 365, httpOnly: true));
        }
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
        // Portal and staff pages must never appear in search results.
        if ($request->is('student*', 'institute*', 'board*', 'admin*', 'account*', 'payments*') || $request->attributes->get('noindex')) {
            $response->headers->set('X-Robots-Tag', 'noindex, nofollow');
        }
        return $response;
    }
}
