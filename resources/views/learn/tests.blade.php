<x-layouts.portal :title="__('My tests')">
    <x-page-header :title="__('My tests')" :subtitle="__('Unit tests and class tests set by your teachers. Each test can be taken only once.')">
        <x-slot:actions>@include('learn._learner')</x-slot:actions>
    </x-page-header>
    @if (! $student->institute_id)
        <div class="alert-warn"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Choose the student\'s college in their details to see tests from its teachers.') }} <a href="{{ route('student.students.edit', $student) }}" class="font-semibold">{{ __('Edit details') }} →</a></p></div>
    @elseif ($tests->isEmpty())
        <x-empty :title="__('No tests yet')" icon="timer">{{ __('When your teachers schedule a test, it appears here with its date and time.') }}</x-empty>
    @else
        <div class="grid gap-3 md:grid-cols-2">
            @foreach ($tests as $t)
                @php $state = $t->state(); $mine = $t->my_attempt; @endphp
                <article class="sheet flex flex-col overflow-hidden">
                    <div class="h-1.5" style="background: {{ $mine ? 'var(--color-leaf)' : ($state === 'live' ? 'linear-gradient(90deg,var(--color-rani),var(--color-marigold))' : 'var(--color-rule-strong)') }}"></div>
                    <div class="flex-1 p-5">
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0"><h2 class="title">{{ $t->title }}</h2><p class="text-sm muted">{{ $t->subject->label }}</p></div>
                            @if ($mine)<span class="badge-ok">{{ __('Taken') }}</span>@elseif ($state === 'live')<span class="badge-rani">{{ __('Open now') }}</span>@elseif ($state === 'upcoming')<span class="badge-info">{{ __('Upcoming') }}</span>@else<span class="badge-muted">{{ __('Closed') }}</span>@endif
                        </div>
                        <dl class="mt-4 grid grid-cols-3 gap-2 text-sm">
                            <div><dt class="muted">{{ __('Questions') }}</dt><dd class="font-semibold">{{ $t->question_count }}</dd></div>
                            <div><dt class="muted">{{ __('Time') }}</dt><dd class="font-semibold">{{ $t->duration_minutes }} {{ __('min') }}</dd></div>
                            <div><dt class="muted">{{ __('Marks') }}</dt><dd class="font-semibold">{{ rtrim(rtrim(number_format($t->question_count * $t->marks_per_question, 2), '0'), '.') }}</dd></div>
                        </dl>
                        <p class="mt-3 text-sm"><x-icon name="calendar-days" class="inline size-4 text-board" /> {{ $t->starts_at->format('d M, h:i A') }} – {{ $t->ends_at->format('d M, h:i A') }}</p>
                    </div>
                    <div class="border-t border-rule p-4">
                        @if ($mine)
                            <a href="{{ route('learn.attempts.result', $mine) }}" class="btn-secondary btn-sm"><x-icon name="chart-column" />{{ __('See result') }} · {{ $mine->percent() }}%</a>
                        @elseif ($state === 'live')
                            <a href="{{ route('learn.tests.show', $t) }}" class="btn-rani btn-sm"><x-icon name="play" />{{ __('Read rules and start') }}</a>
                        @elseif ($state === 'upcoming')
                            <span class="text-sm muted">{{ __('Opens :when', ['when' => $t->starts_at->diffForHumans()]) }}</span>
                        @else
                            <span class="text-sm muted">{{ __('You did not take this test.') }}</span>
                        @endif
                    </div>
                </article>
            @endforeach
        </div>
    @endif
</x-layouts.portal>
