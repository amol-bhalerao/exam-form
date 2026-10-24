<x-layouts.portal :title="__('Activity log')">
    <x-page-header :title="__('Activity log')" :subtitle="__('Who did what, and when. Kept for security and audits.')" />
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="action">{{ __('Area') }}</label><select id="action" name="action" class="select"><option value="">{{ __('All') }}</option>@foreach ($groups as $g)<option value="{{ $g }}" @selected(request('action') === $g)>{{ \Illuminate\Support\Str::headline($g) }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="date">{{ __('Date') }}</label><input id="date" name="date" type="date" value="{{ request('date') }}" class="input"></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('When') }}</th><th>{{ __('Action') }}</th><th>{{ __('By') }}</th><th>{{ __('Record') }}</th><th>{{ __('Details') }}</th><th>IP</th></tr></thead>
            <tbody>
            @forelse ($logs as $l)
                <tr>
                    <td class="text-sm whitespace-nowrap tabular-nums">{{ $l->created_at?->format('d M Y, H:i') }}</td>
                    <td><span @class(['badge-bad' => str_contains($l->action, 'failed'), 'badge-muted' => ! str_contains($l->action, 'failed')])>{{ $l->action }}</span></td>
                    <td class="text-sm">{{ $l->user?->name ?? '—' }}</td>
                    <td class="text-sm">{{ $l->subject_type ? $l->subject_type . ' #' . $l->subject_id : '—' }}</td>
                    <td class="max-w-80 text-xs muted"><code class="break-all">{{ $l->details ? \Illuminate\Support\Str::limit(json_encode($l->details, JSON_UNESCAPED_UNICODE), 160) : '' }}</code></td>
                    <td class="text-xs tabular-nums muted">{{ $l->ip }}</td>
                </tr>
            @empty
                <tr><td colspan="6" class="py-8 text-center muted">{{ __('Nothing recorded.') }}</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $logs->links() }}</div>
</x-layouts.portal>
