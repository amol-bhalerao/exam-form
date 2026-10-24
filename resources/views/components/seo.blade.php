@props(['title' => null, 'description' => null, 'image' => null, 'type' => 'website', 'noindex' => false, 'jsonld' => null])
@php
    $siteName = \App\Models\Setting::get('site_name', config('app.name'));
    $fullTitle = $title ? $title . ' · ' . $siteName : $siteName . ' — ' . \App\Models\Setting::get('tagline', '');
    $desc = $description ?: \App\Models\Setting::get('seo_description');
    $canonical = url()->current();
@endphp
<title>{{ $fullTitle }}</title>
<meta name="description" content="{{ \Illuminate\Support\Str::limit(strip_tags((string) $desc), 160) }}">
@if ($kw = \App\Models\Setting::get('seo_keywords'))<meta name="keywords" content="{{ $kw }}">@endif
<link rel="canonical" href="{{ $canonical }}">
@if ($noindex)<meta name="robots" content="noindex, nofollow">@endif
@foreach (array_keys(config('portal.locales')) as $alt)
<link rel="alternate" hreflang="{{ $alt }}" href="{{ $canonical }}?lang={{ $alt }}">
@endforeach
<meta property="og:type" content="{{ $type }}">
<meta property="og:site_name" content="{{ $siteName }}">
<meta property="og:title" content="{{ $title ?? $siteName }}">
<meta property="og:description" content="{{ \Illuminate\Support\Str::limit(strip_tags((string) $desc), 200) }}">
<meta property="og:url" content="{{ $canonical }}">
<meta property="og:locale" content="{{ ['mr' => 'mr_IN', 'hi' => 'hi_IN', 'en' => 'en_IN'][app()->getLocale()] }}">
@if ($image)<meta property="og:image" content="{{ $image }}">@endif
<meta name="twitter:card" content="{{ $image ? 'summary_large_image' : 'summary' }}">
<script type="application/ld+json">{!! json_encode($jsonld ?? [
    '@context' => 'https://schema.org', '@type' => 'WebSite', 'name' => $siteName, 'url' => url('/'),
    'inLanguage' => ['mr', 'hi', 'en'],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
