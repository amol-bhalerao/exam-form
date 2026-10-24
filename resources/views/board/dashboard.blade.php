@php
    $max = max(1, $daily->max('count'));
    $nice = (int) max(4, ceil($max / 4) * 4);
    $pipeline = [
        ['draft', __('Being filled'), 'muted'], ['submitted', __('With colleges'), 'marigold'], ['returned', __('Sent back to students'), 'marigold'],
        ['verified', __('Waiting for board'), 'board'], ['board_returned', __('Returned to colleges'), 'marigold'], ['approved', __('Approved'), 'leaf'], ['rejected', __('Rejected'), 'omr'],
    ];
@endphp
<x-layouts.portal :title="__('Board dashboard')">
    <x-page-header :title="__('Dashboard')" :subtitle="$exam ? $exam->name : __('No exam created yet')">
        <x-slot:actions>
            @if ($exams->count() > 1)
                <form method="GET" class="flex items-center gap-2">
                    <label for="exam" class="sr-only">{{ __('Exam') }}</label>
                    <select id="exam" name="exam" class="select" onchange="this.form.submit()">
                        @foreach ($exams as $e)<option value="{{ $e->id }}" @selected($exam?->id === $e->id)>{{ $e->name }}</option>@endforeach
                    </select>
                </form>
            @endif
            <a href="{{ route('board.forms.index', ['status' => 'verified', 'exam' => $exam?->id]) }}" class="btn-primary"><x-icon name="file-check" />{{ __('Review forms') }}</a>
        </x-slot:actions>
    </x-page-header>

    @if (! $exam)
        <x-empty :title="__('Create the first exam')" icon="calendar-days">{{ __('Set the form-filling dates and fees so students can start applying.') }}
            <x-slot:action><a href="{{ route('board.exams.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('New exam') }}</a></x-slot:action></x-empty>
    @else
    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <x-stat :label="__('Paid forms')" :value="$paidCount" tone="ink" :hint="__('Fee received ₹:amount', ['amount' => number_format($fees)])" />
        <x-stat :label="__('Waiting for board')" :value="$counts['verified']" tone="board" :href="route('board.forms.index', ['status' => 'verified', 'exam' => $exam->id])" :hint="__('Verified by colleges')" />
        <x-stat :label="__('Approved')" :value="$counts['approved']" tone="leaf" :href="route('board.forms.index', ['status' => 'approved', 'exam' => $exam->id])" />
        <x-stat :label="__('Examiners to review')" :value="$examiners['pending']" tone="marigold" :href="route('board.examiners.index', ['status' => 'pending'])" :hint="__(':n approved', ['n' => number_format($examiners['approved'])])" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <section class="sheet sheet-pad rise min-w-0">
            <div class="mb-5 flex flex-wrap items-baseline justify-between gap-2">
                <h2 class="title">{{ __('Forms paid per day') }}</h2>
                <p class="text-sm muted">{{ __('Last 30 days') }} · {{ trans_choice(':count form|:count forms', $daily->sum('count'), ['count' => number_format($daily->sum('count'))]) }}</p>
            </div>
            <div class="colchart" role="img" aria-label="{{ __('Column chart of forms paid per day for the last 30 days') }}">
                @foreach ([1, 0.5] as $g)<div class="gridline" style="bottom: {{ $g * 100 }}%"><span>{{ (int) ($nice * $g) }}</span></div>@endforeach
                @foreach ($daily as $d)
                    <div class="col" tabindex="0" @if (! $d['count']) data-zero @endif aria-label="{{ $d['date']->format('d M') }}: {{ $d['count'] }}">
                        <i style="height: {{ $d['count'] ? max(2, $d['count'] / $nice * 100) : 1 }}%"></i>
                        <span class="tip">{{ $d['date']->format('d M') }} · {{ $d['count'] }}</span>
                    </div>
                @endforeach
            </div>
            <div class="mt-2 flex justify-between text-xs muted tabular-nums"><span>{{ $daily->first()['date']->format('d M') }}</span><span>{{ $daily[15]['date']->format('d M') }}</span><span>{{ __('Today') }}</span></div>
            <details class="mt-4 text-sm"><summary class="cursor-pointer font-semibold text-board">{{ __('Show as table') }}</summary>
                <div class="table-wrap mt-3 max-h-64 overflow-auto"><table class="table"><thead><tr><th>{{ __('Date') }}</th><th class="num">{{ __('Forms') }}</th></tr></thead>
                    <tbody>@foreach ($daily->reverse() as $d)<tr><td>{{ $d['date']->format('d M Y') }}</td><td class="num">{{ $d['count'] }}</td></tr>@endforeach</tbody></table></div>
            </details>
        </section>

        <section class="sheet sheet-pad rise rise-2">
            <h2 class="title mb-4">{{ __('Where the forms are') }}</h2>
            <ul class="grid gap-3">
                @php $total = max(1, array_sum($counts)); @endphp
                @foreach ($pipeline as [$key, $label, $tone])
                    <li>
                        <a href="{{ in_array($key, \App\Http\Controllers\Board\FormController::STATUSES, true) ? route('board.forms.index', ['status' => $key, 'exam' => $exam->id]) : '#' }}" class="flex items-center justify-between gap-3 text-ink no-underline">
                            <span class="flex items-center gap-2 text-sm"><span class="size-2.5 rounded-full {{ ['muted' => 'bg-rule-strong', 'marigold' => 'bg-marigold', 'board' => 'bg-board', 'leaf' => 'bg-leaf', 'omr' => 'bg-omr'][$tone] }}"></span>{{ $label }}</span>
                            <span class="font-semibold tabular-nums">{{ number_format($counts[$key] ?? 0) }}</span>
                        </a>
                    </li>
                @endforeach
            </ul>
            <div class="mt-5 border-t border-rule pt-4">
                <div class="flex items-baseline justify-between text-sm"><span class="font-semibold">{{ __('Colleges with paid forms') }}</span><span class="tabular-nums">{{ number_format($institutes['active']) }} / {{ number_format($institutes['total']) }}</span></div>
                <div class="meter mt-2"><span style="width: {{ $institutes['total'] ? round($institutes['active'] / $institutes['total'] * 100, 1) : 0 }}%"></span></div>
                <a href="{{ route('board.institutes.index', ['activity' => 'without']) }}" class="mt-2 inline-block text-sm">{{ __('See colleges with no forms yet') }} →</a>
            </div>
        </section>
    </div>

    <div class="mt-6 grid gap-6 lg:grid-cols-3">
        @foreach ([[__('By stream'), $byStream], [__('By candidate type'), $byType], [__('Top districts'), $byDistrict]] as [$heading, $rows])
            @php $m = max(1, collect($rows)->max('count')); @endphp
            <section class="sheet sheet-pad rise">
                <h2 class="title mb-4">{{ $heading }}</h2>
                @if (collect($rows)->sum('count') === 0)
                    <p class="muted text-sm">{{ __('No paid forms yet.') }}</p>
                @else
                <div class="hbars">
                    @foreach ($rows as $r)
                        <div class="hbar"><span class="truncate" title="{{ $r['label'] }}">{{ $r['label'] }}</span><span class="track"><span class="fill" style="width: {{ $r['count'] / $m * 100 }}%"></span></span><span class="val">{{ number_format($r['count']) }}</span></div>
                    @endforeach
                </div>
                @endif
            </section>
        @endforeach
    </div>

    <section class="sheet mt-6 overflow-hidden rise">
        <div class="flex items-center justify-between gap-3 border-b border-rule px-6 py-4">
            <h2 class="title">{{ __('Waiting longest for the board') }}</h2>
            <a href="{{ route('board.forms.index', ['status' => 'verified', 'exam' => $exam->id]) }}" class="text-sm font-semibold">{{ __('See all') }}</a>
        </div>
        @forelse ($oldest as $a)
            <a href="{{ route('board.forms.show', $a) }}" class="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-3 text-ink no-underline last:border-0 hover:bg-wash">
                <span class="min-w-0"><span class="font-semibold">{{ $a->student->full_name }}</span><span class="block truncate text-sm muted">{{ $a->application_no }} · {{ $a->institute->display_name }}</span></span>
                <span class="text-sm muted">{{ __('Verified :when', ['when' => $a->verified_at?->diffForHumans()]) }}</span>
            </a>
        @empty
            <p class="px-6 py-6 muted">{{ __('Nothing is waiting. Well done.') }}</p>
        @endforelse
    </section>
    @endif
</x-layouts.portal>
