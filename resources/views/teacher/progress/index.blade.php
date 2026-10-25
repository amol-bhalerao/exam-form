<x-layouts.portal :title="__('Student progress')">
    <x-page-header :title="__('Student progress')" :subtitle="__('Who practised on which day in the last two weeks. Darker green means more practice sets.')" />
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Student name') }}"></div>
        <div class="field"><label class="label" for="stream">{{ __('Stream') }}</label><select id="stream" name="stream" class="select"><option value="">{{ __('All') }}</option>@foreach ($streams as $s)<option value="{{ $s->id }}" @selected(request('stream') == $s->id)>{{ $s->label }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($students->isEmpty())
        <x-empty :title="__('No students yet')" icon="users">{{ __('Students who choose your college in their details appear here.') }}</x-empty>
    @else
        <div class="table-wrap"><table class="table">
            <thead><tr><th>{{ __('Student') }}</th><th class="min-w-64">{{ __('Last 14 days') }}</th><th class="num">{{ __('Sets') }}</th><th class="num">{{ __('Accuracy') }}</th><th>{{ __('Last practice') }}</th></tr></thead>
            <tbody>@foreach ($students as $s)
                @php $st = $stats[$s->id] ?? null; $lastAt = isset($last[$s->id]) ? \Illuminate\Support\Carbon::parse($last[$s->id]) : null; @endphp
                <tr>
                    <td><a href="{{ route('teacher.progress.show', $s) }}" class="font-semibold">{{ $s->full_name }}</a><p class="text-xs muted">{{ $s->stream?->label }}</p></td>
                    <td><div class="heat" style="--cols: 14">@foreach ($days as $d)@php $n = $grid[$s->id][$d->format('Y-m-d')] ?? 0; @endphp<span data-n="{{ min(3, $n) }}" @if ($d->isToday()) data-today @endif><span class="tip">{{ $d->format('d M') }}: {{ $n }}</span></span>@endforeach</div></td>
                    <td class="num">{{ $st['sets'] ?? 0 }}</td>
                    <td class="num">{{ isset($st['accuracy']) ? $st['accuracy'] . '%' : '—' }}</td>
                    <td class="text-sm">@if ($lastAt)<span @class(['text-leaf font-semibold' => $lastAt->isToday(), 'text-omr' => $lastAt->lt(now()->subDays(7))])>{{ $lastAt->diffForHumans() }}</span>@else<span class="muted">{{ __('Never') }}</span>@endif</td>
                </tr>
            @endforeach</tbody>
        </table></div>
        <div class="mt-5">{{ $students->links() }}</div>
    @endif
</x-layouts.portal>
