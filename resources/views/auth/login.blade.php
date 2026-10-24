<x-layouts.public :title="__('Student sign in')" :description="__('Sign in with Google to fill and track your HSC or SSC exam form.')">
    <div class="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 md:items-center">
        <div>
            <h1 class="display-xl">{{ __('Sign in to fill your exam form') }}</h1>
            <p class="lede mt-4">{{ __('Use any Google account. You can add yourself, your child or other students to the same account.') }}</p>
            <ul class="mt-6 space-y-3 text-ink-2">
                <li class="flex gap-3"><x-icon name="circle-check" class="mt-1 size-5 shrink-0 text-leaf" />{{ __('Details are saved, so the next form takes minutes.') }}</li>
                <li class="flex gap-3"><x-icon name="circle-check" class="mt-1 size-5 shrink-0 text-leaf" />{{ __('See when your college verifies the form and when the board approves it.') }}</li>
                <li class="flex gap-3"><x-icon name="circle-check" class="mt-1 size-5 shrink-0 text-leaf" />{{ __('Print the form and fee receipt any time.') }}</li>
            </ul>
        </div>
        <div class="sheet sheet-pad">
            <x-flash />
            @error('google')<div class="alert-bad mb-5" role="alert"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" />{{ $message }}</div>@enderror
            <a href="{{ route('auth.google') }}" @class(['btn-secondary w-full text-base', 'pointer-events-none opacity-50' => ! $googleReady]) @if (! $googleReady) aria-disabled="true" @endif>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>
                {{ __('Continue with Google') }}
            </a>
            @unless ($googleReady)
                <p class="hint mt-3">{{ __('Google sign-in is not configured on this server yet.') }}</p>
            @endunless
            @if ($demo)
                <form method="POST" action="{{ route('auth.demo') }}" class="mt-4 border-t border-dashed border-rule pt-4">@csrf
                    <button class="btn-quiet w-full">{{ __('Use the demo student account (local testing only)') }}</button>
                </form>
            @endif
            <p class="muted mt-6 text-sm">{{ __('By continuing you agree to the') }} <a href="{{ route('page.show', 'terms') }}">{{ __('terms of use') }}</a> {{ __('and') }} <a href="{{ route('page.show', 'privacy') }}">{{ __('privacy policy') }}</a>.</p>
        </div>
    </div>
</x-layouts.public>
