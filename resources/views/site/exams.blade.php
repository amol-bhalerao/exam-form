<x-layouts.public :title="__('Exam calendar')" :description="__('HSC and SSC exam form dates, late fee windows and exam dates.')">
    <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 class="display-xl">{{ __('Exam calendar') }}</h1>
        <p class="lede mt-3">{{ __('Form dates, late fee windows and fees for every published exam.') }}</p>
        @forelse ($exams as $board => $list)
            <section class="mt-12">
                <h2 class="font-display text-4xl font-bold text-board" style="font-stretch:120%">{{ $board }}</h2>
                <ol class="mt-5 border-l-2 border-rule-strong">
                    @foreach ($list as $exam)
                        <li class="relative ml-6 pb-8">
                            <span @class(['absolute -left-[33px] top-1 size-4 rounded-full border-2', 'border-leaf bg-leaf' => $exam->isOpen(), 'border-ink-3 bg-sheet' => ! $exam->isOpen()])></span>
                            <div class="flex flex-wrap items-center gap-3">
                                <h3 class="title">{{ $exam->name }}</h3>
                                @if ($exam->isOpen())<span class="badge-ok">{{ __('Open') }}</span>
                                @elseif ($exam->opens_at->isFuture())<span class="badge-info">{{ __('Opens soon') }}</span>
                                @else<span class="badge-muted">{{ __('Closed') }}</span>@endif
                            </div>
                            <dl class="mt-3 grid gap-x-8 gap-y-2 text-[0.95rem] sm:grid-cols-2">
                                <div class="flex gap-2"><dt class="text-ink-3">{{ __('Forms') }}:</dt><dd>{{ $exam->opens_at->translatedFormat('j M') }} – {{ $exam->closes_at->translatedFormat('j M Y') }}</dd></div>
                                @if ($exam->late_closes_at)<div class="flex gap-2"><dt class="text-ink-3">{{ __('With late fee until') }}:</dt><dd>{{ $exam->late_closes_at->translatedFormat('j M Y') }}</dd></div>@endif
                                @if ($exam->exam_starts_on)<div class="flex gap-2"><dt class="text-ink-3">{{ __('Exam') }}:</dt><dd>{{ $exam->exam_starts_on->translatedFormat('j M') }}{{ $exam->exam_ends_on ? ' – ' . $exam->exam_ends_on->translatedFormat('j M Y') : '' }}</dd></div>@endif
                                <div class="flex gap-2"><dt class="text-ink-3">{{ __('Stream') }}:</dt><dd>{{ $exam->stream?->label ?? __('All streams') }}</dd></div>
                            </dl>
                            @if ($exam->fees->isNotEmpty())
                                <div class="mt-3 flex flex-wrap gap-2">
                                    @foreach ($exam->fees as $f)
                                        <span class="chip">{{ \App\Support\Codes::label(\App\Support\Codes::CANDIDATE_TYPES, $f->candidate_type) }}: ₹{{ number_format($f->fee) }}</span>
                                    @endforeach
                                </div>
                            @endif
                        </li>
                    @endforeach
                </ol>
            </section>
        @empty
            <x-empty class="mt-10" :title="__('No exams published yet')" icon="calendar-days" />
        @endforelse
    </div>
</x-layouts.public>
