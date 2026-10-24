@props(['tone' => 'light'])
<div {{ $attributes->class(['inline-flex items-center rounded-full border p-0.5 text-sm',
    'border-rule bg-sheet' => $tone === 'light', 'border-white/30 bg-white/10' => $tone === 'dark']) }} role="group" aria-label="{{ __('Language') }}">
    @foreach (config('portal.locales') as $code => $label)
        <a href="{{ request()->fullUrlWithQuery(['lang' => $code]) }}" lang="{{ $code }}" hreflang="{{ $code }}"
           @class(['rounded-full px-2.5 py-1 font-semibold no-underline transition-colors',
                'bg-gradient-to-r from-rani to-plum text-white shadow-sm hover:text-white' => app()->getLocale() === $code,
                'text-ink-2 hover:text-ink' => app()->getLocale() !== $code && $tone === 'light',
                'text-white/80 hover:text-white' => app()->getLocale() !== $code && $tone === 'dark'])
           @if (app()->getLocale() === $code) aria-current="true" @endif>{{ $label }}</a>
    @endforeach
</div>
