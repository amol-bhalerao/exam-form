<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Student\ApplicationController;
use App\Models\Application;
use App\Models\AuditLog;
use App\Models\Payment;
use App\Services\ApplicationWorkflow;
use App\Services\Cashfree;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

/**
 * Exam fee payment. A successful payment sends the form to the institute.
 * Cashfree is used when keys are configured; locally a "simulate" button can stand in.
 */
class PaymentController extends Controller
{
    public function __construct(private Cashfree $cashfree, private ApplicationWorkflow $workflow) {}

    public function start(Request $request, Application $application)
    {
        $this->authorizeOwner($request, $application);
        $request->validate(['declaration' => ['accepted']], ['declaration.accepted' => __('Please confirm the declaration.')]);

        if ($application->isPaid()) {
            return app(ApplicationController::class)->submit($request, $application);
        }
        abort_unless($application->editableByStudent(), 403);

        $problems = app(ApplicationController::class)->blockingProblems($application->load('exam.fees', 'student', 'stream'));
        if ($problems) {
            return redirect()->route('student.applications.edit', [$application, 'review'])->withErrors($problems);
        }

        if ($this->cashfree->configured() && ! $this->cashfree->usable()) {
            report(new \RuntimeException('Cashfree sandbox keys are set on the live site; payments are blocked. Add production keys and set CASHFREE_ENV=production.'));
            return redirect()->route('student.applications.edit', [$application, 'review'])
                ->withErrors(['payment' => __('Online payment is not available right now. Please try again later.')]);
        }

        // Fee is recalculated at the moment of payment (late fee may have started).
        $fee = $application->exam->feeFor($application->candidate_type);
        $application->forceFill(['fee_amount' => $fee['total'], 'late_fee_applied' => $fee['late'] > 0])->save();

        $payment = Payment::create([
            'application_id' => $application->id,
            'user_id' => $request->user()->id,
            'gateway' => $this->cashfree->configured() ? 'cashfree' : 'test',
            'order_id' => 'EF' . now()->format('ymdHis') . Str::upper(Str::random(5)),
            'amount' => $fee['total'],
            'status' => 'created',
        ]);

        if ($fee['total'] === 0) {
            $this->markPaid($payment, ['method' => 'NO_FEE']);
            return redirect()->route('student.applications.show', $application)->with('status', __('Your form has been sent to your college for verification.'));
        }

        if (! $this->cashfree->configured()) {
            abort_unless(config('portal.allow_test_payments'), 503, __('Online payment is not available right now. Please try again later.'));
            return view('payments.checkout', ['payment' => $payment, 'application' => $application, 'test' => true]);
        }

        try {
            $order = $this->cashfree->createOrder($payment, $application, $request->user(), route('payments.return', ['order' => $payment->order_id]));
        } catch (Throwable $e) {
            report($e);
            $payment->update(['status' => 'failed', 'payload' => ['error' => $e->getMessage()]]);
            return redirect()->route('student.applications.edit', [$application, 'review'])
                ->withErrors(['payment' => __('The payment gateway could not be reached. Please try again in a few minutes.')]);
        }
        $payment->update(['payment_session_id' => $order['payment_session_id'] ?? null, 'payload' => ['order' => $order]]);

        return view('payments.checkout', ['payment' => $payment, 'application' => $application, 'test' => false, 'mode' => $this->cashfree->mode()]);
    }

    /** Cashfree sends the student back here; confirm the order status with the API (never trust the browser). */
    public function return(Request $request)
    {
        $payment = Payment::where('order_id', (string) $request->query('order'))->firstOrFail();
        $application = $payment->application;
        $this->authorizeOwner($request, $application);

        if ($payment->status !== 'paid') {
            try {
                $order = $this->cashfree->fetchOrder($payment->order_id);
                $status = $order['order_status'] ?? 'ACTIVE';
                if ($status === 'PAID') {
                    $this->markPaid($payment, ['order' => $order] + $this->cashfree->paymentDetails($payment->order_id));
                } elseif (in_array($status, ['EXPIRED', 'TERMINATED'], true)) {
                    $payment->update(['status' => 'expired']);
                }
            } catch (Throwable $e) {
                report($e);
            }
        }

        $payment->refresh();
        return $payment->status === 'paid'
            ? redirect()->route('student.applications.show', $application)->with('status', __('Payment received. Your form has been sent to your college for verification.'))
            : redirect()->route('student.applications.edit', [$application, 'review'])->with('warning', __('The payment was not completed. You can try again.'));
    }

    /** Server-to-server confirmation from Cashfree. */
    public function webhook(Request $request)
    {
        $raw = $request->getContent();
        if (! $this->cashfree->verifyWebhook($raw, (string) $request->header('x-webhook-timestamp'), (string) $request->header('x-webhook-signature'))) {
            return response()->json(['ok' => false], 401);
        }
        $data = json_decode($raw, true) ?: [];
        $orderId = $data['data']['order']['order_id'] ?? null;
        $status = $data['data']['payment']['payment_status'] ?? null;
        $payment = $orderId ? Payment::where('order_id', $orderId)->first() : null;
        if ($payment && $status === 'SUCCESS') {
            $this->markPaid($payment, [
                'webhook' => $data,
                'gateway_payment_id' => $data['data']['payment']['cf_payment_id'] ?? null,
                'method' => $data['data']['payment']['payment_group'] ?? null,
            ]);
        } elseif ($payment && $status === 'FAILED' && $payment->status !== 'paid') {
            $payment->update(['status' => 'failed']);
        }
        return response()->json(['ok' => true]);
    }

    /** Local testing only: pretend the gateway confirmed the payment. */
    public function simulate(Request $request, Application $application)
    {
        abort_unless(config('portal.allow_test_payments') && ! $this->cashfree->configured(), 404);
        $this->authorizeOwner($request, $application);
        $payment = $application->payments()->where('status', 'created')->latest('id')->firstOrFail();
        $this->markPaid($payment, ['method' => 'TEST']);
        return redirect()->route('student.applications.show', $application)->with('status', __('Payment received. Your form has been sent to your college for verification.'));
    }

    private function authorizeOwner(Request $request, Application $application): void
    {
        abort_unless($application->student && $application->student->owner_id === $request->user()->id, 404);
    }

    /** Idempotent: safe to call from the return page and the webhook. */
    private function markPaid(Payment $payment, array $details): void
    {
        DB::transaction(function () use ($payment, $details) {
            $payment = Payment::lockForUpdate()->find($payment->id);
            if ($payment->status === 'paid') {
                return;
            }
            $payment->update([
                'status' => 'paid',
                'paid_at' => now(),
                'gateway_payment_id' => $details['gateway_payment_id'] ?? $payment->gateway_payment_id,
                'method' => $details['method'] ?? $payment->method,
                'payload' => array_merge($payment->payload ?? [], array_diff_key($details, array_flip(['gateway_payment_id', 'method']))),
            ]);
            $application = Application::lockForUpdate()->find($payment->application_id);
            $application->forceFill(['paid_at' => now(), 'fee_amount' => $payment->amount])->save();
            AuditLog::record('payment.paid', $payment, ['amount' => $payment->amount, 'order' => $payment->order_id]);
            if ($this->workflow->can($application, 'submit')) {
                $this->workflow->apply($application, 'submit', $payment->user);
            }
        });
    }
}
