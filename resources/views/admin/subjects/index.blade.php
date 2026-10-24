@php use App\Models\Subject; @endphp
<x-layouts.portal :title="__('Subjects')">
    <x-page-header :title="__('Subjects')" :subtitle="__('Master subject list. Colleges choose from these for their streams; students choose from what their college offers.')">
        <x-slot:actions><a href="{{ route('admin.subjects.create', ['board' => $board?->id]) }}" class="btn-primary"><x-icon name="plus" />{{ __('Add subject') }}</a></x-slot:actions>
    </x-page-header>
    <nav class="mb-5 flex gap-1 overflow-x-auto border-b border-rule">
        @foreach ($boards as $b)<a href="{{ route('admin.subjects.index', ['board' => $b->id]) }}" @class(['tab', 'tab-active' => $board?->id === $b->id])>{{ $b->short_name }}</a>@endforeach
    </nav>
    <form method="GET" class="filters">
        <input type="hidden" name="board" value="{{ $board?->id }}">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Code or name') }}"></div>
        <div class="field"><label class="label" for="kind">{{ __('Type') }}</label><select id="kind" name="kind" class="select"><option value="">{{ __('All') }}</option>@foreach (Subject::KINDS as $k => $l)<option value="{{ $k }}" @selected(request('kind') === $k)>{{ __($l) }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Code') }}</th><th>{{ __('Name') }}</th><th>{{ __('Type') }}</th><th>{{ __('Streams') }}</th><th class="num">{{ __('Marks') }}</th><th></th></tr></thead>
            <tbody>
            @forelse ($subjects as $s)
                <tr @class(['opacity-60' => ! $s->is_active])>
                    <td><span class="kbd-code">{{ $s->code }}</span></td>
                    <td class="min-w-56"><p class="font-semibold">{{ $s->name }}</p><p class="text-sm muted">{{ $s->name_mr }}@if ($s->name_hi && $s->name_hi !== $s->name_mr) · {{ $s->name_hi }}@endif</p></td>
                    <td class="text-sm">{{ $s->kind_label }}@if ($s->graded)<span class="badge-muted ml-1">{{ __('Graded') }}</span>@endif</td>
                    <td class="text-sm">{{ $s->streams->map->label->implode(', ') ?: '—' }}</td>
                    <td class="num text-sm">{{ $s->theory_marks }}@if ($s->internal_marks) + {{ $s->internal_marks }}@endif</td>
                    <td class="text-right"><a href="{{ route('admin.subjects.edit', $s) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a></td>
                </tr>
            @empty
                <tr><td colspan="6" class="py-8 text-center muted">{{ __('No subjects match.') }}</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
</x-layouts.portal>
