@props(['tone' => 'ink'])
{{-- Mark: a row of answer bubbles, one marked in zari gold, on a peacock-to-rani tile. --}}
@php $id = 'lg' . substr(md5($tone . uniqid()), 0, 6); @endphp
<svg viewBox="0 0 44 44" {{ $attributes->merge(['aria-hidden' => 'true']) }}>
    <defs><linearGradient id="{{ $id }}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b5cad"/><stop offset=".6" stop-color="#5b2a86"/><stop offset="1" stop-color="#c8175d"/></linearGradient></defs>
    <rect x="1" y="1" width="42" height="42" rx="11" fill="{{ $tone === 'ink' ? 'url(#' . $id . ')' : '#ffffff' }}" />
    <circle cx="12" cy="18" r="5" fill="none" stroke="{{ $tone === 'ink' ? '#ffffff' : '#1d1846' }}" stroke-width="2" />
    <circle cx="22" cy="18" r="5" fill="#ffc21a" />
    <circle cx="32" cy="18" r="5" fill="none" stroke="{{ $tone === 'ink' ? '#ffffff' : '#1d1846' }}" stroke-width="2" />
    <rect x="9" y="29" width="26" height="3" rx="1.5" fill="{{ $tone === 'ink' ? '#ffffff' : '#1d1846' }}" opacity=".6" />
</svg>
