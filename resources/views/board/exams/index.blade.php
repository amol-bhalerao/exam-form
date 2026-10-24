@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Exams and fees')">
    <x-page-header :title="__('Exams and fees')" :subtitle="__('Each exam has a form-filling window, an optional late-fee window, and a fee for every candidate type.')">
        <x-slot:actions><a href="{{ route('board.exams.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('New exam') }}</a></x-slot:actions>
    </x-page-header>

    @if ($exams->isEmpty())
        <x-empty :title="__('No exams yet')" icon="calendar-days">{{ __('Create an exam to open form filling for students.') }}</x-empty>
    @else
    <div class="grid gap-5">
        @foreach ($exams as $exam)
            @php
                $state = ! $exam->is_published ? ['badge-muted', __('Not published')]
                    : ($exam->opens_at->isFuture() ? ['badge-info', __('Opens :date', ['date' => $exam->opens_at->format('d M')])]
                    : ($exam->isOpen() ? ($exam->inLateWindow() ? ['badge-warn', __('Late-fee window')] : ['badge-ok', __('Open for forms')]) : ['badge-muted', __('Closed')]));
            @endphp
            <article class="sheet sheet-pad rise">
                <div class="flex flex-wrap items-start justify-between gap-4">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2"><span class="kbd-code">{{ $exam->code }}</span><span class="{{ $state[0] }}">{{ $state[1] }}</span></div>
                        <h2 class="title mt-2">{{ $exam->name }}</h2>
                        <p class="text-sm muted">{{ $exam->stream?->label ?? __('All streams') }} · {{ __('Academic year') }} {{ $exam->academic_year }}</p>
                    </div>
                    <div class="flex gap-2">
                        <a href="{{ route('board.forms.index', ['exam' => $exam->id]) }}" class="btn-quiet btn-sm">{{ trans_choice(':count paid form|:count paid forms', $exam->paid_count, ['count' => number_format($exam->paid_count)]) }}</a>
                        <a href="{{ route('board.exams.edit', $exam) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a>
                    </div>
                </div>
                <dl class="mt-5 grid gap-4 text-sm sm:grid-cols-3">
                    <div><dt class="muted">{{ __('Forms open') }}</dt><dd class="font-semibold">{{ $exam->opens_at->format('d M Y') }} – {{ $exam->closes_at->format('d M Y') }}</dd></div>
                    <div><dt class="muted">{{ __('Late fee until') }}</dt><dd class="font-semibold">{{ $exam->late_closes_at?->format('d M Y') ?? '—' }}</dd></div>
                    <div><dt class="muted">{{ __('Exam dates') }}</dt><dd class="font-semibold">{{ $exam->exam_starts_on ? $exam->exam_starts_on->format('d M') . ' – ' . ($exam->exam_ends_on?->format('d M Y') ?? '') : '—' }}</dd></div>
                </dl>
                <div class="mt-4 flex flex-wrap gap-2">
                    @foreach ($exam->fees->sortBy(fn ($f) => array_search($f->candidate_type, array_keys(Codes::CANDIDATE_TYPES))) as $fee)
                        <span class="chip">{{ Codes::label(Codes::CANDIDATE_TYPES, $fee->candidate_type) }} <strong class="tabular-nums">₹{{ number_format($fee->fee) }}</strong>@if ($fee->late_fee)<span class="muted">+ ₹{{ $fee->late_fee }} {{ __('late') }}</span>@endif</span>
                    @endforeach
                </div>
            </article>
        @endforeach
    </div>
    @endif
</x-layouts.portal>
