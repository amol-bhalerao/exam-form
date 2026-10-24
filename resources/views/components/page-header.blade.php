@props(['title', 'subtitle' => null, 'back' => null])
<header {{ $attributes->class('mb-7 flex flex-wrap items-end justify-between gap-4') }}>
    <div class="min-w-0">
        @if ($back)
            <a href="{{ $back }}" class="mb-2 inline-flex items-center gap-1 text-sm font-semibold no-underline"><x-icon name="arrow-left" class="size-4" />{{ __('Back') }}</a>
        @endif
        <h1 class="display-lg">{{ $title }}</h1>
        <div class="page-band mt-3 mb-0" aria-hidden="true"></div>
        @if ($subtitle)<p class="lede mt-2">{{ $subtitle }}</p>@endif
    </div>
    @isset($actions)<div class="flex flex-wrap gap-2">{{ $actions }}</div>@endisset
</header>
