{{-- Stand-alone error page: no database calls, so it still works when the database is down. --}}
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex">
    <title>{{ $code }} · {{ config('app.name') }}</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @if (is_file(public_path('build/manifest.json')))@vite(['resources/css/app.css'])@endif
</head>
<body class="grid min-h-screen place-items-center bg-wash px-4">
    <main class="sheet sheet-pad rise w-full max-w-lg text-center">
        <x-logo class="mx-auto size-12" />
        <p class="mt-6 font-display text-6xl font-bold tabular-nums text-board" aria-hidden="true">{{ $code }}</p>
        <h1 class="title mt-3">{{ $heading }}</h1>
        <p class="lede mx-auto mt-2">{{ $text }}</p>
        <div class="mt-7 flex flex-wrap justify-center gap-3">
            @isset($action){{ $action }}@endisset
            <a href="{{ url('/') }}" class="btn-primary">{{ __('Go to home page') }}</a>
        </div>
    </main>
</body>
</html>
