<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;

/**
 * On shared hosting there is no terminal to run "php artisan migrate" after uploading new files.
 * When the set of migration files changes, the first request applies the database changes
 * (and loads new starter questions), so new pages never fail on missing tables.
 * A marker file records the version that was applied; this costs one small file read per request.
 */
class AutoUpdateDatabase
{
    public function handle(Request $request, Closure $next)
    {
        if (app()->runningUnitTests()) {
            return $next($request);
        }
        $files = glob(database_path('migrations/*.php')) ?: [];
        $version = md5(implode('|', array_map('basename', $files)));
        $marker = storage_path('framework/db-version.txt');
        if (@file_get_contents($marker) !== $version) {
            $this->update($marker, $version);
        }
        return $next($request);
    }

    private function update(string $marker, string $version): void
    {
        $lock = fopen(storage_path('framework/db-update.lock'), 'c');
        if (! $lock || ! flock($lock, LOCK_EX | LOCK_NB)) {
            return; // another request is updating right now
        }
        try {
            @set_time_limit(300);
            Artisan::call('migrate', ['--force' => true]);
            if (! \App\Models\Question::exists()) {
                Artisan::call('db:seed', ['--class' => \Database\Seeders\QuestionBankSeeder::class, '--force' => true]);
            }
            if (config('portal.demo_logins')) {
                Artisan::call('db:seed', ['--class' => \Database\Seeders\DemoAccountsSeeder::class, '--force' => true]);
            }
            file_put_contents($marker, $version);
            Log::info('Database updated automatically to ' . $version);
        } catch (\Throwable $e) {
            report($e); // the site keeps working on the old tables; the super admin can retry with "Apply update"
        } finally {
            flock($lock, LOCK_UN);
            fclose($lock);
        }
    }
}
