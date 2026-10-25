<x-layouts.portal :title="__('Study home')">
    <section class="peacock rise relative mb-7 overflow-hidden rounded-2xl p-6 text-white sm:p-8">
        <div class="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
                <p class="text-sm font-semibold uppercase tracking-[.18em] text-marigold">{{ __('Study zone') }}</p>
                <h1 class="display-lg mt-1 text-white">{{ __('Hello, :name!', ['name' => $student->first_name ?: $student->full_name]) }}</h1>
                <p class="mt-2 max-w-xl text-white/85">{{ $today ? trans_choice('You practised :count set today. One more?|You practised :count sets today. Keep the streak going!', $today, ['count' => $today]) : __('A short practice every day beats a long one once a week. Start today’s set!') }}</p>
                <div class="mt-5 flex flex-wrap gap-2">
                    <a href="{{ route('learn.practice.create') }}" class="btn-gold"><x-icon name="brain" />{{ __('Start practice') }}</a>
                    <form method="POST" action="{{ route('learn.practice.weak') }}">@csrf<button class="btn-secondary !border-white/40 !bg-white/10 !text-white"><x-icon name="target" />{{ __('Practise weak topics') }}</button></form>
                </div>
            </div>
            <div class="flex items-center gap-4 rounded-xl bg-white/10 p-4 backdrop-blur">
                <span class="grid size-14 place-items-center rounded-full bg-gradient-to-br from-marigold to-rani text-white shadow-lg"><x-icon name="flame" class="size-7" /></span>
                <div><p class="font-display text-4xl font-bold tabular-nums leading-none" style="font-stretch:112%">{{ $streak }}</p><p class="text-sm text-white/80">{{ trans_choice('day streak|days streak', $streak) }}</p></div>
            </div>
        </div>
    </section>

    <div class="mb-6 flex flex-wrap items-center justify-between gap-3">@include('learn._learner')</div>

    @foreach ($live as $a)
        <a href="{{ route('learn.attempts.show', $a) }}" class="alert-warn mb-4 no-underline"><x-icon name="clock" class="mt-0.5 size-5 shrink-0" /><p><b>{{ __('Unfinished:') }}</b> {{ $a->quiz?->title ?? __('Practice') . ' · ' . $a->subject->label }} — {{ __('continue') }} →</p></a>
    @endforeach

    <div class="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <x-stat :label="__('Practice sets (30 days)')" :value="$sets" tone="board" />
        <x-stat :label="__('Accuracy')" :value="$accuracy !== null ? $accuracy . '%' : '—'" tone="leaf" />
        <x-stat :label="__('Day streak')" :value="$streak" tone="marigold" />
        <x-stat :label="__('Tests for you')" :value="$tests->filter(fn ($t) => in_array($t->state(), ['live', 'upcoming']) && ! $t->my_attempt)->count()" tone="rani" :href="route('learn.tests.index')" />
    </div>

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section>
            <h2 class="title mb-3">{{ __('Pick a subject') }}</h2>
            @php $tones = ['tone-board', 'tone-rani', 'tone-mor', 'tone-marigold', 'tone-plum', 'tone-leaf']; @endphp
            <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                @forelse ($subjects->where('questions_count', '>', 0) as $s)
                    <a href="{{ route('learn.practice.create', ['subject' => $s->id]) }}" class="feature {{ $tones[$loop->index % 6] }}">
                        <div class="flex items-center gap-3"><span class="tone-icon size-10 rounded-lg font-bold">{{ mb_substr($s->label, 0, 1) }}</span><div class="min-w-0"><p class="truncate font-semibold">{{ $s->label }}</p><p class="text-xs muted">{{ $s->code }} · {{ trans_choice(':count question|:count questions', $s->questions_count, ['count' => $s->questions_count]) }}</p></div></div>
                    </a>
                @empty
                    <x-empty class="sm:col-span-3" :title="__('Questions are being added')" icon="circle-help">{{ __('Your teachers are adding questions. Check back soon.') }}</x-empty>
                @endforelse
            </div>
        </section>

        <aside class="grid content-start gap-6">
            <section class="sheet p-5">
                <h2 class="title mb-3">{{ __('Last 4 weeks') }}</h2>
                <div class="heat" style="--cols: 7" role="img" aria-label="{{ __('Practice activity calendar') }}">
                    @foreach ($days as $d)
                        @php $n = $perDay[$d->format('Y-m-d')] ?? 0; @endphp
                        <span data-n="{{ min(3, $n) }}" @if ($d->isToday()) data-today @endif><span class="tip">{{ $d->format('d M') }}: {{ $n }}</span></span>
                    @endforeach
                </div>
                <p class="mt-3 text-xs muted">{{ __('Each square is a day. Greener means more practice.') }}</p>
            </section>
            <section class="sheet p-5">
                <div class="mb-3 flex items-center justify-between"><h2 class="title">{{ __('Tests') }}</h2><a href="{{ route('learn.tests.index') }}" class="text-sm font-semibold">{{ __('All') }} →</a></div>
                @forelse ($tests->filter(fn ($t) => $t->state() !== 'ended')->take(4) as $t)
                    <a href="{{ route('learn.tests.show', $t) }}" class="flex items-center gap-3 border-t border-rule py-2.5 no-underline text-ink first:border-0">
                        <span class="tone-icon tone-rani size-9 rounded-lg"><x-icon name="timer" class="size-5" /></span>
                        <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $t->title }}</p><p class="truncate text-xs muted">{{ $t->subject->label }} · {{ $t->starts_at->format('d M h:i A') }}</p></div>
                        @if ($t->my_attempt)<span class="badge-ok">{{ __('Done') }}</span>@elseif ($t->state() === 'live')<span class="badge-rani">{{ __('Open') }}</span>@endif
                    </a>
                @empty
                    <p class="text-sm muted">{{ __('No upcoming tests from your teachers.') }}</p>
                @endforelse
            </section>
            <section class="sheet p-5">
                <h2 class="title mb-3">{{ __('Recent results') }}</h2>
                @forelse ($recent as $a)
                    <a href="{{ route('learn.attempts.result', $a) }}" class="flex items-center gap-3 border-t border-rule py-2.5 no-underline text-ink first:border-0">
                        <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $a->quiz?->title ?? $a->subject->label }}</p><p class="text-xs muted">{{ $a->created_at->diffForHumans() }}</p></div>
                        <span @class(['font-bold tabular-nums', 'text-leaf' => $a->percent() >= 60, 'text-marigold' => $a->percent() < 60 && $a->percent() >= 35, 'text-omr' => $a->percent() < 35])>{{ $a->percent() }}%</span>
                    </a>
                @empty
                    <p class="text-sm muted">{{ __('Your results will appear here.') }}</p>
                @endforelse
            </section>
        </aside>
    </div>
</x-layouts.portal>
