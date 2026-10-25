@props(['title' => null, 'description' => null, 'image' => null, 'jsonld' => null, 'noindex' => false, 'type' => 'website'])
@php
    use App\Models\Setting;
    $locale = app()->getLocale();
    $siteName = $locale !== 'en' ? Setting::get('site_name_' . $locale, Setting::get('site_name')) : Setting::get('site_name');
    $headerPages = \App\Models\Page::published()->where('in_header', true)->orderBy('menu_order')->limit(3)->get(['title', 'slug']);
    $footerPages = \App\Models\Page::published()->where('in_footer', true)->orderBy('menu_order')->get(['title', 'slug']);
    $ticker = Setting::get('ticker_enabled') ? \App\Models\Notice::live()->where('in_ticker', true)->latest('published_at')->limit(6)->get(['title', 'slug']) : collect();
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#14114a">
    <x-seo :title="$title" :description="$description" :image="$image" :jsonld="$jsonld" :noindex="$noindex" :type="$type" />
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @if ($gsv = \App\Models\Setting::get('google_site_verification'))<meta name="google-site-verification" content="{{ $gsv }}">@endif
    @if (($ga = \App\Models\Setting::get('analytics_id')) && app()->isProduction())
        <script async src="https://www.googletagmanager.com/gtag/js?id={{ $ga }}"></script>
        <script>window.dataLayer = window.dataLayer || []; function gtag(){dataLayer.push(arguments);} gtag('js', new Date()); gtag('config', @js($ga), { anonymize_ip: true });</script>
    @endif
