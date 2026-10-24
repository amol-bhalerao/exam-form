<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Board;
use App\Models\Notice;
use App\Models\Page;
use App\Models\Payment;
use App\Models\User;
use App\Support\FormQuery;

class DashboardController extends Controller
{
    public function index()
    {
        return view('admin.dashboard', [
            'boards' => Board::orderBy('sort')->withCount([
                'institutes' => fn ($q) => $q->where('is_active', true),
                'exams',
            ])->get()->each(function ($b) {
                $b->forms = Application::where('board_id', $b->id)->whereNotNull('paid_at')->count();
            }),
            'counts' => FormQuery::statusCounts(Application::query()),
            'users' => User::selectRaw('role, count(*) as n')->groupBy('role')->pluck('n', 'role'),
            'collected' => (int) Payment::where('status', 'paid')->sum('amount'),
            'paymentsToday' => Payment::where('status', 'paid')->where('paid_at', '>=', now()->startOfDay())->count(),
            'pages' => ['published' => Page::where('status', 'published')->count(), 'draft' => Page::where('status', 'draft')->count()],
            'notices' => Notice::live()->count(),
            'recentPayments' => Payment::where('status', 'paid')->with('application.student')->latest('paid_at')->limit(6)->get(),
            'activity' => AuditLog::with('user')->latest('id')->limit(10)->get(),
            'failedLogins' => AuditLog::where('action', 'login.failed')->where('created_at', '>=', now()->subDay())->count(),
        ]);
    }
}
