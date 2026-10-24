<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditController extends Controller
{
    public function index(Request $request)
    {
        $logs = AuditLog::query()->with('user')
            ->when($request->query('action'), fn ($q, $a) => $q->where('action', 'like', "{$a}%"))
            ->when($request->query('user'), fn ($q, $u) => $q->where('user_id', $u))
            ->when($request->query('date'), fn ($q, $d) => $q->whereDate('created_at', $d))
            ->latest('id')->paginate(50)->withQueryString();
        $groups = AuditLog::query()->selectRaw('action')->distinct()->pluck('action')
            ->map(fn ($a) => explode('.', $a)[0])->unique()->sort()->values();
        return view('admin.audit', ['logs' => $logs, 'groups' => $groups]);
    }
}
