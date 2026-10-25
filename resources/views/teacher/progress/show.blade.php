<x-layouts.portal :title="$student->full_name">
    <x-page-header :title="$student->full_name" :subtitle="($student->stream?->label ?? '') . ' · ' . __('practice and tests')" :back="route('teacher.progress.index')" />
    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <x-stat :label="__('Day streak')" :value="$streak" tone="marigold" />
        <x-stat :label="__('Sets (last 30)')" :value="$attempts->count()" tone="board" />
        <x-stat :label="__('Days practised (30)')" :value="$perDay->count()" tone="leaf" />
        <x-stat :label="__('Average score')" :value="$attempts->count() ? round($attempts->avg(fn ($a) => $a->percent())) . '%' : '—'" tone="mor" />
    </div>
    <div class="grid gap-6 lg:grid-cols-2">
        <section class="sheet p-5">
            <h2 class="title mb-4">{{ __('Daily practice — 30 days') }}</h2>
            <div class="heat" style="--cols: 10">@foreach ($days as $d)@php $n = $perDay[$d->format('Y-m-d')] ?? 0; @endphp<span data-n="{{ min(3, $n) }}" @if ($d->isToday()) data-today @endif><span class="tip">{{ $d->format('d M') }}: {{ $n }}</span></span>@endforeach</div>
        </section>
        <section class="sheet p-5" style="background: linear-gradient(160deg, var(--color-plum-soft), #fff 60%)">
            <h2 class="title mb-3 flex items-center gap-2"><x-icon name="sparkles" class="size-5 text-plum" />{{ __('Coach summary') }}</h2>
            <p class="whitespace-pre-line text-[0.97rem] leading-relaxed">{{ $overview }}</p>
        </section>
        <section class="sheet p-5">
            <h2 class="title mb-4">{{ __('Topics — weakest first') }}</h2>
            @forelse (array_slice($topics, 0, 10, true) as $name => $s)
                @php $p = round($s['right'] / max(1, $s['total']) * 100); @endphp
                <div class="flex items-center gap-3 border-t border-rule py-2 first:border-0"><span class="min-w-0 flex-1 truncate text-sm font-semibold">{{ $name }}</span><span class="w-24"><span class="meter block"><span style="width: {{ $p }}%"></span></span></span><span class="w-14 text-right text-sm tabular-nums">{{ $s['right'] }}/{{ $s['total'] }}</span></div>
            @empty<p class="muted">{{ __('No practice yet.') }}</p>@endforelse
        </section>
        <section class="sheet overflow-hidden">
            <h2 class="title p-5 pb-3">{{ __('Recent sets') }}</h2>
            @forelse ($attempts as $a)
                <div class="flex items-center gap-3 border-t border-rule px-5 py-2.5">
                    <span class="tone-icon {{ $a->mode === 'test' ? 'tone-rani' : 'tone-mor' }} size-8 rounded-lg"><x-icon :name="$a->mode === 'test' ? 'timer' : 'brain'" class="size-4" /></span>
                    <div class="min-w-0 flex-1"><p class="truncate text-sm font-semibold">{{ $a->quiz?->title ?? __('Practice') . ' · ' . $a->subject->label }}</p><p class="text-xs muted">{{ $a->created_at->format('d M, h:i A') }} · {{ $a->correct }}/{{ $a->correct + $a->wrong + $a->skipped }}@if ($a->status === 'terminated') · <span class="text-omr">{{ __('ended early') }}</span>@endif</p></div>
                    <span class="font-bold tabular-nums">{{ $a->percent() }}%</span>
                </div>
            @empty<p class="px-5 pb-5 muted">{{ __('No practice yet.') }}</p>@endforelse
        </section>
    </div>
</x-layouts.portal>
