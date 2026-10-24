<?php

namespace App\Services;

use App\Models\Application;
use App\Models\Payment;
use App\Models\User;
use Illuminate\Support\Facades\Http;
use RuntimeException;

/** Minimal Cashfree Payment Gateway (PG API 2023-08-01) client. */
class Cashfree
{
    public function configured(): bool
    {
        return filled(config('portal.cashfree.app_id')) && filled(config('portal.cashfree.secret'));
    }

    /** False when the live site is set up with sandbox (test) keys — no fake payments in production. */
    public function usable(): bool
    {
        if (! $this->configured()) {
            return false;
        }
        return ! (app()->isProduction() && $this->mode() === 'sandbox' && ! config('portal.cashfree.allow_sandbox_on_live'));
    }

    public function mode(): string
    {
        return config('portal.cashfree.env') === 'production' ? 'production' : 'sandbox';
    }

    private function base(): string
    {
        return $this->mode() === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg';
    }

    private function client()
    {
        return Http::timeout(20)->acceptJson()->withHeaders([
            'x-client-id' => config('portal.cashfree.app_id'),
            'x-client-secret' => config('portal.cashfree.secret'),
            'x-api-version' => config('portal.cashfree.api_version'),
        ]);
    }

    public function createOrder(Payment $payment, Application $application, User $user, string $returnUrl): array
    {
        $student = $application->student;
        $res = $this->client()->post($this->base() . '/orders', [
            'order_id' => $payment->order_id,
            'order_amount' => (float) $payment->amount,
            'order_currency' => 'INR',
            'customer_details' => [
                'customer_id' => 'U' . $user->id,
                'customer_name' => $student->full_name,
                'customer_email' => $user->email ?: 'noreply@example.com',
                'customer_phone' => $student->mobile ?: '9999999999',
            ],
            'order_meta' => [
                'return_url' => $returnUrl,
                'notify_url' => route('payments.webhook'),
            ],
            'order_note' => "Exam fee {$application->application_no}",
            'order_tags' => ['application_no' => $application->application_no],
        ]);
        if (! $res->successful()) {
            throw new RuntimeException('Cashfree order failed: ' . $res->body());
        }
        return $res->json();
    }

    public function fetchOrder(string $orderId): array
    {
        $res = $this->client()->get($this->base() . '/orders/' . urlencode($orderId));
        if (! $res->successful()) {
            throw new RuntimeException('Cashfree order lookup failed: ' . $res->body());
        }
        return $res->json();
    }

    /** Successful payment id and method for an order, if any. */
    public function paymentDetails(string $orderId): array
    {
        $res = $this->client()->get($this->base() . '/orders/' . urlencode($orderId) . '/payments');
        $paid = collect($res->successful() ? $res->json() : [])->firstWhere('payment_status', 'SUCCESS');
        return $paid ? ['gateway_payment_id' => (string) ($paid['cf_payment_id'] ?? ''), 'method' => $paid['payment_group'] ?? null] : [];
    }

    public function verifyWebhook(string $raw, string $timestamp, string $signature): bool
    {
        if (! $this->configured() || $timestamp === '' || $signature === '') {
            return false;
        }
        $expected = base64_encode(hash_hmac('sha256', $timestamp . $raw, config('portal.cashfree.secret'), true));
        return hash_equals($expected, $signature);
    }
}
