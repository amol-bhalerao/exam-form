@php
    $isTest = $attempt->mode === 'test';
    $title = $isTest ? $attempt->quiz->title : __('Practice') . ' · ' . $attempt->subject->label;
@endphp
<!DOCTYPE html>
<html lang="{{ app()->getLocale() }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="robots" content="noindex, nofollow">
    <meta name="theme-color" content="#1d1846">
    <title>{{ $title }}</title>
    <link rel="icon" href="{{ asset('favicon.svg') }}" type="image/svg+xml">
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body class="min-h-screen bg-paper">
<div x-data="quizRunner({
        questions: @js($questions),
        mode: @js($attempt->mode),
        secondsLeft: @js($secondsLeft),
        warnings: @js($attempt->warnings),
        maxWarnings: @js($attempt->quiz?->max_warnings ?? 1),
        urls: { answer: @js(route('learn.attempts.answer', $attempt)), heartbeat: @js(route('learn.attempts.heartbeat', $attempt)), warn: @js(route('learn.attempts.warn', $attempt)) },
    })" x-cloak>
    <header class="sticky top-0 z-30 text-white shadow-lg" style="background: linear-gradient(120deg, #1d1846, #3b1f6e 55%, #0b5cad)">
        <div class="zari-thin" aria-hidden="true"></div>
        <div class="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
            <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-white/15"><x-icon :name="$isTest ? 'timer' : 'brain'" class="size-5" /></span>
            <div class="min-w-0 flex-1">
                <p class="truncate font-display font-bold leading-tight" style="font-stretch:110%">{{ $title }}</p>
                <p class="truncate text-xs text-white/75">{{ $attempt->student->full_name }} · <span x-text="answeredCount"></span>/{{ count($questions) }} {{ __('answered') }}
                    <span x-show="saving"> · {{ __('Saving…') }}</span><span x-show="!saving && savedAt"> · {{ __('Saved') }}</span></p>
            </div>
            <span class="timer" x-show="timeLeft !== null" :data-low="timeLeft !== null && timeLeft <= 60 ? '' : null"><x-icon name="clock" class="size-4" /><span x-text="clock()"></span></span>
            @if ($isTest)<span class="hidden rounded-full bg-white/15 px-3 py-1 text-sm font-semibold sm:inline" :class="warnings > 0 && 'bg-omr'">{{ __('Warnings') }}: <span x-text="warnings"></span>/<span x-text="maxWarnings"></span></span>@endif
        </div>
        <div class="h-1 bg-white/10"><div class="h-1 bg-marigold transition-all" :style="`width:${answeredCount / questions.length * 100}%`"></div></div>
    </header>

    <div x-show="offline" class="bg-omr px-4 py-2 text-center text-sm font-semibold text-white">{{ __('No internet connection — your answers will save when it returns. Do not close this page.') }}</div>

    <main class="mx-auto grid max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[1fr_17rem]">
        <section id="qtop" class="sheet overflow-hidden">
            <template x-if="q">
                <div class="p-5 sm:p-7">
                    <div class="mb-4 flex flex-wrap items-center gap-2 text-sm">
                        <span class="rounded-full bg-ink px-3 py-1 font-bold text-white tabular-nums">{{ __('Question') }} <span x-text="idx + 1"></span> / {{ count($questions) }}</span>
                        <span class="badge-info" x-text="{ single: @js(__('One correct answer')), multi: @js(__('Choose all correct answers')), true_false: @js(__('True or false')), fill_blank: @js(__('Fill in the blank')) }[q.type]"></span>
                        <span class="badge-muted" x-text="{ easy: @js(__('Easy')), medium: @js(__('Moderate')), hard: @js(__('Hard')) }[q.level]"></span>
                        <button type="button" class="ml-auto btn-quiet btn-sm" @click="flagged[q.id] = !flagged[q.id]" :class="flagged[q.id] && 'text-marigold'"><x-icon name="pin" />{{ __('Mark for review') }}</button>
                    </div>
                    <p class="text-lg font-semibold leading-relaxed whitespace-pre-line sm:text-xl" x-text="q.text"></p>

                    <div class="mt-6 grid gap-2.5" x-show="q.type !== 'fill_blank'" :role="q.type === 'multi' ? 'group' : 'radiogroup'">
                        <template x-for="(o, i) in q.options" :key="o.id">
                            <button type="button" class="opt" :role="q.type === 'multi' ? 'checkbox' : 'radio'" :aria-checked="isOn(q, o.id)" :data-multi="q.type === 'multi' ? '' : null"
                                    :disabled="locked(q)" @click="choose(q, o.id)"
                                    :data-right="checked[q.id] && checked[q.id].right_ids.map(String).includes(String(o.id)) ? '' : null"
                                    :data-wrong="checked[q.id] && !checked[q.id].right_ids.map(String).includes(String(o.id)) && isOn(q, o.id) ? '' : null">
                                <span class="mark" x-text="letters[i]"></span><span class="min-w-0 flex-1" x-text="o.text"></span>
                            </button>
                        </template>
                    </div>
                    <div class="mt-6" x-show="q.type === 'fill_blank'">
                        <label class="label" :for="`fb_${q.id}`">{{ __('Your answer') }}</label>
                        <input :id="`fb_${q.id}`" class="input text-lg" x-model="typed[q.id]" @input="typeAnswer(q)" :disabled="locked(q)" autocomplete="off" autocapitalize="off" spellcheck="false" maxlength="300">
                    </div>

                    @unless ($isTest)
                        <template x-if="checked[q.id]">
                            <div class="mt-5 rounded-xl border-2 p-4" :class="checked[q.id].correct ? 'border-leaf/40 bg-leaf-soft' : 'border-omr/30 bg-omr-soft'">
                                <p class="flex items-center gap-2 font-bold" :class="checked[q.id].correct ? 'text-leaf' : 'text-omr'">
                                    <span x-text="checked[q.id].correct ? @js(__('Correct! Well done.')) : @js(__('Not quite.'))"></span></p>
                                <p class="mt-1 text-sm" x-show="!checked[q.id].correct"><b>{{ __('Correct answer') }}:</b> <span x-text="checked[q.id].answer_text"></span></p>
                                <p class="mt-2 text-sm" x-show="checked[q.id].explanation" x-text="checked[q.id].explanation"></p>
                                <template x-for="t in checked[q.id].tips"><p class="tipcard mt-2 flex gap-2"><x-icon name="lightbulb" class="mt-0.5 size-4 shrink-0 text-marigold" /><span x-text="t"></span></p></template>
                            </div>
                        </template>
                    @endunless

                    <div class="mt-7 flex flex-wrap items-center gap-2 border-t border-rule pt-5">
                        <button type="button" class="btn-secondary" @click="go(idx - 1)" :disabled="idx === 0"><x-icon name="arrow-left" />{{ __('Previous') }}</button>
                        @unless ($isTest)
                            <button type="button" class="btn-gold" x-show="!checked[q.id]" @click="check(q)" :disabled="!answered(q)"><x-icon name="circle-check" />{{ __('Check answer') }}</button>
                        @endunless
                        <button type="button" class="btn-primary ml-auto" x-show="idx < questions.length - 1" @click="go(idx + 1)">{{ __('Next') }}<x-icon name="arrow-right" /></button>
                        <button type="button" class="btn-rani ml-auto" x-show="idx === questions.length - 1" @click="finish()"><x-icon name="send" />{{ $isTest ? __('Submit test') : __('Finish practice') }}</button>
                    </div>
                </div>
            </template>
        </section>

        <aside class="grid content-start gap-4">
            <div class="sheet p-4">
                <p class="mb-3 text-sm font-semibold">{{ __('Questions') }}</p>
                <div class="qnav">
                    <template x-for="(item, i) in questions" :key="item.id">
                        <button type="button" @click="go(i)" :aria-current="i === idx ? 'true' : 'false'" :data-done="answered(item) ? '' : null" :data-flag="flagged[item.id] ? '' : null" x-text="i + 1" :aria-label="`${@js(__('Question'))} ${i + 1}`"></button>
                    </template>
                </div>
                <div class="mt-3 flex flex-wrap gap-3 text-xs muted">
                    <span class="flex items-center gap-1"><i class="inline-block size-3 rounded bg-leaf-soft ring-1 ring-leaf"></i>{{ __('Answered') }}</span>
                    <span class="flex items-center gap-1"><i class="inline-block size-3 rounded bg-marigold-soft ring-1 ring-marigold"></i>{{ __('Marked') }}</span>
                </div>
                <button type="button" class="btn-rani mt-4 w-full justify-center" @click="finish()"><x-icon name="send" />{{ $isTest ? __('Submit test') : __('Finish practice') }}</button>
            </div>
            @if ($isTest)
                <div class="rounded-xl border-2 border-omr/30 bg-omr-soft p-4 text-sm">
                    <p class="flex items-center gap-2 font-bold text-omr"><x-icon name="shield-alert" class="size-5" />{{ __('Test rules') }}</p>
                    <ul class="mt-2 grid gap-1.5 text-ink-2">
                        <li>• {{ __('Do not close, reload or leave this page — closing it ends your test.') }}</li>
                        <li>• {{ __('Switching to another app or tab gives a warning. Leaving again after :n warning(s) ends the test.', ['n' => $attempt->quiz->max_warnings]) }}</li>
                        <li>• {{ __('Answers save automatically. The test submits itself when time is up.') }}</li>
                    </ul>
                </div>
            @else
                <div class="tipcard"><p class="flex gap-2"><x-icon name="lightbulb" class="mt-0.5 size-4 shrink-0 text-marigold" />{{ __('Tap “Check answer” to see if you are right, the explanation and memory tips from teachers and students.') }}</p></div>
            @endif
        </aside>
    </main>

    <form x-ref="submitForm" method="POST" action="{{ route('learn.attempts.submit', $attempt) }}" class="hidden">@csrf</form>

    {{-- Came back after leaving the test page --}}
    <div x-show="warnOpen" class="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm" x-transition.opacity role="alertdialog" aria-modal="true" aria-labelledby="warn_t">
        <div class="w-full max-w-md overflow-hidden rounded-2xl bg-sheet shadow-2xl">
            <div class="h-2" style="background: linear-gradient(90deg, #d4372a, #c8175d)"></div>
            <div class="p-6 text-center">
                <span class="mx-auto grid size-14 place-items-center rounded-full bg-omr-soft text-omr"><x-icon name="triangle-alert" class="size-7" /></span>
                <h2 id="warn_t" class="title mt-3">{{ __('You left the test page') }}</h2>
                <p class="mt-2 text-ink-2">{{ __('Warning') }} <b x-text="warnings"></b> {{ __('of') }} <b x-text="maxWarnings"></b>. <span x-show="warnings >= maxWarnings">{{ __('If you leave the page again, your test will end and you cannot take it again.') }}</span></p>
                <button type="button" class="btn-primary mt-5 w-full justify-center" @click="warnOpen = false">{{ __('I understand — continue the test') }}</button>
            </div>
        </div>
    </div>

    {{-- Submit with unanswered questions --}}
    <div x-show="confirmOpen" class="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" x-transition.opacity role="dialog" aria-modal="true">
        <div class="w-full max-w-md rounded-2xl bg-sheet p-6 shadow-2xl">
            <h2 class="title">{{ $isTest ? __('Submit the test?') : __('Finish this practice?') }}</h2>
            <p class="mt-2 text-ink-2"><span x-text="questions.length - answeredCount"></span> {{ __('question(s) are not answered yet.') }} @if ($isTest){{ __('After submitting you cannot change answers.') }}@endif</p>
            <div class="mt-5 flex flex-wrap justify-end gap-2">
                <button type="button" class="btn-secondary" @click="confirmOpen = false; go(questions.findIndex(x => !answered(x)))">{{ __('Go to unanswered') }}</button>
                <button type="button" class="btn-rani" @click="finish(true)"><x-icon name="send" />{{ __('Submit now') }}</button>
            </div>
        </div>
    </div>
</div>
</body>
</html>
