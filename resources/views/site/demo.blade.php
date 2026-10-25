@php
    $info = [
        'super_admin' => ['shield', 'tone-plum', __('Super admin'), __('Manages the whole website: institutes, users, subjects, pages, notices, payments and settings.')],
        'board' => ['building-2', 'tone-board', __('Board office'), __('Creates exams and fees, approves exam forms sent by colleges and reviews examiners.')],
        'institute' => ['school', 'tone-mor', __('College / school'), __('Verifies students’ exam forms, manages teachers and creates teacher logins.')],
        'teacher' => ['graduation-cap', 'tone-rani', __('Teacher'), __('Adds questions and study material, schedules tests, prints certificates and sees student progress.')],
    ];
@endphp
<x-layouts.public :title="__('Demo logins')" :noindex="true">
    <x-page-hero :title="__('Try every role with demo logins')" :lede="__('This website is in testing mode. Use these shared demo accounts to explore each portal. Please do not enter real personal data.')" />
    <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        @auth
            <form method="POST" action="{{ route('logout') }}" class="alert-info mb-6 flex-wrap items-center">@csrf<input type="hidden" name="next" value="demo">
                <x-icon name="info" class="size-5 shrink-0" /><p class="flex-1">{{ __('You are signed in as :name. Sign out to try another role.', ['name' => auth()->user()->name]) }}</p>
                <button class="btn-secondary btn-sm"><x-icon name="log-out" />{{ __('Sign out') }}</button>
            </form>
        @endauth
        <div class="grid gap-5 md:grid-cols-2">
            <article class="feature tone-marigold md:col-span-2">
                <div class="flex flex-wrap items-center gap-4">
                    <span class="tone-icon size-12 rounded-xl"><x-icon name="user" class="size-6" /></span>
                    <div class="min-w-0 flex-1">
                        <h2 class="title">{{ __('Student / parent') }}</h2>
                        <p class="text-sm text-ink-2">{{ __('Fill an exam form, pay (test mode), practise questions, take the demo test and see the AI study plan. Students normally sign in with Google; the demo needs no password.') }}</p>
                    </div>
                    <form method="POST" action="{{ route('auth.demo') }}">@csrf<button class="btn-gold"><x-icon name="arrow-right" />{{ __('Sign in as demo student') }}</button></form>
                </div>
            </article>
            @foreach ($cards as $role => $c)
                @php [$icon, $tone, $label, $text] = $info[$role]; @endphp
                <article class="feature {{ $tone }}">
                    <div class="flex items-start gap-4">
                        <span class="tone-icon size-12 shrink-0 rounded-xl"><x-icon :name="$icon" class="size-6" /></span>
                        <div class="min-w-0 flex-1">
                            <h2 class="title">{{ $label }}</h2>
                            <p class="text-sm text-ink-2">{{ $text }}</p>
                        </div>
                    </div>
                    <dl class="mt-3 grid grid-cols-2 gap-3 rounded-lg border border-rule bg-sheet p-3 text-sm">
                        <div><dt class="text-xs font-semibold uppercase tracking-wide text-ink-3">{{ __('Username') }}</dt><dd class="font-mono text-base font-bold text-ink">{{ $c['username'] }}</dd></div>
                        <div><dt class="text-xs font-semibold uppercase tracking-wide text-ink-3">{{ __('Password') }}</dt><dd class="font-mono text-base font-bold text-ink">{{ $c['password'] }}</dd></div>
                        <div class="col-span-2"><dt class="text-xs font-semibold uppercase tracking-wide text-ink-3">{{ __('Sign-in address') }}</dt><dd class="break-all font-mono text-ink-2">{{ $c['url'] }}</dd></div>
                    </dl>
                    <a href="{{ $c['url'] }}?demo=1" class="btn-primary mt-2 self-start"><x-icon name="lock" />{{ __('Sign in as :role', ['role' => $label]) }}</a>
                </article>
            @endforeach
        </div>
        @if ($college)
            <p class="mt-6 text-sm text-ink-2"><x-icon name="info" class="inline size-4 text-board" /> {{ __('The demo college and teacher belong to :college. The demo student is enrolled there, so forms, tests and progress connect across roles.', ['college' => $college->display_name ?? $college->name]) }}</p>
        @endif
    </div>
</x-layouts.public>
