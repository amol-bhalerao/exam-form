@php
    use App\Models\Setting;
    $locale = app()->getLocale();
    $tagline = Setting::get('tagline_' . $locale, Setting::get('tagline'));
    $steps = [
        __('Sign in with Google'),
        __('Add the student'),
        __('Fill the exam form'),
        __('Pay the exam fee'),
        __('College verifies, board approves'),
    ];
@endphp
<x-layouts.public :jsonld="[
    '@context' => 'https://schema.org',
    '@type' => 'WebSite',
    'name' => Setting::get('site_name'),
    'url' => url('/'),
    'inLanguage' => ['mr', 'hi', 'en'],
    'potentialAction' => ['@type' => 'SearchAction', 'target' => route('verify.form') . '?number={number}', 'query-input' => 'required name=number'],
]">
    {{-- Hero: peacock silk, with the answer sheet marked step by step --}}
    <section class="peacock relative overflow-hidden">
        <div class="hero-glow pointer-events-none absolute -right-24 -top-24 size-96 rounded-full bg-mor/40 blur-3xl" aria-hidden="true"></div>
        <div class="hero-glow-2 pointer-events-none absolute -bottom-32 left-1/4 size-[28rem] rounded-full bg-rani/30 blur-3xl" aria-hidden="true"></div>
        <div class="relative mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1.15fr_.85fr] lg:items-center">
            <div>
                <p class="mb-5 inline-flex items-center gap-2 rounded-full bg-white/12 px-3 py-1 text-sm font-semibold text-white ring-1 ring-white/25 backdrop-blur">
                    <span class="relative flex size-2.5"><span class="absolute inline-flex size-full animate-ping rounded-full bg-marigold opacity-75"></span><span class="relative inline-flex size-2.5 rounded-full bg-marigold"></span></span>
                    @if ($openExams->isNotEmpty())
                        {{ trans_choice(':count exam is accepting forms now|:count exams are accepting forms now', $openExams->count()) }}
                    @else
                        {{ __('HSC and SSC exam forms') }}
                    @endif
                </p>
                <h1 class="display-xl max-w-[16ch] text-white">{{ __('Your board exam form, right the first time.') }}</h1>
                <p class="mt-5 max-w-[60ch] text-lg text-white/85">{{ $tagline }}</p>
                <div class="mt-8 flex flex-wrap gap-3">
                    @auth
                        <a href="{{ route(auth()->user()->homeRoute()) }}" class="btn-gold">{{ __('Go to my dashboard') }}</a>
                    @else
                        <a href="{{ route('login') }}" class="btn-gold">
                            <svg viewBox="0 0 24 24" class="size-5" aria-hidden="true"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2L6.4 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10C7.2 7.7 9.4 5.9 12 5.9Z"/></svg>
                            {{ __('Sign in with Google to apply') }}
                        </a>
                    @endauth
                    <a href="{{ route('page.show', 'how-to-apply') }}" class="inline-flex min-h-11 items-center gap-2 rounded-md px-4 font-semibold text-white no-underline ring-1 ring-white/40 transition-colors hover:bg-white/10 hover:text-white">{{ __('How to apply') }}</a>
                </div>
                <p class="mt-4 text-sm text-white/70">{{ __('One account can add several students — parents and helpers can fill forms for others.') }}</p>
            </div>

            {{-- The answer sheet: seat number boxes ink in, then each step's bubble is marked --}}
            @php $marks = ['bg-board', 'bg-mor', 'bg-rani', 'bg-marigold', 'bg-leaf']; @endphp
            <div class="relative mx-auto w-full max-w-md" aria-hidden="true">
                <div class="hero-sheet overflow-hidden rounded-2xl bg-white text-ink shadow-[0_30px_60px_-25px_rgba(10,10,40,.7)]">
                    <div class="zari"></div>
                    <div class="p-6 sm:p-8">
                        <div class="flex items-start justify-between gap-4 border-b-2 border-ink pb-4">
                            <div>
                                <p class="font-display text-sm font-bold text-ink" style="font-stretch:115%">{{ __('Application No.') }}</p>
                                <p class="text-xs text-ink-3">{{ __('Fill in capital letters') }}</p>
                            </div>
                            <span class="rounded-md bg-rani px-2 py-0.5 text-xs font-bold text-white">{{ __('HSC / SSC') }}</span>
                        </div>
                        <div class="seat hero-seat mt-5">
                            @foreach (str_split('HSC2701') as $ch)<span>{{ $ch }}</span>@endforeach
                        </div>
                        <ol class="mt-7 space-y-3">
                            @foreach ($steps as $i => $s)
                                <li class="flex items-center gap-3 text-[0.95rem]">
                                    <span class="relative grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink/60">
                                        <span class="omr-mark absolute inset-[3px] rounded-full {{ $marks[$i] }}" style="animation-delay: {{ 1 + $i * .22 }}s"></span>
                                    </span>
                                    <span class="text-ink-2">{{ $s }}</span>
                                </li>
                            @endforeach
                        </ol>
                    </div>
                </div>
            </div>
        </div>
        <div class="zari relative" aria-hidden="true"></div>
    </section>

    {{-- Open exams --}}
    <div class="bg-gradient-to-b from-board-soft to-mor-soft/40 py-14">
    <section class="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="open-exams">
        <div class="section-head">
            <h2 id="open-exams" class="display-lg">{{ __('Accepting forms now') }}</h2>
            <a href="{{ route('exams.calendar') }}" class="font-semibold">{{ __('Full exam calendar') }}</a>
        </div>
        @forelse ($openExams as $exam)
            @php $days = (int) now()->startOfDay()->diffInDays($exam->closes_at->copy()->startOfDay(), false); $fromFee = $exam->fees->min('fee'); @endphp
            <article class="sheet mb-4 grid gap-4 p-5 sm:p-6 md:grid-cols-[7rem_1fr_auto] md:items-center">
                <p class="inline-grid w-fit place-items-center rounded-xl px-4 py-2 font-display text-2xl font-bold text-white {{ $exam->board->code === 'SSC' ? 'bg-gradient-to-br from-rani to-plum' : 'bg-gradient-to-br from-board to-mor' }}" style="font-stretch:118%">{{ $exam->board->short_name }}</p>
                <div>
                    <h3 class="title">{{ $exam->name }}</h3>
                    <p class="muted mt-1">
                        {{ $exam->stream?->label ?? __('All streams') }} ·
                        @if ($exam->inLateWindow()) {{ __('Late fee period until :date', ['date' => $exam->late_closes_at->translatedFormat('j M Y')]) }}
                        @else {{ __('Last date :date', ['date' => $exam->closes_at->translatedFormat('j M Y')]) }} @endif
                        @if ($fromFee) · {{ __('Fee from ₹:amount', ['amount' => number_format($fromFee)]) }} @endif
                    </p>
                </div>
                <div class="flex items-center gap-4 md:justify-end">
                    @if ($days >= 0 && ! $exam->inLateWindow())
                        <p class="text-right"><span class="block font-display text-3xl font-bold tabular-nums {{ $days <= 5 ? 'text-omr' : 'text-rani' }}">{{ $days }}</span><span class="text-sm text-ink-3">{{ trans_choice('day left|days left', $days) }}</span></p>
                    @endif
                    <a href="{{ route('login') }}" class="btn-primary btn-sm">{{ __('Apply now') }}</a>
                </div>
            </article>
        @empty
            <x-empty :title="__('No exam is accepting forms right now')" icon="calendar-days">
                {{ __('When the board opens the next exam, it will appear here with its last date and fee.') }}
            </x-empty>
        @endforelse
    </section>
    </div>

    {{-- Notice board + guides --}}
    <div class="border-y border-rule bg-white py-14">
    <section class="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-[1.4fr_1fr]">
        <div aria-labelledby="notices">
            <div class="section-head">
                <h2 id="notices" class="display-lg">{{ __('Notice board') }}</h2>
                <a href="{{ route('notices.index') }}" class="font-semibold">{{ __('All notices') }}</a>
            </div>
            @include('site.notices._list', ['notices' => $notices])
        </div>
        <aside aria-labelledby="guides">
            <h2 id="guides" class="display-lg mb-5">{{ __('Before you apply') }}</h2>
            <div class="space-y-3">
                @foreach ($guides as $g)
                    <a href="{{ route('page.show', $g->slug) }}" class="card-link group {{ ['tone-board', 'tone-rani', 'tone-leaf', 'tone-plum'][$loop->index % 4] }}">
                        <p class="title text-ink group-hover:text-board">{{ $g->title }}</p>
                        @if ($g->summary)<p class="muted mt-1 text-[0.95rem]">{{ $g->summary }}</p>@endif
                    </a>
                @endforeach
                <a href="{{ route('verify.form') }}" class="card-link group tone-marigold">
                    <p class="title text-ink group-hover:text-board">{{ __('Check a printed form') }}</p>
                    <p class="muted mt-1 text-[0.95rem]">{{ __('Scan the QR code or enter the application number to confirm a form is genuine.') }}</p>
                </a>
            </div>
        </aside>
    </section>
    </div>

    {{-- Process --}}
    <div class="bg-gradient-to-br from-rani-soft via-marigold-soft/70 to-plum-soft py-16">
    <section class="mx-auto max-w-7xl px-4 sm:px-6" aria-labelledby="process">
        <h2 id="process" class="display-lg max-w-[22ch]">{{ __('From sign-in to board approval') }}</h2>
        <ol class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            @foreach ([
                [__('Sign in with Google'), __('No passwords to remember. Parents can use their own account.')],
                [__('Add the student'), __('Board, college or school, stream and personal details — saved for every future form.')],
                [__('Fill the exam form'), __('Only the subjects your college offers are shown, and the rules are checked as you choose.')],
                [__('Pay the exam fee'), __('UPI, card or net banking. Your receipt stays in your account.')],
                [__('Verified and approved'), __('Your college checks and forwards the form; the board approves it. Track every step.')],
            ] as $i => [$h, $t])
                <li class="tile bg-white {{ ['tone-board', 'tone-mor', 'tone-rani', 'tone-marigold', 'tone-leaf'][$i] }} p-6">
                    <span class="tone-icon font-display text-lg font-bold">{{ $i + 1 }}</span>
                    <p class="title mt-4">{{ $h }}</p>
                    <p class="muted mt-2 text-[0.95rem]">{{ $t }}</p>
                </li>
            @endforeach
        </ol>
    </section>
    </div>

    {{-- Boards --}}
    <section class="mx-auto max-w-7xl px-4 py-16 sm:px-6">
        <div class="peacock grid gap-6 overflow-hidden rounded-2xl p-8 sm:p-10 md:grid-cols-2">
            @foreach ($boards as $b)
                <div>
                    <p class="text-zari font-display text-5xl font-bold" style="font-stretch:120%">{{ $b->short_name }}</p>
                    <p class="mt-2 text-lg">{{ $b->label }}</p>
                    <p class="mt-1 text-white/70">{{ trans_choice(':count college or school listed|:count colleges and schools listed', $b->institutes_count, ['count' => number_format($b->institutes_count)]) }}</p>
                </div>
            @endforeach
        </div>
    </section>
</x-layouts.public>
