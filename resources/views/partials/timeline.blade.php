{{-- Status history of an exam form --}}
@php
    $labels = [
        'submit' => __('Sent to college'), 'return' => __('Sent back for correction'), 'verify' => __('Verified and forwarded to board'),
        'board_return' => __('Returned by board'), 'approve' => __('Approved by board'), 'reject' => __('Rejected by board'),
        'reopen' => __('Reopened by board'), 'corrected' => __('Details corrected'),
    ];
@endphp
<ol class="timeline">
    @foreach ($application->events as $e)
        <li>
            <span @class(['tl-dot', 'tl-ok' => in_array($e->action, ['verify', 'approve']), 'tl-warn' => in_array($e->action, ['return', 'board_return', 'corrected']), 'tl-bad' => $e->action === 'reject'])></span>
            <p class="font-semibold">{{ $labels[$e->action] ?? $e->action }}</p>
            <p class="text-sm muted">{{ $e->created_at->format('d M Y, h:i A') }} @if ($e->user) · {{ $e->user->name }}@endif</p>
            @if ($e->note)<p class="mt-1 rounded-md bg-wash px-3 py-2 text-sm">{{ $e->note }}</p>@endif
            @if ($e->changes)
                <ul class="mt-1 text-sm muted">@foreach ($e->changes as $field => $change)<li><span class="font-medium text-ink-2">{{ __(\Illuminate\Support\Str::headline($field)) }}</span>: {{ is_array($change) ? ($change['from'] ?? '—') . ' → ' . ($change['to'] ?? '—') : $change }}</li>@endforeach</ul>
            @endif
        </li>
    @endforeach
    <li>
        <span class="tl-dot"></span>
        <p class="font-semibold">{{ __('Form started') }}</p>
        <p class="text-sm muted">{{ $application->created_at->format('d M Y, h:i A') }}</p>
    </li>
</ol>
