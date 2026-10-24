@props(['label', 'value', 'tone' => 'muted', 'href' => null, 'hint' => null])
@php $icon = ['marigold' => 'clock', 'board' => 'send', 'leaf' => 'circle-check', 'ink' => 'indian-rupee', 'omr' => 'circle-alert', 'rani' => 'users', 'mor' => 'file-check', 'plum' => 'badge-check'][$tone] ?? 'list'; @endphp
<{{ $href ? 'a' : 'div' }} @if ($href) href="{{ $href }}" @endif {{ $attributes->class(['tile tone-' . ($tone === 'ink' ? 'plum' : $tone) . ' rise block no-underline text-ink', 'card-link' => $href]) }}>
    <div class="flex items-start justify-between gap-3">
        <p class="text-sm font-semibold text-ink-2">{{ $label }}</p>
        <span class="tone-icon size-9 rounded-lg"><x-icon :name="$icon" class="size-5" /></span>
    </div>
    <p class="tile-num mt-1">{{ is_numeric($value) ? number_format($value) : $value }}</p>
    @if ($hint)<p class="text-sm muted">{{ $hint }}</p>@endif
</{{ $href ? 'a' : 'div' }}>
