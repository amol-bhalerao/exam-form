<?php

use App\Http\Controllers\Admin;
use App\Http\Controllers\Auth\GoogleController;
use App\Http\Controllers\Auth\PasswordController;
use App\Http\Controllers\Auth\StaffLoginController;
use App\Http\Controllers\Board;
use App\Http\Controllers\Institute;
use App\Http\Controllers\LookupController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrintController;
use App\Http\Controllers\Site;
use App\Http\Controllers\Student;
use Illuminate\Support\Facades\Route;

/* ------------------------------------------------------------------ public website */
Route::get('/', [Site\HomeController::class, 'index'])->name('home');
Route::get('/notices', [Site\NoticeController::class, 'index'])->name('notices.index');
Route::get('/notices/{notice:slug}', [Site\NoticeController::class, 'show'])->name('notices.show');
Route::get('/exams', [Site\HomeController::class, 'exams'])->name('exams.calendar');
Route::get('/verify', [Site\VerifyController::class, 'form'])->name('verify.form');
Route::get('/verify/{number}', [Site\VerifyController::class, 'show'])->name('verify.show')->where('number', '[A-Za-z0-9\-]+');
Route::get('/sitemap.xml', [Site\SeoController::class, 'sitemap'])->name('sitemap');
Route::get('/robots.txt', [Site\SeoController::class, 'robots']);
Route::get('/language/{locale}', [Site\HomeController::class, 'language'])->name('language');

/* ------------------------------------------------------------------ sign in */
Route::middleware('guest')->group(function () {
    Route::get('/login', [GoogleController::class, 'login'])->name('login');
    Route::get('/auth/google', [GoogleController::class, 'redirect'])->name('auth.google');
    Route::get('/auth/google/callback', [GoogleController::class, 'callback']);
    Route::post('/auth/demo-student', [GoogleController::class, 'demo'])->name('auth.demo');

    // Unlisted staff sign-in pages (paths come from .env; never linked from the site).
    foreach (config('portal.login_paths') as $role => $path) {
        Route::get($path, [StaffLoginController::class, 'show'])->defaults('role', $role)->name("staff.login.$role");
        Route::post($path, [StaffLoginController::class, 'login'])->defaults('role', $role)->middleware('throttle:8,1');
    }
});
Route::post('/logout', [StaffLoginController::class, 'logout'])->middleware('auth')->name('logout');

Route::middleware('auth')->prefix('account')->group(function () {
    Route::get('/password', [PasswordController::class, 'edit'])->name('password.edit');
    Route::put('/password', [PasswordController::class, 'update'])->name('password.update');
});

Route::get('/lookup/institutes', [LookupController::class, 'institutes'])->middleware('throttle:60,1')->name('lookup.institutes');

/* ------------------------------------------------------------------ payments */
Route::post('/payments/cashfree/webhook', [PaymentController::class, 'webhook'])->name('payments.webhook');
Route::middleware(['auth', 'role:student'])->group(function () {
    Route::post('/payments/{application}/start', [PaymentController::class, 'start'])->name('payments.start');
    Route::get('/payments/return', [PaymentController::class, 'return'])->name('payments.return');
    Route::post('/payments/{application}/simulate', [PaymentController::class, 'simulate'])->name('payments.simulate');
});

/* ------------------------------------------------------------------ printing (any role that may see the form) */
Route::middleware('auth')->group(function () {
    Route::get('/forms/{application}/print', [PrintController::class, 'form'])->name('forms.print');
    Route::get('/forms/{application}/receipt', [PrintController::class, 'receipt'])->name('forms.receipt');
    Route::get('/forms/print', [PrintController::class, 'bulk'])->name('forms.print.bulk');
});

/* ------------------------------------------------------------------ student accounts (Google) */
Route::middleware(['auth', 'role:student'])->prefix('student')->name('student.')->group(function () {
    Route::get('/', [Student\DashboardController::class, 'index'])->name('dashboard');
    Route::resource('students', Student\StudentController::class)->except(['index', 'show', 'destroy']);
    Route::delete('students/{student}', [Student\StudentController::class, 'destroy'])->name('students.destroy');
    Route::get('applications/new/{student}', [Student\ApplicationController::class, 'create'])->name('applications.create');
    Route::post('applications/new/{student}', [Student\ApplicationController::class, 'store'])->name('applications.store');
    Route::get('applications/{application}', [Student\ApplicationController::class, 'show'])->name('applications.show');
    Route::get('applications/{application}/step/{step}', [Student\ApplicationController::class, 'edit'])->name('applications.edit');
    Route::put('applications/{application}/step/{step}', [Student\ApplicationController::class, 'update'])->name('applications.update');
    Route::post('applications/{application}/check-subjects', [Student\ApplicationController::class, 'checkSubjects'])->name('applications.check');
    Route::post('applications/{application}/submit', [Student\ApplicationController::class, 'submit'])->name('applications.submit');
    Route::delete('applications/{application}', [Student\ApplicationController::class, 'destroy'])->name('applications.destroy');
});

