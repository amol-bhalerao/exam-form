@props(['tone' => 'ink'])
{{-- Board Exam mark: a graduation cap over an answer sheet with a gold tick, on a peacock-to-rani tile. --}}
@php
    $id = 'lg' . substr(md5($tone . uniqid()), 0, 6);
    $fg = $tone === 'ink' ? '#ffffff' : '#1d1846';
    $sheet = $tone === 'ink' ? '#ffffff' : '#1d1846';
@endphp
<svg viewBox="0 0 44 44" {{ $attributes->merge(['aria-hidden' => 'true']) }}>
    <defs><linearGradient id="{{ $id }}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0b5cad"/><stop offset=".55" stop-color="#5b2a86"/><stop offset="1" stop-color="#c8175d"/></linearGradient></defs>
    <rect x="1" y="1" width="42" height="42" rx="11" fill="{{ $tone === 'ink' ? 'url(#' . $id . ')' : '#ffffff' }}" />
    {{-- answer sheet --}}
    <rect x="12" y="19" width="20" height="17" rx="2.5" fill="none" stroke="{{ $sheet }}" stroke-width="2" opacity=".85" />
    <path d="M16 31.5l3 3 6.5-7" fill="none" stroke="#ffc21a" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" />
    {{-- graduation cap --}}
    <path d="M22 7.5 37 13.5 22 19.5 7 13.5Z" fill="{{ $fg }}" />
    <path d="M14 16.4v3.4c2.2 1.6 5 2.4 8 2.4s5.8-.8 8-2.4v-3.4L22 19.5Z" fill="{{ $fg }}" opacity=".75" />
    <path d="M35 14.3v6.2" stroke="#ffc21a" stroke-width="1.8" stroke-linecap="round" />
    <circle cx="35" cy="21.6" r="1.8" fill="#ffc21a" />
</svg>
