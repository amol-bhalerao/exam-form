@php
    $done = $attempts->where('status', '!=', \App\Models\Attempt::LIVE);
    $avg = $done->count() ? round($done->avg(fn ($a) => $a->percent())) : null;
    $passed = $done->filter->passed()->count();
    $state = $quiz->state();
@endphp
<x-layouts.portal :title="$quiz->title">
    <x-page-header :title="$quiz->title" :subtitle="$quiz->subject->label . ($quiz->stream ? ' · ' . $quiz->stream->label : '') . ' · ' . $quiz->starts_at->format('d M, h:i A') . ' – ' . $quiz->ends_at->format('d M, h:i A')" :back="route('teacher.quizzes.index')">
        <x-slot:actions>
            <span class="{{ ['draft' => 'badge-muted', 'upcoming' => 'badge-info', 'live' => 'badge-ok', 'ended' => 'badge-pending'][$state] }} self-center">{{ ['draft' => __('Draft'), 'upcoming' => __('Upcoming'), 'live' => __('Live'), 'ended' => __('Ended')][$state] }}</span>
            <a href="{{ route('teacher.quizzes.edit', $quiz) }}" class="btn-secondary"><x-icon name="pencil" />{{ __('Edit') }}</a>
        </x-slot:actions>
    </x-page-header>

    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <x-stat :label="__('Submitted')" :value="$done->count()" tone="board" :hint="__('of :n eligible students', ['n' => $eligible])" />
        <x-stat :label="__('Average score')" :value="$avg !== null ? $avg . '%' : '—'" tone="mor" />
        <x-stat :label="__('Passed')" :value="$passed" tone="leaf" :hint="__('Pass mark :n%', ['n' => $quiz->pass_percent])" />
        <x-stat :label="__('Ended for leaving the page')" :value="$done->where('status', 'terminated')->count()" tone="omr" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[1fr_24rem]">
        <section class="sheet overflow-hidden">
            <h2 class="title p-5 pb-3">{{ __('Results') }}</h2>
            @if ($attempts->isEmpty())
                <p class="px-5 pb-5 muted">{{ $state === 'upcoming' ? __('The test has not opened yet.') : __('No student has taken the test yet.') }}</p>
            @else
            <div class="table-wrap rounded-none border-x-0 border-b-0"><table class="table">
                <thead><tr><th class="num">#</th><th>{{ __('Student') }}</th><th class="num">{{ __('Correct') }}</th><th class="num">{{ __('Score') }}</th><th>{{ __('Status') }}</th></tr></thead>
                <tbody>@foreach ($attempts as $a)<tr>
                    <td class="num muted">{{ $loop->iteration }}</td>
                    <td><a href="{{ route('teacher.progress.show', $a->student) }}" class="font-semibold">{{ $a->student->full_name }}</a>@if ($a->certificate)<x-icon name="award" class="ml-1 inline size-4 text-marigold" />@endif
                        <p class="text-xs muted">{{ $a->submitted_at?->format('d M, h:i A') ?? __('In progress') }}@if ($a->warnings) · {{ trans_choice(':count warning|:count warnings', $a->warnings, ['count' => $a->warnings]) }}@endif</p></td>
                    <td class="num">{{ $a->correct }} / {{ $a->correct + $a->wrong + $a->skipped }}</td>
                    <td class="num font-bold">{{ rtrim(rtrim(number_format($a->score, 2), '0'), '.') }}<span class="text-xs font-normal muted"> ({{ $a->percent() }}%)</span></td>
                    <td>@if ($a->isLive())<span class="badge-info">{{ __('Writing') }}</span>@elseif ($a->status === 'terminated')<span class="badge-bad" title="{{ $a->end_reason }}">{{ __('Ended early') }}</span>@elseif ($a->passed())<span class="badge-ok">{{ __('Passed') }}</span>@else<span class="badge-pending">{{ __('Not passed') }}</span>@endif</td>
                </tr>@endforeach</tbody>
            </table></div>
            @endif
        </section>

        <aside class="grid content-start gap-6">
            <section class="sheet overflow-hidden">
                <div class="zari-thin" aria-hidden="true"></div>
                <div class="p-5">
                    <h2 class="title flex items-center gap-2"><x-icon name="award" class="size-5 text-marigold" />{{ __('Certificates') }}</h2>
                    <p class="mt-1 text-sm muted">{{ __('Choose a design, generate certificates for every student at once and print them (A4 landscape).') }}</p>
                    @if ($done->isEmpty())
                        <p class="mt-4 text-sm">{{ __('Certificates can be generated after students submit the test.') }}</p>
                    @else
                        <form method="POST" action="{{ route('teacher.quizzes.certificates', $quiz) }}" class="mt-4 grid gap-4">
                            @csrf
                            <div class="[&_.grid]:!grid-cols-2">@include('teacher.quizzes._templates', ['name' => 'template', 'current' => $quiz->certificate_template ?? 'paithani'])</div>
                            <fieldset class="grid gap-2"><legend class="label">{{ __('Who gets one') }}</legend>
                                <label class="flex items-center gap-2"><input type="radio" name="who" value="passed" class="check" checked>{{ __('Students who passed (:n)', ['n' => $passed]) }}</label>
                                <label class="flex items-center gap-2"><input type="radio" name="who" value="all" class="check">{{ __('Everyone who took the test (:n) — others get a participation certificate', ['n' => $done->count()]) }}</label>
                            </fieldset>
                            <button class="btn-gold justify-center"><x-icon name="printer" />{{ __('Generate and print') }}</button>
                            @if ($quiz->certificates()->exists())<a href="{{ route('teacher.quizzes.print', $quiz) }}" class="btn-secondary justify-center" target="_blank"><x-icon name="eye" />{{ __('Print issued certificates again') }}</a>@endif
                        </form>
                    @endif
                </div>
            </section>

            @if ($hardest->isNotEmpty())
                <section class="sheet p-5">
                    <h2 class="title mb-1">{{ __('Hardest questions') }}</h2>
                    <p class="mb-3 text-sm muted">{{ __('Revise these in class.') }}</p>
                    @foreach ($hardest as $h)
                        @php $p = round($h['right'] / max(1, $h['seen']) * 100); @endphp
                        <div class="border-t border-rule py-2.5 first:border-0">
                            <p class="line-clamp-2 text-sm font-semibold">{{ $h['q']->text }}</p>
                            <div class="mt-1 flex items-center gap-2"><span class="meter flex-1"><span style="width: {{ $p }}%; {{ $p < 50 ? 'background: linear-gradient(90deg,var(--color-omr),var(--color-rani))' : '' }}"></span></span><span class="text-xs font-bold tabular-nums">{{ $h['right'] }}/{{ $h['seen'] }}</span></div>
                            <p class="mt-0.5 text-xs muted">{{ __('Answer') }}: {{ $h['q']->answerText() }}</p>
                        </div>
                    @endforeach
                </section>
            @endif
        </aside>
    </div>
</x-layouts.portal>
