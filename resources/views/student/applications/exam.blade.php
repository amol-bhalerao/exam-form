@php
    use App\Support\Codes;
    $editing = (bool) $application;
    $type = old('candidate_type', $application?->candidate_type ?? 'regular');
@endphp
<x-layouts.portal :title="__('Exam form for :name', ['name' => $student->full_name])">
    <x-page-header :title="__('Exam form')" :subtitle="$student->full_name . ' · ' . ($student->institute?->name ?? '')"
        :back="$editing ? route('student.applications.show', $application) : route('student.dashboard')" />
    @include('student.applications._steps', ['current' => 'exam', 'application' => $application])

    @if ($exams->isEmpty())
        <x-empty :title="__('No exam is accepting forms for this student right now')" icon="calendar-days">
            {{ __('Forms open on dates set by the board. Check the exam calendar and notices.') }}
            <x-slot:action><a href="{{ route('exams.calendar') }}" class="btn-secondary">{{ __('Exam calendar') }}</a></x-slot:action>
        </x-empty>
    @else
    <form method="POST" action="{{ $editing ? route('student.applications.update', [$application, 'exam']) : route('student.applications.store', $student) }}"
          x-data="{ exam: @js((string) old('exam_id', $application?->exam_id ?? $exams->first()->id)), type: @js($type), fees: @js($exams->mapWithKeys(fn ($e) => [$e->id => $e->fees->mapWithKeys(fn ($f) => [$f->candidate_type => $e->feeFor($f->candidate_type)])])) }"
          class="grid gap-6">
        @csrf
        @if ($editing) @method('PUT') @endif

        <section class="sheet sheet-pad rise">
            <h2 class="title mb-5">{{ __('Which exam?') }}</h2>
            <div class="grid gap-3 md:grid-cols-2">
                @foreach ($exams as $exam)
                    @php $taken = $existing[$exam->id] ?? null; @endphp
                    <label @class(['relative flex cursor-pointer flex-col gap-2 rounded-lg border border-rule-strong bg-sheet p-5 has-[input:checked]:border-board has-[input:checked]:bg-board-soft', 'opacity-60' => $taken])>
                        <span class="flex items-start gap-3">
                            <input type="radio" name="exam_id" value="{{ $exam->id }}" class="check mt-1" x-model="exam" @disabled($taken || $editing) required>
                            <span class="min-w-0">
                                <span class="block font-semibold">{{ $exam->name }}</span>
                                <span class="block text-sm muted">{{ $exam->session }} {{ $exam->year }} · {{ $exam->stream?->label ?? __('All streams') }}</span>
                            </span>
                        </span>
                        <span class="ml-8 text-sm">
                            {{ __('Last date') }} <strong>{{ $exam->closes_at->format('d M Y') }}</strong>
                            @if ($exam->late_closes_at) · {{ __('with late fee till') }} {{ $exam->late_closes_at->format('d M Y') }}@endif
                        </span>
                        @if ($exam->inLateWindow())<span class="ml-8 badge-warn w-fit">{{ __('Late fee applies now') }}</span>@endif
                        @if ($taken)<a href="{{ route('student.applications.show', $taken) }}" class="ml-8 text-sm font-semibold">{{ __('A form already exists — open it') }}</a>@endif
                    </label>
                @endforeach
                @if ($editing)<input type="hidden" name="exam_id" value="{{ $application->exam_id }}">@endif
            </div>
            @error('exam_id')<p class="error mt-2">{{ $message }}</p>@enderror
        </section>

        <section class="sheet sheet-pad rise rise-2">
            <h2 class="title mb-1">{{ __('Type of candidate') }}</h2>
            <p class="muted mb-5">{{ __('Repeater / backlog candidates choose only the subjects they are appearing for again.') }}</p>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                @foreach (Codes::CANDIDATE_TYPES as $key => $label)
                    <label class="flex cursor-pointer items-start gap-3 rounded-md border border-rule-strong bg-sheet p-4 has-[input:checked]:border-board has-[input:checked]:bg-board-soft"
                           x-show="fees[exam] && fees[exam][@js($key)]">
                        <input type="radio" name="candidate_type" value="{{ $key }}" class="check mt-1" x-model="type" @disabled($application?->isPaid() && $application->candidate_type !== $key)>
                        <span class="flex-1">
                            <span class="block font-semibold">{{ __($label) }}</span>
                            <span class="text-sm muted" x-show="fees[exam] && fees[exam][@js($key)]">
                                {{ __('Fee') }} ₹<span class="tabular-nums" x-text="fees[exam]?.[@js($key)]?.total"></span>
                                <template x-if="fees[exam]?.[@js($key)]?.late > 0"><span>({{ __('incl. late fee') }} ₹<span x-text="fees[exam][@js($key)].late"></span>)</span></template>
                            </span>
                        </span>
                    </label>
                @endforeach
            </div>
            @error('candidate_type')<p class="error mt-2">{{ $message }}</p>@enderror

            <div class="mt-6 fieldset" x-show="['repeater','improvement','isolated'].includes(type)" x-cloak x-transition>
                <p class="span-2 font-semibold">{{ __('Last exam you appeared for') }}</p>
                <x-form.select name="last_exam_month" :label="__('Month')" :options="Codes::options(Codes::MONTHS)" :value="$application?->last_exam_month" />
                <x-form.input name="last_exam_year" type="number" :label="__('Year')" :value="$application?->last_exam_year" min="1990" max="{{ now()->year }}" />
                <x-form.input name="last_exam_seat_no" :label="__('Seat number')" :value="$application?->last_exam_seat_no" class="uppercase" />
                <x-form.select name="exemption_status" :label="__('Exemption')" :options="['NON_EXEMPTED' => __('Non-exempted'), 'EXEMPTED' => __('Exempted (passed some subjects)')]" :value="$application?->exemption_status ?? 'NON_EXEMPTED'" />
                <x-form.input name="exemptions_claimed" type="number" :label="__('Number of exempted subjects')" :value="$application?->exemptions_claimed ?? 0" min="0" max="8" />
            </div>
            <div class="mt-6 fieldset" x-show="type === 'private'" x-cloak x-transition>
                <x-form.input name="enrolment_cert_no" :label="__('Enrolment certificate no. (Form No. 17)')" :value="$application?->enrolment_cert_no" />
            </div>
        </section>

        <section class="sheet sheet-pad rise rise-3">
            <h2 class="title mb-5">{{ __('Other details') }}</h2>
            <div class="fieldset">
                @if ($student->board?->has_streams)
                    <x-form.select name="subject_group" :label="__('Subject group')" :options="Codes::options(Codes::SUBJECT_GROUPS)" :value="$application?->subject_group ?? 'GENERAL'" />
                @endif
                <x-form.yesno name="is_foreigner" :label="__('Foreign national?')" :value="$application?->is_foreigner ?? false" />
            </div>
        </section>

        <div class="flex flex-wrap justify-end gap-3">
            <button class="btn-primary">{{ __('Next: choose subjects') }}<x-icon name="arrow-right" /></button>
        </div>
    </form>
    @endif
</x-layouts.portal>
