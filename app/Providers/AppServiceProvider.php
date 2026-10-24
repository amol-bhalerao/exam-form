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
