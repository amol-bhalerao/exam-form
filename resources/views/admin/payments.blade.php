<x-layouts.portal :title="__('Payments')">
    <x-page-header :title="__('Payments')" :subtitle="__('₹:total received in :n payments for this filter.', ['total' => number_format($total), 'n' => number_format($paidCount)])" />
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Order, payment or application no.') }}"></div>
        <div class="field"><label class="label" for="status">{{ __('Status') }}</label><select id="status" name="status" class="select"><option value="">{{ __('All') }}</option>@foreach (['paid' => __('Paid'), 'created' => __('Started'), 'failed' => __('Failed'), 'expired' => __('Expired')] as $k => $l)<option value="{{ $k }}" @selected(request('status') === $k)>{{ $l }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="from">{{ __('From') }}</label><input id="from" name="from" type="date" value="{{ request('from') }}" class="input"></div>
        <div class="field"><label class="label" for="to">{{ __('To') }}</label><input id="to" name="to" type="date" value="{{ request('to') }}" class="input"></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Order') }}</th><th>{{ __('Candidate') }}</th><th>{{ __('College') }}</th><th>{{ __('Method') }}</th><th class="num">{{ __('Amount') }}</th><th>{{ __('Status') }}</th><th>{{ __('When') }}</th></tr></thead>
            <tbody>
            @forelse ($payments as $p)
                <tr>
                    <td class="tabular-nums text-sm"><p class="font-semibold">{{ $p->order_id }}</p><p class="muted">{{ $p->gateway_payment_id ?: $p->gateway }}</p></td>
                    <td class="text-sm"><p class="font-semibold">{{ $p->application?->student?->full_name ?? '—' }}</p><p class="muted">{{ $p->application?->application_no }}</p></td>
                    <td class="max-w-56 truncate text-sm">{{ $p->application?->institute?->college_no }}</td>
                    <td class="text-sm">{{ $p->method ?: '—' }}</td>
                    <td class="num font-semibold">₹{{ number_format($p->amount) }}</td>
                    <td><span class="{{ ['paid' => 'badge-ok', 'failed' => 'badge-bad', 'expired' => 'badge-muted'][$p->status] ?? 'badge-pending' }}">{{ ['paid' => __('Paid'), 'failed' => __('Failed'), 'expired' => __('Expired')][$p->status] ?? __('Started') }}</span></td>
                    <td class="text-sm whitespace-nowrap">{{ ($p->paid_at ?? $p->created_at)->format('d M Y, h:i A') }}</td>
                </tr>
            @empty
                <tr><td colspan="7" class="py-8 text-center muted">{{ __('No payments match.') }}</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $payments->links() }}</div>
</x-layouts.portal>
