@props(['title', 'lede' => null, 'width' => 'max-w-5xl'])
{{-- Coloured title band for public pages (peacock silk with the woven zari edge). --}}
<section class="peacock relative overflow-hidden">
    <div class="hero-glow pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-mor/40 blur-3xl" aria-hidden="true"></div>
    <div class="relative mx-auto {{ $width }} px-4 py-10 sm:px-6 sm:py-14">
        {{ $before ?? '' }}
        <h1 class="display-xl text-white">{{ $title }}</h1>
        @if ($lede)<p class="mt-3 max-w-[62ch] text-lg text-white/85">{{ $lede }}</p>@endif
        {{ $slot }}
    </div>
    <div class="zari relative" aria-hidden="true"></div>
</section>
