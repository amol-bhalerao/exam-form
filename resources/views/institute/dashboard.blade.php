<x-layouts.portal :title="__('Overview')">
    <x-page-header :title="$institute->name" :subtitle="__('Index no. :no · UDISE :udise · :board', ['no' => $institute->college_no, 'udise' => $institute->udise_no ?: '—', 'board' => $institute->board->short_name])">
        <x-slot:actions>
            <a href="{{ route('institute.forms.index', ['status' => 'submitted']) }}" class="btn-primary"><x-icon name="file-check" />{{ __('Verify forms') }}</a>
        </x-slot:actions>
    </x-page-header>

    @if ($streamsWithoutSubjects->isNotEmpty())
        <div class="alert-warn mb-6 rise"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" />
            <div><p class="font-semibold">{{ __('Subjects not listed for: :streams', ['streams' => $streamsWithoutSubjects->map->label->implode(', ')]) }}</p>
            <p>{{ __('Students of these streams currently see every subject. List the subjects your college teaches so they can only choose those.') }}</p>
            <a href="{{ route('institute.subjects.index') }}" class="mt-1 inline-block font-semibold">{{ __('List subjects') }} →</a></div></div>
    @endif

    <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <x-stat :label="__('Waiting for your verification')" :value="$counts['submitted'] + $counts['board_returned']" tone="marigold" :href="route('institute.forms.index', ['status' => 'submitted'])" />
        <x-stat :label="__('Forwarded to board')" :value="$counts['verified']" tone="board" :href="route('institute.forms.index', ['status' => 'verified'])" />
        <x-stat :label="__('Approved by board')" :value="$counts['approved']" tone="leaf" :href="route('institute.forms.index', ['status' => 'approved'])" />
        <x-stat :label="__('Fees collected')" :value="'₹' . number_format($feesCollected)" tone="ink" />
    </div>

    <div class="mt-8 grid gap-6 lg:grid-cols-[1fr_22rem]">
        <section class="sheet">
            <div class="flex items-center justify-between gap-3 border-b border-rule px-5 py-4">
                <h2 class="title">{{ __('Oldest forms waiting') }}</h2>
                <a href="{{ route('institute.forms.index', ['status' => 'submitted']) }}" class="text-sm font-semibold">{{ __('See all') }}</a>
            </div>
            @forelse ($waiting as $a)
                <a href="{{ route('institute.forms.show', $a) }}" class="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3 text-ink no-underline last:border-b-0 hover:bg-board-soft/40">
                    <div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $a->student->full_name }}</p><p class="text-sm muted tabular-nums">{{ $a->application_no }} · {{ $a->exam->name }}</p></div>
                    <span class="text-sm muted">{{ $a->submitted_at?->diffForHumans() }}</span>
                    <x-status :application="$a" />
                </a>
            @empty
                <div class="p-6"><x-empty :title="__('Nothing waiting')" icon="circle-check">{{ __('All paid forms have been checked.') }}</x-empty></div>
            @endforelse
        </section>

        <div class="grid gap-6 self-start">
            <section class="sheet sheet-pad">
                <h2 class="title mb-4">{{ __('Teachers and examiners') }}</h2>
                <dl class="grid grid-cols-2 gap-4">
                    <div class="stat"><dt>{{ __('Teachers') }}</dt><dd>{{ $teacherStats['total'] }}</dd></div>
                    <div class="stat border-board"><dt>{{ __('Examiners') }}</dt><dd>{{ $teacherStats['examiners'] }}</dd></div>
                    <div class="stat border-leaf"><dt>{{ __('Approved by board') }}</dt><dd>{{ $teacherStats['approved'] }}</dd></div>
                    <div class="stat border-marigold"><dt>{{ __('Pending review') }}</dt><dd>{{ $teacherStats['pending'] }}</dd></div>
                </dl>
                <a href="{{ route('institute.teachers.create') }}" class="btn-secondary mt-5 w-full"><x-icon name="user-plus" />{{ __('Add a teacher') }}</a>
            </section>
            <section class="sheet sheet-pad">
                <h2 class="title mb-3">{{ __('Open exams') }}</h2>
                @forelse ($openExams as $exam)
                    <div class="border-b border-rule py-3 last:border-b-0">
                        <p class="font-semibold">{{ $exam->name }}</p>
                        <p class="text-sm muted">{{ __('Last date') }} {{ $exam->closes_at->format('d M Y') }} · {{ trans_choice(':count form|:count forms', $exam->applications_count, ['count' => $exam->applications_count]) }}</p>
                    </div>
                @empty
                    <p class="muted">{{ __('No exam is accepting forms now.') }}</p>
                @endforelse
            </section>
        </div>
    </div>
</x-layouts.portal>