/* ------------------------------------------------------------------ institute */
Route::middleware(['auth', 'role:institute'])->prefix('institute')->name('institute.')->group(function () {
    Route::get('/', [Institute\DashboardController::class, 'index'])->name('dashboard');
    Route::get('forms', [Institute\FormController::class, 'index'])->name('forms.index');
    Route::get('forms/export', [Institute\FormController::class, 'export'])->name('forms.export');
    Route::post('forms/bulk', [Institute\FormController::class, 'bulk'])->name('forms.bulk');
    Route::get('forms/{application}', [Institute\FormController::class, 'show'])->name('forms.show');
    Route::get('forms/{application}/edit', [Institute\FormController::class, 'edit'])->name('forms.edit');
    Route::put('forms/{application}', [Institute\FormController::class, 'update'])->name('forms.update');
    Route::post('forms/{application}/check-subjects', [Institute\FormController::class, 'checkSubjects'])->name('forms.check');
    Route::post('forms/{application}/decision', [Institute\FormController::class, 'decide'])->name('forms.decide');
    Route::resource('teachers', Institute\TeacherController::class)->except('show');
    Route::get('subjects', [Institute\SubjectController::class, 'index'])->name('subjects.index');
    Route::put('subjects/{stream}', [Institute\SubjectController::class, 'update'])->name('subjects.update');
    Route::get('profile', [Institute\ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('profile', [Institute\ProfileController::class, 'update'])->name('profile.update');
});

/* ------------------------------------------------------------------ board */
Route::middleware(['auth', 'role:board'])->prefix('board')->name('board.')->group(function () {
    Route::get('/', [Board\DashboardController::class, 'index'])->name('dashboard');
    Route::resource('exams', Board\ExamController::class)->except('show');
    Route::get('forms', [Board\FormController::class, 'index'])->name('forms.index');
    Route::get('forms/export', [Board\FormController::class, 'export'])->name('forms.export');
    Route::post('forms/bulk', [Board\FormController::class, 'bulk'])->name('forms.bulk');
    Route::get('forms/{application}', [Board\FormController::class, 'show'])->name('forms.show');
    Route::post('forms/{application}/decision', [Board\FormController::class, 'decide'])->name('forms.decide');
    Route::get('examiners', [Board\ExaminerController::class, 'index'])->name('examiners.index');
    Route::get('examiners/export', [Board\ExaminerController::class, 'export'])->name('examiners.export');
    Route::post('examiners/{teacher}/decision', [Board\ExaminerController::class, 'decide'])->name('examiners.decide');
    Route::get('institutes', [Board\InstituteController::class, 'index'])->name('institutes.index');
    Route::get('institutes/{institute}', [Board\InstituteController::class, 'show'])->name('institutes.show');
    Route::resource('notices', Board\NoticeController::class)->except('show');
});

/* ------------------------------------------------------------------ super admin */
Route::middleware(['auth', 'role:super_admin'])->prefix('admin')->name('admin.')->group(function () {
    Route::get('/', [Admin\DashboardController::class, 'index'])->name('dashboard');
    Route::get('institutes/import', [Admin\InstituteController::class, 'importForm'])->name('institutes.import');
    Route::post('institutes/import', [Admin\InstituteController::class, 'import']);
    Route::resource('institutes', Admin\InstituteController::class)->except('show');
    Route::resource('users', Admin\UserController::class)->except('show');
    Route::resource('subjects', Admin\SubjectController::class)->except('show');
    Route::get('streams', [Admin\StreamController::class, 'index'])->name('streams.index');
    Route::put('streams/{stream}', [Admin\StreamController::class, 'update'])->name('streams.update');
    Route::resource('pages', Admin\PageController::class)->except('show');
    Route::resource('notices', Admin\NoticeController::class)->except('show');
    Route::get('media', [Admin\MediaController::class, 'index'])->name('media.index');
    Route::post('media', [Admin\MediaController::class, 'store'])->name('media.store');
    Route::delete('media/{media}', [Admin\MediaController::class, 'destroy'])->name('media.destroy');
    Route::get('settings', [Admin\SettingController::class, 'edit'])->name('settings.edit');
    Route::put('settings', [Admin\SettingController::class, 'update'])->name('settings.update');
    Route::get('payments', [Admin\PaymentController::class, 'index'])->name('payments.index');
    Route::get('audit', [Admin\AuditController::class, 'index'])->name('audit.index');
});

/* ------------------------------------------------------------------ CMS pages (keep last) */
Route::get('/{page:slug}', [Site\PageController::class, 'show'])->name('page.show')->where('page', '[a-z0-9\-]+');
