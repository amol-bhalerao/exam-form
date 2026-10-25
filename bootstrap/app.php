<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Applies pending database changes after an upload (no terminal on shared hosting).
        $middleware->prepend(\App\Http\Middleware\AutoUpdateDatabase::class);
        $middleware->web(append: [
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\SecurityHeaders::class,
        ]);
        $middleware->alias(['role' => \App\Http\Middleware\EnsureRole::class]);
        $middleware->validateCsrfTokens(except: ['payments/cashfree/webhook']);
        // Guests opening a staff portal go to that role's sign-in page; everyone else to Google sign-in.
        $middleware->redirectGuestsTo(function ($request) {
            $role = ['admin' => 'super_admin', 'board' => 'board', 'institute' => 'institute', 'teacher' => 'teacher'][$request->segment(1)] ?? null;
            return $role && \Illuminate\Support\Facades\Route::has("staff.login.$role") ? route("staff.login.$role") : route('login');
        });
        $middleware->redirectUsersTo(fn ($request) => route($request->user()->homeRoute()));
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
