<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Payment;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class PaymentWebhookTest extends TestCase
{
    use PortalData;

    private function order(): Payment
    {
        config(['portal.cashfree.app_id' => 'TESTAPP', 'portal.cashfree.secret' => 'test-secret']);
        $form = $this->makeForm(Application::DRAFT);
        return Payment::create(['application_id' => $form->id, 'user_id' => $this->parent()->id, 'gateway' => 'cashfree', 'order_id' => 'EFTEST1', 'amount' => $form->fee_amount, 'status' => 'created']);
    }

    private function send(array $body, ?string $secret = 'test-secret')
    {
        $raw = json_encode($body);
        $ts = (string) time();
        $sig = base64_encode(hash_hmac('sha256', $ts . $raw, $secret, true));
        return $this->call('POST', '/payments/cashfree/webhook', [], [], [], [
            'CONTENT_TYPE' => 'application/json', 'HTTP_X_WEBHOOK_TIMESTAMP' => $ts, 'HTTP_X_WEBHOOK_SIGNATURE' => $sig,
        ], $raw);
    }

    public function test_signed_success_webhook_marks_the_form_paid_and_sends_it_to_college(): void
    {
        $payment = $this->order();
        $this->send(['data' => ['order' => ['order_id' => 'EFTEST1'], 'payment' => ['payment_status' => 'SUCCESS', 'cf_payment_id' => 987, 'payment_group' => 'upi']]])->assertOk();
        $payment->refresh();
        $this->assertSame('paid', $payment->status);
        $this->assertSame(Application::SUBMITTED, $payment->application->status);
        // A repeated webhook does not pay twice.
        $this->send(['data' => ['order' => ['order_id' => 'EFTEST1'], 'payment' => ['payment_status' => 'SUCCESS']]])->assertOk();
        $this->assertSame(1, $payment->application->events()->where('action', 'submit')->count());
    }

    public function test_unsigned_or_forged_webhook_is_rejected(): void
    {
        $payment = $this->order();
        $this->send(['data' => ['order' => ['order_id' => 'EFTEST1'], 'payment' => ['payment_status' => 'SUCCESS']]], 'wrong-secret')->assertStatus(401);
        $this->postJson('/payments/cashfree/webhook', ['data' => []])->assertStatus(401);
        $this->assertSame('created', $payment->refresh()->status);
    }

    public function test_demo_login_and_simulated_payment_are_off_in_production_settings(): void
    {
        config(['portal.allow_test_payments' => false, 'portal.allow_demo_student_login' => false]);
        $this->post('/auth/demo-student')->assertNotFound();
        $form = $this->makeForm(Application::DRAFT);
        $this->actingAs($this->parent())->post(route('payments.simulate', $form))->assertNotFound();
    }

    public function test_friendly_error_pages(): void
    {
        $this->get('/this-page-does-not-exist')->assertNotFound()->assertSee(__('Page not found'));
    }
}
