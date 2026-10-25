<x-layouts.portal :title="__('My progress')">
    <x-page-header :title="__('My progress')" :subtitle="$student->full_name">
        <x-slot:actions>@include('learn._learner')</x-slot:actions>
    </x-page-header>
    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <x-stat :label="__('Day streak')" :value="$streak" tone="marigold" />
        <x-stat :label="__('Sets completed')" :value="$attempts->count()" tone="board" />
        <x-stat :label="__('Questions answered')" :value="collect($subjects)->sum('total')" tone="mor" />
        <x-stat :label="__('Overall accuracy')" :value="($t = collect($subjects)->sum('total')) ? round(collect($subjects)->sum('right') / $t * 100) . '%' : '—'" tone="leaf" />
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
        <section class="sheet overflow-hidden lg:col-span-2" x-data="{ text: '', busy: false, load() { this.busy = true; studyPost(@js(route('learn.progress.plan'))).then(r => this.text = r.text).catch(() => this.text = @js(__('Could not make a plan right now. Try again in a minute.'))).finally(() => this.busy = false); } }">
            <div class="flex flex-wrap items-center gap-3 p-5" style="background: linear-gradient(120deg, var(--color-plum-soft), #fff 70%)">
                <span class="tone-icon tone-plum size-10 rounded-lg"><x-icon name="sparkles" class="size-5" /></span>
                <div class="min-w-0 flex-1"><h2 class="title">{{ __('My weekly study plan') }}</h2><p class="text-sm muted">{{ $aiEnabled ? __('Your AI coach reads your last 30 days and plans your week.') : __('Based on your last 30 days of practice.') }}</p></div>
                <button type="button" class="btn-rani btn-sm" @click="load()" :disabled="busy"><x-icon name="sparkles" /><span x-text="busy ? @js(__('Thinking…')) : (text ? @js(__('Refresh plan')) : @js(__('Make my plan')))"></span></button>
            </div>
            <div class="whitespace-pre-line px-5 pb-5 leading-relaxed" x-show="text" x-text="(text || '').replace(/\*\*/g, '').replace(/^#+\s*/gm, '')"></div>
        </section>

        <section class="sheet p-5">
            <h2 class="title mb-4">{{ __('Practice in the last 30 days') }}</h2>
            <div class="heat" style="--cols: 10">
                @foreach ($days as $d)
                    @php $n = $perDay[$d->format('Y-m-d')] ?? 0; @endphp
                    <span data-n="{{ min(3, $n) }}" @if ($d->isToday()) data-today @endif><span class="tip">{{ $d->format('d M') }}: {{ $n }}</span></span>
                @endforeach
            </div>
        </section>

        <section class="sheet p-5">
            <h2 class="title mb-4">{{ __('Accuracy by subject') }}</h2>
            @if ($subjects->isEmpty())<p class="muted">{{ __('Practise to see your accuracy here.') }}</p>@else
                <div class="hbars">@foreach ($subjects as $name => $s)<div class="hbar"><span class="truncate" title="{{ $name }}">{{ $name }}</span><span class="track"><span class="fill" style="width: {{ round($s['right'] / max(1, $s['total']) * 100) }}%"></span></span><span class="val">{{ round($s['right'] / max(1, $s['total']) * 100) }}%</span></div>@endforeach</div>
            @endif
        </section>

        <section class="sheet p-5">
            <h2 class="title mb-1">{{ __('Topics to focus on') }}</h2>
            <p class="mb-4 text-sm muted">{{ __('Weakest first. Tap a topic to practise it.') }}</p>
            @forelse (array_slice($topics, 0, 8, true) as $name => $s)
                @php $p = round($s['right'] / max(1, $s['total']) * 100); @endphp
                <div class="flex items-center gap-3 border-t border-rule py-2 first:border-0">
                    <span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ $name }}</span>
                    <span class="w-24"><span class="meter block"><span style="width: {{ $p }}%; {{ $p < 50 ? 'background: linear-gradient(90deg,var(--color-omr),var(--color-rani))' : '' }}"></span></span></span>
                    <span class="w-10 text-right text-sm font-bold tabular-nums">{{ $p }}%</span>
                </div>
            @empty<p class="muted">{{ __('Practise to see your topics here.') }}</p>@endforelse
        </section>

        <section class="sheet p-5">
            <h2 class="title mb-3">{{ __('Certificates') }}</h2>
            @forelse ($certificates as $c)
                <a href="{{ route('learn.certificates.show', $c) }}" target="_blank" class="flex items-center gap-3 border-t border-rule py-2.5 no-underline text-ink first:border-0"><span class="tone-icon tone-marigold size-9 rounded-lg"><x-icon name="award" class="size-5" /></span><div class="min-w-0 flex-1"><p class="truncate font-semibold">{{ $c->quiz->title }}</p><p class="text-xs muted">{{ $c->quiz->subject->label }} · {{ $c->created_at->format('d M Y') }}</p></div><x-icon name="printer" class="size-4 muted" /></a>
            @empty<p class="text-sm muted">{{ __('Certificates from your teachers’ tests appear here.') }}</p>@endforelse
        </section>

        <section class="sheet overflow-hidden lg:col-span-2">
            <h2 class="title p-5 pb-3">{{ __('All results') }}</h2>
            @if ($attempts->isEmpty())<p class="px-5 pb-5 muted">{{ __('No results yet.') }}</p>@else
            <div class="table-wrap rounded-none border-x-0 border-b-0"><table class="table">
                <thead><tr><th>{{ __('Date') }}</th><th>{{ __('Set') }}</th><th class="num">{{ __('Correct') }}</th><th class="num">{{ __('Score') }}</th><th></th></tr></thead>
                <tbody>@foreach ($attempts as $a)<tr>
                    <td class="text-sm whitespace-nowrap">{{ $a->created_at->format('d M, h:i A') }}</td>
                    <td><p class="font-semibold">{{ $a->quiz?->title ?? __('Practice') }}</p><p class="text-xs muted">{{ $a->subject->label }}@if ($a->status === 'terminated') · <span class="text-omr">{{ __('ended early') }}</span>@endif</p></td>
                    <td class="num">{{ $a->correct }}/{{ $a->correct + $a->wrong + $a->skipped }}</td>
                    <td class="num font-bold">{{ $a->percent() }}%</td>
                    <td class="text-right"><a href="{{ route('learn.attempts.result', $a) }}" class="btn-quiet btn-sm">{{ __('Review') }}</a></td>
                </tr>@endforeach</tbody>
            </table></div>@endif
        </section>
    </div>
</x-layouts.portal>
