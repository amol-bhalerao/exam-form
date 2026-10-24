@props(['title' => null])
@php
    $user = auth()->user();
    $menus = [
        'super_admin' => [
            [null, [['admin.dashboard', 'house', __('Overview')]]],
            [__('Records'), [
                ['admin.institutes.index', 'school', __('Institutes')],
                ['admin.users.index', 'users', __('Users and logins')],
                ['admin.subjects.index', 'book-open', __('Subjects')],
                ['admin.streams.index', 'list', __('Streams')],
                ['admin.payments.index', 'indian-rupee', __('Payments')],
            ]],
            [__('Website'), [
                ['admin.pages.index', 'layout-template', __('Pages')],
                ['admin.notices.index', 'megaphone', __('Notices')],
                ['admin.media.index', 'image', __('Media library')],
                ['admin.settings.edit', 'settings', __('Site settings')],
            ]],
            [__('Security'), [['admin.audit.index', 'history', __('Activity log')]]],
        ],
        'board' => [
            [null, [['board.dashboard', 'chart-column', __('Dashboard')]]],
            [__('Examination'), [
                ['board.exams.index', 'calendar-days', __('Exams and fees')],
                ['board.forms.index', 'file-check', __('Exam forms')],
                ['board.examiners.index', 'badge-check', __('Teachers and examiners')],
                ['board.institutes.index', 'school', __('Institutes')],
            ]],
            [__('Communication'), [['board.notices.index', 'megaphone', __('Notices')]]],
        ],
        'institute' => [
            [null, [['institute.dashboard', 'house', __('Overview')]]],
            [__('Exam forms'), [['institute.forms.index', 'file-check', __('Exam forms')]]],
            [__('College'), [
                ['institute.teachers.index', 'users', __('Teachers and examiners')],
                ['institute.subjects.index', 'book-open', __('Subjects offered')],
                ['institute.profile.edit', 'building-2', __('College details')],
            ]],
        ],
        'student' => [
            [null, [['student.dashboard', 'house', __('My students and forms')]]],
        ],
    ][$user->role] ?? [];
    $roleLabel = __(\App\Models\User::ROLES[$user->role] ?? $user->role);
    $context = $user->institute?->name ?? $user->board?->short_name ?? null;
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#14114a">
    <title>{{ $title ? $title . ' · ' : '' }}{{ \App\Models\Setting::get('site_name', config('app.name')) }}</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('head')
</head>
<body x-data="{ nav: false }" class="min-h-screen">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded focus:bg-sheet focus:px-3 focus:py-2">{{ __('Skip to content') }}</a>
    <div class="lg:grid lg:min-h-screen lg:grid-cols-[17rem_1fr]">
        {{-- Sidebar --}}
        <div class="no-print fixed inset-0 z-40 bg-ink/50 backdrop-blur-sm lg:hidden" x-show="nav" x-transition.opacity x-cloak @click="nav = false"></div>
        <aside class="sidebar no-print fixed inset-y-0 left-0 z-50 flex w-72 -translate-x-full flex-col text-white shadow-2xl transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:w-auto lg:translate-x-0 lg:shadow-none"
               :class="nav && 'translate-x-0'" aria-label="{{ __('Portal navigation') }}">
            <div class="zari" aria-hidden="true"></div>
            <div class="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <x-logo tone="paper" class="size-9 shrink-0" />
                <div class="min-w-0">
                    <p class="truncate font-display font-bold leading-tight text-white" style="font-stretch:110%">{{ $roleLabel }}</p>
                    @if ($context)<p class="truncate text-xs text-white/70" title="{{ $context }}">{{ $context }}</p>@endif
                </div>
                <button type="button" class="ml-auto grid size-9 place-items-center rounded-md text-white hover:bg-white/10 lg:hidden" @click="nav = false"><x-icon name="x" class="size-5" /><span class="sr-only">{{ __('Close menu') }}</span></button>
            </div>
            <nav class="flex-1 overflow-y-auto px-3 py-4">
                @foreach ($menus as [$group, $items])
                    @if ($group)<p class="nav-group">{{ $group }}</p>@endif
                    @foreach ($items as [$route, $icon, $label])
                        @php $active = request()->routeIs($route) || request()->routeIs(\Illuminate\Support\Str::beforeLast($route, '.') . '.*') && ! str_ends_with($route, 'dashboard'); @endphp
                        <a href="{{ route($route) }}" class="nav-link" @if ($active) aria-current="page" @endif><x-icon :name="$icon" />{{ $label }}</a>
                    @endforeach
                @endforeach
            </nav>
            <div class="border-t border-white/10 px-3 py-3">
                <a href="{{ route('home') }}" class="nav-link" target="_blank" rel="noopener"><x-icon name="globe" />{{ __('Public website') }}</a>
                @if ($user->role !== 'student')
                    <a href="{{ route('password.edit') }}" class="nav-link"><x-icon name="key-round" />{{ __('Change password') }}</a>
                @endif
            </div>
        </aside>

        <div class="min-w-0">
            <header class="no-print sticky top-0 z-30 border-b border-rule bg-white/95 shadow-[0_6px_20px_-16px_rgba(29,24,70,.5)] backdrop-blur">
              <div class="zari-thin lg:hidden" aria-hidden="true"></div>
              <div class="flex items-center gap-3 px-4 py-3 sm:px-6">
                <button type="button" class="btn-quiet btn-sm lg:hidden" @click="nav = true" :aria-expanded="nav"><x-icon name="menu" /><span class="sr-only">{{ __('Open menu') }}</span></button>
                <p class="min-w-0 truncate font-semibold text-ink-2">{{ $title }}</p>
                <div class="ml-auto flex items-center gap-3">
                    <x-lang-switch class="hidden sm:inline-flex" />
                    <div class="hidden items-center gap-2 md:flex">
                        @if ($user->avatar)
                            <img src="{{ $user->avatar }}" alt="" class="size-8 rounded-full" referrerpolicy="no-referrer">
                        @else
                            <span class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-rani to-plum text-xs font-bold text-white">{{ $user->initials() }}</span>
                        @endif
                        <span class="max-w-40 truncate text-sm font-semibold">{{ $user->name }}</span>
                    </div>
                    <form method="POST" action="{{ route('logout') }}">@csrf
                        <button class="btn-secondary btn-sm"><x-icon name="log-out" /><span class="hidden sm:inline">{{ __('Sign out') }}</span></button>
                    </form>
                </div>
              </div>
            </header>
            <main id="main" class="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
                @if ($user->role === 'student' && ($banner = \App\Models\Setting::get('maintenance_message')))
                    <div class="alert-info mb-5" role="status"><x-icon name="info" class="mt-0.5 size-5 shrink-0" /><p>{{ $banner }}</p></div>
                @endif
                <x-flash />
                {{ $slot }}
            </main>
        </div>
    </div>
    @stack('scripts')
</body>
</html>
