<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex, nofollow">
    <title>{{ $label }} · {{ __('Sign in') }}</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="peacock grid min-h-screen place-items-center px-4 py-10">
    <main class="w-full max-w-md">
        <div class="mb-6 flex items-center justify-between text-white">
            <a href="{{ route('home') }}" class="flex items-center gap-3 text-white no-underline"><x-logo tone="paper" class="size-10" /><span class="font-display text-lg font-bold" style="font-stretch:112%">{{ $label }}</span></a>
            <x-lang-switch tone="dark" />
        </div>
        <div class="sheet sheet-pad text-ink">
            <h1 class="display-lg">{{ __('Sign in') }}</h1>
            <p class="muted mt-1">{{ __('Use the username and password given by the board office.') }}</p>
            <div class="mt-6"><x-flash /></div>
            <form method="POST" class="space-y-5">
                @csrf
                <x-form.input name="username" :label="__('Username or email')" required autofocus autocomplete="username" />
                <div class="field" x-data="{ show: false }">
                    <label for="password" class="label">{{ __('Password') }}<span class="req" aria-hidden="true"> *</span></label>
                    <div class="relative">
                        <input id="password" name="password" :type="show ? 'text' : 'password'" type="password" class="input pr-20" required autocomplete="current-password">
                        <button type="button" class="btn-quiet btn-sm absolute right-1 top-1/2 -translate-y-1/2" @click="show = !show" x-text="show ? '{{ __('Hide') }}' : '{{ __('Show') }}'">{{ __('Show') }}</button>
                    </div>
                </div>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="remember" value="1" class="check"> {{ __('Keep me signed in on this computer') }}</label>
                <button class="btn-primary w-full"><x-icon name="lock" />{{ __('Sign in') }}</button>
            </form>
            <p class="muted mt-6 text-sm">{{ __('Forgot your password? Contact the board office to reset it.') }}</p>
            @include('partials.demo-login')
        </div>
    </main>
</body>
</html>
