<x-layouts.portal :title="__('Exam boards')">
    <x-page-header :title="__('Exam boards')" :subtitle="__('Each exam board (for example HSC or SSC) has its own streams, subjects, colleges, exams and form numbers. Add another board to run its exam forms on this portal.')">
        <x-slot:actions><a href="{{ route('admin.boards.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('Add exam board') }}</a></x-slot:actions>
    </x-page-header>
    <div class="grid gap-4 md:grid-cols-2">
        @foreach ($boards as $b)
            <article class="feature {{ ['tone-board', 'tone-rani', 'tone-mor', 'tone-marigold', 'tone-plum'][$loop->index % 5] }}">
                <div class="flex items-start gap-4">
                    <span class="tone-icon size-12 shrink-0 rounded-xl font-display text-lg font-bold">{{ mb_substr($b->short_name, 0, 3) }}</span>
                    <div class="min-w-0 flex-1"><h2 class="title">{{ $b->short_name }} <span class="kbd-code align-middle">{{ $b->code }}</span></h2><p class="text-sm text-ink-2">{{ $b->name }}</p><p class="text-sm muted">{{ $b->name_mr }}</p></div>
                    <a href="{{ route('admin.boards.edit', $b) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a>
                </div>
                <dl class="mt-2 grid grid-cols-4 gap-2 text-center text-sm">
                    <a href="{{ route('admin.institutes.index', ['board' => $b->id]) }}" class="rounded-lg bg-sheet p-2 no-underline text-ink"><dt class="text-xs muted">{{ __('Colleges') }}</dt><dd class="font-bold">{{ number_format($b->institutes_count) }}</dd></a>
                    <a href="{{ route('admin.streams.index') }}" class="rounded-lg bg-sheet p-2 no-underline text-ink"><dt class="text-xs muted">{{ __('Streams') }}</dt><dd class="font-bold">{{ $b->has_streams ? $b->streams_count : '—' }}</dd></a>
                    <a href="{{ route('admin.subjects.index', ['board' => $b->id]) }}" class="rounded-lg bg-sheet p-2 no-underline text-ink"><dt class="text-xs muted">{{ __('Subjects') }}</dt><dd class="font-bold">{{ $b->subjects_count }}</dd></a>
                    <div class="rounded-lg bg-sheet p-2"><dt class="text-xs muted">{{ __('Exams') }}</dt><dd class="font-bold">{{ $b->exams_count }}</dd></div>
                </dl>
            </article>
        @endforeach
    </div>
    <section class="sheet sheet-pad mt-6">
        <h2 class="title mb-3">{{ __('Setting up a new board') }}</h2>
        <ol class="grid gap-2 text-ink-2">
            <li>1. {{ __('Add the exam board here (code, names, whether it has streams).') }}</li>
            <li>2. {{ __('Streams: add its streams (Science, Arts …), if it has them.') }}</li>
            <li>3. {{ __('Subjects: add its subjects with codes.') }}</li>
            <li>4. {{ __('Institutes: add or import its colleges / schools and choose their division.') }}</li>
            <li>5. {{ __('Users and logins: create a Board login for its office, and logins for colleges.') }}</li>
            <li>6. {{ __('The board office then creates the exam with dates and fees, and students can apply.') }}</li>
        </ol>
    </section>
</x-layouts.portal>
