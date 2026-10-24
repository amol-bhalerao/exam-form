@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Choose subjects')">
    <x-page-header :title="__('Choose subjects')" :subtitle="$application->student->full_name . ' · ' . $application->exam->name" :back="route('student.dashboard')" />
    @include('student.applications._steps', ['current' => 'subjects', 'application' => $application])

    <form method="POST" action="{{ route('student.applications.update', [$application, 'subjects']) }}"
          x-data="subjectPicker({ selected: @js($selected), locked: @js($locked), checkUrl: @js(route('student.applications.check', $application)) })"
          class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        @csrf @method('PUT')

        <div class="grid min-w-0 gap-5">
            @if ($source === 'institute')
                <div class="alert-info rise"><x-icon name="school" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Showing the subjects your college offers for :stream.', ['stream' => $application->stream?->label ?? '']) }}</p></div>
            @else
                <div class="alert-warn rise"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Your college has not listed its subjects yet, so all subjects are shown. Choose only those taught at your college.') }}</p></div>
            @endif
            @unless ($fullScheme)
                <div class="alert-info"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Choose only the subjects you are appearing for in this exam.') }}</p></div>
            @endunless

            @foreach ($groups as $group)
                <section class="sheet sheet-pad rise" style="animation-delay: {{ $loop->index * 40 }}ms">
                    <div class="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                        <h2 class="title">{{ $group['label'] }}</h2>
                        @if ($group['hint'])<span class="text-sm font-semibold text-ink-3">{{ $group['hint'] }}</span>@endif
                    </div>
                    <div class="grid gap-2 sm:grid-cols-2">
                        @foreach ($group['subjects'] as $subject)
                            <button type="button" class="subject-chip" @click="toggle({{ $subject->id }})" :aria-pressed="has({{ $subject->id }})"
                                    @if (in_array($subject->id, $locked, true)) data-locked title="{{ __('Compulsory') }}" @endif>
                                <span class="box"><x-icon name="check" class="size-4" x-show="has({{ $subject->id }})" /></span>
                                <span class="kbd-code">{{ $subject->code }}</span>
                                <span class="min-w-0 flex-1">
                                    <span class="block font-medium leading-snug">{{ $subject->label }}</span>
                                    @if ($subject->papers > 1)<span class="text-xs font-semibold text-marigold">{{ trans_choice(':count paper|:count papers', $subject->papers, ['count' => $subject->papers]) }}</span>@endif
                                </span>
                                @if (in_array($subject->id, $locked, true))<x-icon name="lock" class="size-4 text-leaf" />@endif
                            </button>
                        @endforeach
                    </div>
                </section>
            @endforeach

            <section class="sheet sheet-pad" x-show="count > 0" x-cloak>
                <h2 class="title mb-1">{{ __('Answer language') }}</h2>
                <p class="muted mb-4">{{ __('The language you will write each paper in.') }}</p>
                <div class="grid gap-3">
                    @foreach ($groups as $group)
                        @foreach ($group['subjects'] as $subject)
                            <div class="flex flex-wrap items-center gap-3" x-show="has({{ $subject->id }})">
                                <span class="kbd-code">{{ $subject->code }}</span>
                                <span class="min-w-0 flex-1 font-medium">{{ $subject->label }}</span>
                                @if (! empty($languages[$subject->id]))
                                    <span class="chip">{{ Codes::label(Codes::MEDIUMS, $languages[$subject->id]) }} <x-icon name="lock" class="size-3.5 text-ink-3" /></span>
                                @else
                                    <select name="answer_language[{{ $subject->id }}]" class="select w-44" :disabled="!has({{ $subject->id }})" aria-label="{{ __('Answer language for :subject', ['subject' => $subject->label]) }}">
                                        @foreach (Codes::options(Codes::MEDIUMS) as $code => $label)
                                            <option value="{{ $code }}" @selected(($answerLanguages[$subject->id] ?? $application->student->medium) === $code)>{{ $label }}</option>
                                        @endforeach
                                    </select>
                                @endif
                            </div>
                        @endforeach
                    @endforeach
                </div>
            </section>

            <template x-for="id in [...selected]" :key="id"><input type="hidden" name="subject_ids[]" :value="id"></template>
        </div>

        {{-- Live rule check --}}
        <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="sheet sheet-pad" aria-live="polite">
                <p class="text-sm font-semibold text-ink-3">{{ __('Subjects chosen') }}</p>
                <p class="tile-num mt-1"><span x-text="count"></span>
                    <span class="text-base font-semibold text-ink-3" x-show="result?.summary?.papers">· <span x-text="result?.summary?.papers"></span> {{ __('papers') }}</span></p>
                <div class="mt-4 grid gap-2">
                    <template x-if="checking"><p class="muted text-sm">{{ __('Checking…') }}</p></template>
                    <template x-if="result && result.ok && !(result.warnings || []).length"><p class="alert-ok text-sm"><x-icon name="circle-check" class="size-5 shrink-0" />{{ __('This choice follows the board rules.') }}</p></template>
                    <template x-for="e in (result?.errors || [])"><p class="alert-bad text-sm" x-text="e.message"></p></template>
                    <template x-for="w in (result?.warnings || [])"><p class="alert-warn text-sm" x-text="w.message"></p></template>
                </div>
                @if ($reference)<p class="mt-4 text-xs muted">{{ __('Rules') }}: {{ $reference }}</p>@endif
                <button class="btn-primary mt-5 w-full" :disabled="count === 0">{{ __('Next: review') }}<x-icon name="arrow-right" /></button>
                <a href="{{ route('student.applications.edit', [$application, 'exam']) }}" class="btn-quiet mt-2 w-full">{{ __('Back') }}</a>
            </div>
        </aside>
    </form>
</x-layouts.portal>
