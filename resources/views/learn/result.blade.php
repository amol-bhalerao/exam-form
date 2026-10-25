@php
    $pct = $attempt->percent();
    $isTest = $attempt->mode === 'test';
    $ring = $pct >= 75 ? 'var(--color-leaf)' : ($pct >= 40 ? 'var(--color-marigold)' : 'var(--color-omr)');
@endphp
<x-layouts.portal :title="__('Result')">
    <x-page-header :title="$isTest ? $attempt->quiz->title : __('Practice result')" :subtitle="$attempt->subject->label . ' · ' . $attempt->submitted_at?->format('d M Y, h:i A')" :back="route($isTest ? 'learn.tests.index' : 'learn.hub')">
        <x-slot:actions>
            @unless ($isTest)
                <form method="POST" action="{{ route('learn.practice.store') }}">
                    @csrf
                    <input type="hidden" name="subject_id" value="{{ $attempt->subject_id }}">
                    @foreach ($attempt->config['topic_ids'] ?? [] as $t)<input type="hidden" name="topic_ids[]" value="{{ $t }}">@endforeach
                    @foreach ($attempt->config['types'] ?? [] as $t)<input type="hidden" name="types[]" value="{{ $t }}">@endforeach
                    <input type="hidden" name="difficulty" value="{{ $attempt->config['difficulty'] ?? 'mixed' }}">
                    <input type="hidden" name="count" value="{{ max(5, $attempt->config['count'] ?? 10) }}">
                    <input type="hidden" name="minutes" value="{{ $attempt->config['minutes'] ?? 0 }}">
                    <button class="btn-secondary"><x-icon name="rotate-ccw" />{{ __('Practise again') }}</button>
                </form>
            @endunless
            <a href="{{ route('learn.practice.create') }}" class="btn-primary"><x-icon name="brain" />{{ __('New practice') }}</a>
        </x-slot:actions>
    </x-page-header>

    @if ($attempt->status === 'terminated')
        <div class="alert-bad mb-5"><x-icon name="shield-alert" class="mt-0.5 size-5 shrink-0" /><div><p class="font-semibold">{{ __('This test was ended early.') }}</p><p>{{ $attempt->end_reason }} {{ __('Answers saved until then were marked.') }}</p></div></div>
    @elseif ($attempt->status === 'timed_out')
        <div class="alert-warn mb-5"><x-icon name="clock" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Time was up, so your answers were submitted automatically.') }}</p></div>
    @endif

    <div class="grid gap-6 lg:grid-cols-[20rem_1fr]">
        <section class="sheet overflow-hidden">
            <div class="zari-thin" aria-hidden="true"></div>
            <div class="flex flex-col items-center p-6 text-center">
                <div class="ring-score" style="--p: {{ $pct }}; --ring: {{ $ring }}" role="img" aria-label="{{ __(':pct percent', ['pct' => $pct]) }}">
                    <div><p class="font-display text-4xl font-bold tabular-nums" style="font-stretch:112%">{{ $pct }}%</p><p class="text-xs muted tabular-nums">{{ rtrim(rtrim(number_format($attempt->score, 2), '0'), '.') }} / {{ rtrim(rtrim(number_format($attempt->max_score, 2), '0'), '.') }}</p></div>
                </div>
                <p class="title mt-4">{{ $pct >= 90 ? __('Outstanding!') : ($pct >= 75 ? __('Great job!') : ($pct >= 40 ? __('Good effort — keep going!') : __('Every attempt makes you stronger.'))) }}</p>
                @if ($isTest)
                    <p class="mt-1"><span class="{{ $attempt->passed() ? 'badge-ok' : 'badge-bad' }}">{{ $attempt->passed() ? __('Passed') : __('Not passed') }}</span> <span class="text-sm muted">{{ __('Pass mark :n%', ['n' => $attempt->quiz->pass_percent]) }}</span></p>
                    @if ($attempt->certificate)<a href="{{ route('learn.certificates.show', $attempt->certificate) }}" class="btn-gold btn-sm mt-3" target="_blank"><x-icon name="award" />{{ __('View certificate') }}</a>@endif
                @endif
                <dl class="mt-5 grid w-full grid-cols-3 gap-2 text-center">
                    <div class="rounded-lg bg-leaf-soft p-2"><dt class="text-xs text-leaf">{{ __('Correct') }}</dt><dd class="text-xl font-bold text-leaf tabular-nums">{{ $attempt->correct }}</dd></div>
                    <div class="rounded-lg bg-omr-soft p-2"><dt class="text-xs text-omr">{{ __('Wrong') }}</dt><dd class="text-xl font-bold text-omr tabular-nums">{{ $attempt->wrong }}</dd></div>
                    <div class="rounded-lg bg-wash p-2"><dt class="text-xs muted">{{ __('Skipped') }}</dt><dd class="text-xl font-bold tabular-nums">{{ $attempt->skipped }}</dd></div>
                </dl>
                <p class="mt-3 text-sm muted">{{ __('Time taken') }}: {{ gmdate($attempt->submitted_at->diffInSeconds($attempt->started_at, true) >= 3600 ? 'H:i:s' : 'i:s', (int) $attempt->submitted_at->diffInSeconds($attempt->started_at, true)) }}</p>
            </div>
            @if ($topics)
                <div class="border-t border-rule p-5">
                    <p class="mb-3 text-sm font-semibold">{{ __('By topic') }}</p>
                    <div class="hbars">
                        @foreach ($topics as $name => $s)
                            <div class="hbar" style="grid-template-columns: minmax(0,1fr) 5rem 2.5rem"><span class="truncate" title="{{ $name }}">{{ $name }}</span><span class="track"><span class="fill" style="width: {{ round($s['right'] / max(1, $s['total']) * 100) }}%"></span></span><span class="val">{{ $s['right'] }}/{{ $s['total'] }}</span></div>
                        @endforeach
                    </div>
                </div>
            @endif
        </section>

        <div class="grid content-start gap-6">
            <section class="sheet overflow-hidden" x-data="{ text: @js($feedback), source: @js($attempt->ai_source), busy: false,
                    load() { this.busy = true; studyPost(@js(route('learn.attempts.feedback', $attempt))).then(r => { this.text = r.text; this.source = r.source; }).catch(() => { this.text = @js(__('Could not load the study plan. Try again in a moment.')); }).finally(() => this.busy = false); } }"
                     x-init="if (!text) load()">
                <div class="flex items-center gap-3 p-5 pb-3" style="background: linear-gradient(120deg, var(--color-plum-soft), #fff 70%)">
                    <span class="tone-icon tone-plum size-10 rounded-lg"><x-icon name="sparkles" class="size-5" /></span>
                    <div><h2 class="title">{{ __('Your coach says') }}</h2><p class="text-xs muted" x-text="source === 'ai' ? @js(__('Personal analysis by AI')) : @js(__('Personal analysis'))"></p></div>
                </div>
                <div class="px-5 pb-5">
                    <div x-show="busy" class="grid gap-2 py-2" aria-live="polite"><p class="text-sm muted">{{ __('Analysing your answers…') }}</p><div class="h-3 w-3/4 animate-pulse rounded bg-wash"></div><div class="h-3 w-2/3 animate-pulse rounded bg-wash"></div><div class="h-3 w-1/2 animate-pulse rounded bg-wash"></div></div>
                    <div x-show="!busy && text" class="prose-page max-w-none text-[0.97rem] leading-relaxed whitespace-pre-line" x-text="(text || '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '')"></div>
                    <div class="mt-4 flex flex-wrap gap-2">
                        <form method="POST" action="{{ route('learn.practice.weak') }}">@csrf<input type="hidden" name="subject" value="{{ $attempt->subject_id }}"><button class="btn-rani btn-sm"><x-icon name="target" />{{ __('Practise my weak topics') }}</button></form>
                        <a href="{{ route('learn.materials.index', ['subject' => $attempt->subject_id]) }}" class="btn-secondary btn-sm"><x-icon name="book-marked" />{{ __('Read study material') }}</a>
                    </div>
                </div>
            </section>

            @if ($showAnswers)
                <section>
                    <h2 class="title mb-3">{{ __('Review your answers') }}</h2>
                    <div class="grid gap-3">
                        @foreach ($answers as $row)
                            @php
                                $q = $row->question; $chosen = collect($row->answer ?? [])->map(fn ($x) => (string) $x);
                                $shown = collect($row->shown_options ?? [])->map(fn ($id) => $q->options->firstWhere('id', $id))->filter();
                            @endphp
                            <article class="sheet p-4 sm:p-5" x-data="{ tip: false }">
                                <div class="flex items-start gap-3">
                                    <span @class(['grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold text-white', 'bg-leaf' => $row->is_correct === true, 'bg-omr' => $row->is_correct === false, 'bg-ink-3' => $row->is_correct === null])>{{ $loop->iteration }}</span>
                                    <div class="min-w-0 flex-1">
                                        <p class="font-semibold whitespace-pre-line">{{ $q->text }}</p>
                                        @if ($q->type === 'fill_blank')
                                            <p class="mt-2 text-sm">{{ __('Your answer') }}: <b @class(['text-leaf' => $row->is_correct, 'text-omr' => ! $row->is_correct])>{{ $chosen->first() ?? '—' }}</b></p>
                                        @else
                                            <ul class="mt-2 grid gap-1.5 sm:grid-cols-2">
                                                @foreach ($shown as $o)
                                                    @php $picked = $chosen->contains((string) $o->id); @endphp
                                                    <li @class(['flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm', 'bg-leaf-soft font-semibold text-leaf' => $o->is_correct, 'bg-omr-soft text-omr' => $picked && ! $o->is_correct, 'bg-wash' => ! $o->is_correct && ! $picked])>
                                                        <x-icon :name="$o->is_correct ? 'circle-check' : ($picked ? 'circle-x' : 'x')" class="mt-0.5 size-4 shrink-0" />{{ $o->text }}@if ($picked)<span class="ml-auto text-xs">({{ __('your choice') }})</span>@endif</li>
                                                @endforeach
                                            </ul>
                                        @endif
                                        @if ($row->is_correct !== true)<p class="mt-2 text-sm"><b>{{ __('Correct answer') }}:</b> {{ $q->answerText() }}</p>@endif
                                        @if ($q->explanation)<p class="mt-2 text-sm text-ink-2">{{ $q->explanation }}</p>@endif
                                        @foreach ($tips[$q->id] ?? [] as $t)
                                            <div class="tipcard mt-2 flex items-start gap-2">
                                                <x-icon name="lightbulb" class="mt-0.5 size-4 shrink-0 text-marigold" />
                                                <p class="min-w-0 flex-1">{{ $t->text }} <span class="text-xs muted">— {{ $t->authorName() }}</span></p>
                                                <button type="button" class="flex items-center gap-1 text-xs font-semibold" x-data="{ on: @js(in_array($t->id, $liked)), n: {{ $t->likes }} }"
                                                        @click="studyPost(@js(route('learn.tips.like', $t))).then(r => { on = r.liked; n = r.likes })" :class="on ? 'text-rani' : 'muted'" :aria-pressed="on">
                                                    <x-icon name="thumbs-up" class="size-4" /><span x-text="n"></span></button>
                                            </div>
                                        @endforeach
                                        <button type="button" class="mt-2 text-sm font-semibold text-rani" @click="tip = !tip"><x-icon name="lightbulb" class="inline size-4" /> {{ __('I have a trick to remember this') }}</button>
                                        <form x-show="tip" x-collapse x-cloak method="POST" action="{{ route('learn.tips.store', $q) }}" class="mt-2 flex flex-col gap-2 sm:flex-row">
                                            @csrf
                                            <input name="text" class="input flex-1" maxlength="500" minlength="5" required placeholder="{{ __('Share your short trick, rhyme or first-letter code') }}">
                                            <button class="btn-gold btn-sm"><x-icon name="send" />{{ __('Share') }}</button>
                                        </form>
                                    </div>
                                </div>
                            </article>
                        @endforeach
                    </div>
                </section>
            @else
                <div class="alert-info"><x-icon name="info" class="mt-0.5 size-5 shrink-0" /><p>{{ $attempt->quiz?->show_answers_after ? __('Correct answers will be shown here after the test closes on :date.', ['date' => $attempt->quiz->ends_at->format('d M, h:i A')]) : __('Your teacher has chosen not to show the answers for this test.') }}</p></div>
            @endif
        </div>
    </div>
</x-layouts.portal>
