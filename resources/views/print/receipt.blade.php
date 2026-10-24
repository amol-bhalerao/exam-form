<x-layouts.print :title="__('Fee receipt') . ' ' . $application->application_no">
    <article class="page" style="min-height:auto">
        <div class="flex items-start justify-between gap-6 border-b-2 border-ink pb-4">
            <div class="flex items-center gap-3">
                <x-logo class="size-12" />
                <div><p class="font-display text-lg font-bold" style="font-stretch:110%">{{ \App\Models\Setting::get('site_name', config('app.name')) }}</p><p class="text-sm muted">{{ __('Exam fee receipt') }}</p></div>
            </div>
            <div class="text-right"><p class="text-sm muted">{{ __('Receipt no.') }}</p><p class="font-bold tabular-nums">{{ $payment?->order_id ?? $application->application_no }}</p></div>
        </div>
        <div class="my-6 flex flex-wrap items-end justify-between gap-6">
            <div>
                <p class="text-sm muted">{{ __('Amount received') }}</p>
                <p class="font-display text-5xl font-bold tabular-nums" style="font-stretch:112%">₹{{ number_format($application->fee_amount) }}</p>
                @if ($application->late_fee_applied)<p class="text-sm muted">{{ __('Includes late fee') }}</p>@endif
            </div>
            <span class="badge-ok text-base">{{ __('Paid') }} · {{ $application->paid_at?->format('d M Y, h:i A') }}</span>
        </div>
        <table class="pf-table" style="font-size:10pt">
            <tbody>
                <tr><th style="width:55mm">{{ __('Candidate') }}</th><td>{{ $application->student->full_name }}</td></tr>
                <tr><th>{{ __('Application no.') }}</th><td>{{ $application->application_no }}</td></tr>
                <tr><th>{{ __('Exam') }}</th><td>{{ $application->exam->name }}</td></tr>
                <tr><th>{{ __('Candidate type') }}</th><td>{{ $application->candidate_type_label }}</td></tr>
                <tr><th>{{ __('College / school') }}</th><td>{{ $application->institute->display_name }}</td></tr>
                <tr><th>{{ __('Payment reference') }}</th><td>{{ $payment?->gateway_payment_id ?: '—' }} · {{ $payment?->method ?: $payment?->gateway }}</td></tr>
            </tbody>
        </table>
        <p class="mt-6 text-sm muted">{{ __('This is a computer-generated receipt and does not need a signature. Keep it until the exam results are declared.') }}</p>
    </article>
</x-layouts.print>