</head>
<body class="flex min-h-screen flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">{{ __('Skip to content') }}</a>

    @if ($ticker->isNotEmpty())
        <div class="ticker no-print overflow-hidden text-sm text-white" style="background:linear-gradient(90deg,#14114a,#5b2a86 55%,#c8175d)" role="region" aria-label="{{ __('Latest notices') }}">
            <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 sm:px-6">
                <span class="shrink-0 rounded-full bg-marigold px-2.5 py-0.5 text-xs font-bold text-ink">{{ __('Latest') }}</span>
                <div class="relative min-w-0 flex-1 overflow-hidden">
                    <div class="ticker-track flex w-max gap-12 py-2">
                        @foreach ([1, 2] as $copy)
                            @foreach ($ticker as $n)
                                <a href="{{ route('notices.show', $n) }}" class="whitespace-nowrap text-white/90 no-underline hover:text-white hover:underline" @if ($copy === 2) aria-hidden="true" tabindex="-1" @endif>{{ $n->title }}</a>
                            @endforeach
                        @endforeach
                    </div>
                </div>
            </div>
        </div>
    @endif

    @if (config('portal.demo_logins'))
        <a href="{{ route('demo') }}" class="no-print block bg-gradient-to-r from-marigold via-[#ffd04d] to-marigold px-4 py-2 text-center text-sm font-semibold text-ink no-underline hover:text-ink">
            <x-icon name="info" class="mr-1 inline size-4 align-[-3px]" />{{ __('Testing mode: try every role — student, college, teacher, board and admin — with the demo logins') }} →
        </a>
    @endif
    <header class="no-print sticky top-0 z-30 border-b border-rule bg-white/95 shadow-[0_6px_20px_-16px_rgba(29,24,70,.5)] backdrop-blur" x-data="{ open: false }">
        <div class="zari" aria-hidden="true"></div>
        <div class="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6">
            <a href="{{ route('home') }}" class="flex min-w-0 shrink-0 items-center gap-3 text-ink no-underline xl:max-w-[13rem]">
                <x-logo class="size-10 shrink-0" />
                <span class="min-w-0">
                    <span class="block truncate font-display text-[1.15rem] font-bold leading-tight" style="font-stretch:110%">{{ $siteName }}</span>
                    <span class="block truncate text-xs text-ink-3">{{ Setting::get('division') }}</span>
                </span>
            </a>
            <nav class="ml-auto hidden items-center gap-1 whitespace-nowrap xl:flex" aria-label="{{ __('Main') }}">
                <a href="{{ route('home') }}" class="rounded-full px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 no-underline transition-colors hover:bg-board-soft hover:text-board aria-[current=page]:bg-rani-soft aria-[current=page]:text-rani" @if (request()->routeIs('home')) aria-current="page" @endif><x-icon name="house" class="mr-1 inline size-4 align-[-2px]" />{{ __('Home') }}</a>
                <a href="{{ route('notices.index') }}" class="rounded-full px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 no-underline transition-colors hover:bg-board-soft hover:text-board aria-[current=page]:bg-rani-soft aria-[current=page]:text-rani" @if (request()->routeIs('notices.*')) aria-current="page" @endif>{{ __('Notices') }}</a>
                <a href="{{ route('exams.calendar') }}" class="rounded-full px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 no-underline transition-colors hover:bg-board-soft hover:text-board aria-[current=page]:bg-rani-soft aria-[current=page]:text-rani" @if (request()->routeIs('exams.calendar')) aria-current="page" @endif>{{ __('Exams') }}</a>
                @foreach ($headerPages as $p)
                    <a href="{{ route('page.show', $p->slug) }}" class="rounded-full px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 no-underline transition-colors hover:bg-board-soft hover:text-board aria-[current=page]:bg-rani-soft aria-[current=page]:text-rani">{{ $p->title }}</a>
                @endforeach
                <a href="{{ route('verify.form') }}" class="rounded-full px-2.5 py-2 text-[0.95rem] font-medium text-ink-2 no-underline transition-colors hover:bg-board-soft hover:text-board aria-[current=page]:bg-rani-soft aria-[current=page]:text-rani">{{ __('Verify a form') }}</a>
            </nav>
            <x-lang-switch class="ml-auto hidden md:inline-flex xl:ml-0" />
            @auth
                <a href="{{ route(auth()->user()->homeRoute()) }}" class="btn-primary btn-sm hidden whitespace-nowrap sm:inline-flex">{{ __('My dashboard') }}</a>
            @else
                @if (config('portal.demo_logins'))<a href="{{ route('demo') }}" class="btn-gold btn-sm hidden whitespace-nowrap 2xl:inline-flex"><x-icon name="users" />{{ __('Demo logins') }}</a>@endif
                <a href="{{ route('login') }}" class="btn-primary btn-sm hidden whitespace-nowrap sm:inline-flex">{{ __('Student sign in') }}</a>
            @endauth
            <button type="button" class="btn-quiet btn-sm ml-auto xl:hidden" @click="open = !open" :aria-expanded="open" aria-controls="mobile-nav">
                <x-icon name="menu" /><span class="sr-only">{{ __('Menu') }}</span>
            </button>
        </div>
        <nav id="mobile-nav" class="border-t border-rule bg-sheet xl:hidden" x-show="open" x-collapse x-cloak aria-label="{{ __('Main') }}">
            <div class="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
                <a href="{{ route('home') }}" class="flex items-center gap-2 rounded-md px-3 py-3 font-medium text-ink no-underline"><x-icon name="house" class="size-4" />{{ __('Home') }}</a>
                <a href="{{ route('notices.index') }}" class="rounded-md px-3 py-3 font-medium text-ink no-underline">{{ __('Notices') }}</a>
                <a href="{{ route('exams.calendar') }}" class="rounded-md px-3 py-3 font-medium text-ink no-underline">{{ __('Exams') }}</a>
                @foreach ($headerPages as $p)
                    <a href="{{ route('page.show', $p->slug) }}" class="rounded-md px-3 py-3 font-medium text-ink no-underline">{{ $p->title }}</a>
                @endforeach
                <a href="{{ route('verify.form') }}" class="rounded-md px-3 py-3 font-medium text-ink no-underline">{{ __('Verify a form') }}</a>
                <div class="mt-3 flex flex-wrap items-center gap-3 border-t border-rule pt-4">
                    <x-lang-switch />
                    @auth
                        <a href="{{ route(auth()->user()->homeRoute()) }}" class="btn-primary btn-sm">{{ __('My dashboard') }}</a>
                    @else
                        @if (config('portal.demo_logins'))<a href="{{ route('demo') }}" class="btn-gold btn-sm"><x-icon name="users" />{{ __('Demo logins') }}</a>@endif
                        <a href="{{ route('login') }}" class="btn-primary btn-sm">{{ __('Student sign in') }}</a>
                    @endauth
                </div>
            </div>
        </nav>
    </header>

    <main id="main" class="flex-1">{{ $slot }}</main>

    <footer class="no-print text-white/80" style="background:linear-gradient(160deg,#14114a,#0a3f86 70%,#0f5f8a)">
        <div class="zari" aria-hidden="true"></div>
        <div class="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
                <div class="flex items-center gap-3 text-white"><x-logo tone="paper" class="size-10" /><span class="font-display text-lg font-bold" style="font-stretch:110%">{{ $siteName }}</span></div>
                <p class="mt-4 max-w-sm text-sm">{{ Setting::get('footer_note') }}</p>
            </div>
            <div>
                <h2 class="text-sm font-semibold text-white">{{ __('Information') }}</h2>
                <ul class="mt-3 space-y-2 text-sm">
                    <li><a class="text-white/80 no-underline hover:text-white" href="{{ route('home') }}">{{ __('Home') }}</a></li>
                    @if (config('portal.demo_logins'))
                        <li><a class="text-white/80 no-underline hover:text-white" href="{{ route('demo') }}">{{ __('Demo logins') }}</a></li>
                        @foreach (['super_admin' => __('Admin sign in'), 'board' => __('Board sign in'), 'institute' => __('College sign in'), 'teacher' => __('Teacher sign in')] as $r => $l)
                            <li><a class="text-white/80 no-underline hover:text-white" href="{{ route("staff.login.$r") }}">{{ $l }}</a></li>
                        @endforeach
                    @endif
                    <li><a class="text-white/80 no-underline hover:text-white" href="{{ route('notices.index') }}">{{ __('Notices') }}</a></li>
                    <li><a class="text-white/80 no-underline hover:text-white" href="{{ route('exams.calendar') }}">{{ __('Exam calendar') }}</a></li>
                    @foreach ($footerPages as $p)
                        <li><a class="text-white/80 no-underline hover:text-white" href="{{ route('page.show', $p->slug) }}">{{ $p->title }}</a></li>
                    @endforeach
                </ul>
            </div>
            <div>
                <h2 class="text-sm font-semibold text-white">{{ __('Help') }}</h2>
                <ul class="mt-3 space-y-2 text-sm">
                    @if ($email = Setting::get('helpline_email'))<li class="flex items-center gap-2"><x-icon name="mail" class="size-4" /><a class="text-white/80 no-underline hover:text-white" href="mailto:{{ $email }}">{{ $email }}</a></li>@endif
                    @if ($phone = Setting::get('helpline_phone'))<li class="flex items-center gap-2"><x-icon name="phone" class="size-4" /><a class="text-white/80 no-underline hover:text-white" href="tel:{{ preg_replace('/\s+/', '', $phone) }}">{{ $phone }}</a></li>@endif
                    @if ($hours = Setting::get('helpline_hours'))<li class="flex items-center gap-2"><x-icon name="clock" class="size-4" />{{ $hours }}</li>@endif
                </ul>
            </div>
        </div>
        <div class="border-t border-white/10">
            <div class="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 px-4 py-5 text-xs text-white/60 sm:px-6">
                <span>© {{ now()->year }} {{ $siteName }}</span>
                <a class="text-white/60 no-underline hover:text-white" href="{{ route('sitemap') }}">{{ __('Sitemap') }}</a>
            </div>
        </div>
    </footer>
</body>
</html>
