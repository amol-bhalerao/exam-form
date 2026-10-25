<x-layouts.portal :title="__('Teacher overview')">
    <x-page-header :title="__('Namaskar, :name', ['name' => \Illuminate\Support\Str::before(auth()->user()->name, ' ') ?: auth()->user()->name])" :subtitle="__('Build the question bank, schedule unit tests, review what students share and see who is practising daily.')">
        <x-slot:actions>
            <a href="{{ route('teacher.questions.create') }}" class="btn-secondary"><x-icon name="plus" />{{ __('Add question') }}</a>
            <a href="{{ route('teacher.quizzes.create') }}" class="btn-primary"><x-icon name="timer" />{{ __('Schedule a test') }}</a>
        </x-slot:actions>
    </x-page-header>

    <div class="mb-7 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <x-stat :label="__('Students practising today')" :value="$activeToday" tone="leaf" :hint="__(':n practice sets today', ['n' => $setsToday])" :href="route('teacher.progress.index')" />
        <x-stat :label="__('Active this week')" :value="$activeWeek" tone="board" :hint="__('of :n students', ['n' => $students])" :href="route('teacher.progress.index')" />
        <x-stat :label="__('Waiting for your review')" :value="$pending" tone="marigold" :href="route('teacher.reviews.index')" />
        <x-stat :label="__('Questions in the bank')" :value="$bank" tone="plum" :hint="__(':n added by you', ['n' => $myQuestions])" :href="route('teacher.questions.index')" />
    </div>

    <div class="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section class="sheet overflow-hidden">
            <div class="zari-thin" aria-hidden="true"></div>
            <div class="flex items-center justify-between gap-3 p-5 pb-3">
                <h2 class="title">{{ __('Upcoming and live tests') }}</h2>
                <a href="{{ route('teacher.quizzes.index') }}" class="text-sm font-semibold">{{ __('All tests') }} →</a>
            </div>
            @forelse ($tests as $t)
                <a href="{{ route('teacher.quizzes.show', $t) }}" class="flex items-center gap-4 border-t border-rule px-5 py-3 no-underline text-ink hover:bg-wash/60">
                    <span class="grid size-11 shrink-0 place-items-center rounded-lg bg-board-soft text-center leading-none text-board-deep"><span><b class="block text-lg">{{ $t->starts_at->format('d') }}</b><span class="text-[0.65rem] uppercase">{{ $t->starts_at->format('M') }}</span></span></span>
                    <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $t->title }}</p><p class="truncate text-sm muted">{{ $t->subject->label }} · {{ $t->starts_at->format('h:i A') }} – {{ $t->ends_at->format('d M h:i A') }}</p></div>
                    @if ($t->state() === 'live')<span class="badge-ok">{{ __('Live') }}</span>@else<span class="badge-info">{{ __('Upcoming') }}</span>@endif
                    <span class="text-sm muted tabular-nums">{{ trans_choice(':count taken|:count taken', $t->attempts_count, ['count' => $t->attempts_count]) }}</span>
                </a>
            @empty
                <div class="px-5 pb-6"><x-empty :title="__('No test scheduled')" icon="timer">{{ __('Schedule a unit test: choose topics, number of questions, timing and marks. Students see it on their study page.') }}</x-empty></div>
            @endforelse
        </section>

        <section class="sheet overflow-hidden">
            <div class="zari-thin" aria-hidden="true"></div>
            <div class="flex items-center justify-between gap-3 p-5 pb-3">
                <h2 class="title">{{ __('Latest practice by your students') }}</h2>
                <a href="{{ route('teacher.progress.index') }}" class="text-sm font-semibold">{{ __('Progress') }} →</a>
            </div>
            @forelse ($recent as $a)
                <a href="{{ route('teacher.progress.show', $a->student) }}" class="flex items-center gap-3 border-t border-rule px-5 py-3 no-underline text-ink hover:bg-wash/60">
                    <span class="tone-icon {{ $a->mode === 'test' ? 'tone-rani' : 'tone-mor' }} size-9 rounded-lg"><x-icon :name="$a->mode === 'test' ? 'timer' : 'brain'" class="size-5" /></span>
                    <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $a->student->full_name }}</p><p class="truncate text-sm muted">{{ $a->quiz?->title ?? $a->subject->label }} · {{ $a->submitted_at?->diffForHumans() }}</p></div>
                    <span @class(['font-bold tabular-nums', 'text-leaf' => $a->percent() >= 60, 'text-gold-deep' => $a->percent() < 60 && $a->percent() >= 35, 'text-omr' => $a->percent() < 35])>{{ $a->percent() }}%</span>
                </a>
            @empty
                <p class="px-5 pb-6 muted">{{ __('When your students practise, their latest sets appear here.') }}</p>
            @endforelse
        </section>
    </div>

    <section class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        @foreach ([
            ['teacher.questions.create', 'circle-help', 'tone-board', __('Add questions'), __('Single, multiple-answer, true/false and fill-in-the-blank, with a memory tip.')],
            ['teacher.materials.create', 'book-marked', 'tone-mor', __('Share study material'), __('Notes, PDFs and links for each topic.')],
            ['teacher.reviews.index', 'square-check-big', 'tone-marigold', __('Review submissions'), __('Approve students\' questions, notes and memory tips.')],
            ['teacher.quizzes.index', 'award', 'tone-rani', __('Certificates'), __('Pick a template and print certificates after a test.')],
        ] as [$r, $i, $tone, $t, $d])
            <a href="{{ route($r) }}" class="feature {{ $tone }}"><span class="tone-icon size-10 rounded-lg"><x-icon :name="$i" class="size-5" /></span><p class="title">{{ $t }}</p><p class="text-sm muted">{{ $d }}</p></a>
        @endforeach
    </section>
</x-layouts.portal>
