<x-layouts.portal :title="__('Pay exam fee')">
    <div class="mx-auto max-w-lg py-6">
        <div class="sheet sheet-pad rise text-center">
            <x-icon name="indian-rupee" class="mx-auto size-10 text-board" />
            <h1 class="display-lg mt-3">₹{{ number_format($payment->amount) }}</h1>
            <p class="lede mx-auto mt-2">{{ $application->exam->name }}<br>{{ $application->student->full_name }} · {{ $application->application_no }}</p>

            @if ($test)
                <div class="alert-warn mt-6 text-left"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" />
                    <p>{{ __('Test mode: online payment keys are not set up on this server. Use the button below to simulate a successful payment.') }}</p></div>
                <form method="POST" action="{{ route('payments.simulate', $application) }}" class="mt-5">
                    @csrf
                    <button class="btn-ok w-full"><x-icon name="circle-check" />{{ __('Simulate successful payment') }}</button>
                </form>
            @else
                <p class="mt-6 muted" id="pay-status">{{ __('Opening the secure payment page…') }}</p>
                <button type="button" id="pay-btn" class="btn-primary mt-4 w-full"><x-icon name="indian-rupee" />{{ __('Pay now') }}</button>
                <script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
                <script>
                    (function () {
                        const go = () => Cashfree({ mode: @js($mode) }).checkout({ paymentSessionId: @js($payment->payment_session_id), redirectTarget: '_self' });
                        document.getElementById('pay-btn').addEventListener('click', go);
                        window.addEventListener('load', () => { try { go(); } catch (e) { document.getElementById('pay-status').textContent = @js(__('Tap “Pay now” to continue.')); } });
                    })();
                </script>
            @endif
            <a href="{{ route('student.applications.edit', [$application, 'review']) }}" class="btn-quiet mt-3 w-full">{{ __('Cancel') }}</a>
        </div>
        <p class="mt-4 text-center text-xs muted">{{ __('Payments are processed by Cashfree Payments. Do not refresh this page during payment.') }}</p>
    </div>
</x-layouts.portal>
