<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;

class PaymentController extends Controller
{
    public function index(Request $request)
    {
        $q = Payment::query()
            ->when($request->query('status'), fn ($w, $s) => $w->where('status', $s))
            ->when($request->query('from'), fn ($w, $d) => $w->where('created_at', '>=', $d))
            ->when($request->query('to'), fn ($w, $d) => $w->where('created_at', '<=', $d . ' 23:59:59'))
            ->when(trim((string) $request->query('q')), fn ($w, $t) => $w->where(fn ($x) => $x->where('order_id', 'like', "%{$t}%")
                ->orWhere('gateway_payment_id', 'like', "%{$t}%")->orWhereHas('application', fn ($a) => $a->where('application_no', 'like', "%{$t}%"))));

        return view('admin.payments', [
            'payments' => (clone $q)->with('application.student', 'application.institute', 'user')->latest()->paginate(40)->withQueryString(),
            'total' => (int) (clone $q)->where('status', 'paid')->sum('amount'),
            'paidCount' => (clone $q)->where('status', 'paid')->count(),
        ]);
    }
}
