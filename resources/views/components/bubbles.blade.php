@props(['steps', 'current', 'done' => [], 'linkFor' => null])
{{-- OMR-style progress: each step is a bubble that fills in when complete --}}
<nav aria-label="{{ __('Form steps') }}" {{ $attributes->class('bubbles') }}>
    @foreach ($steps as $key => $label)
        @php $isDone = in_array($key, $done, true); $isCurrent = $key === $current; $href = $linkFor ? $linkFor($key) : null; @endphp
        <{{ $href ? 'a' : 'span' }} @if ($href) href="{{ $href }}" @endif
            @class(['bubble', 'done' => $isDone && ! $isCurrent]) @if ($isCurrent) aria-current="step" @endif>
            <span class="dot">@if ($isDone && ! $isCurrent)<x-icon name="check" class="omr-mark size-4" />@else{{ $loop->iteration }}@endif</span>
            <span class="hidden sm:inline">{{ $label }}</span>
        </{{ $href ? 'a' : 'span' }}>
    @endforeach
</nav>
