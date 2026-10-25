<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Staff sign-in: 8 tries a minute per username and address (not shared across roles), 40 per address.
        \Illuminate\Support\Facades\RateLimiter::for('staff-login', fn ($request) => [
            \Illuminate\Cache\RateLimiting\Limit::perMinute(8)->by(strtolower((string) $request->input('username')) . '|' . $request->ip()),
            \Illuminate\Cache\RateLimiting\Limit::perMinute(40)->by('ip|' . $request->ip()),
        ]);

        // The app may live in a sub-folder (e.g. http://localhost/HSC-exam on XAMPP) or behind a proxy on
        // shared hosting. Build every link from APP_URL so assets and routes always resolve correctly.
        $url = (string) config('app.url');
        if ($url !== '' && ! $this->app->runningUnitTests()) {
            \Illuminate\Support\Facades\URL::forceRootUrl(rtrim($url, '/'));
            if (str_starts_with($url, 'https://')) {
                \Illuminate\Support\Facades\URL::forceScheme('https');
            }
        }
    }
}
