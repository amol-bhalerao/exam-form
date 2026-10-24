<x-layouts.portal :title="__('Institutes')">
    <x-page-header :title="__('Institutes')" :subtitle="__(':count colleges and schools.', ['count' => number_format($institutes->total())])">
        <x-slot:actions>
            <a href="{{ route('admin.institutes.import') }}" class="btn-secondary"><x-icon name="upload" />{{ __('Import CSV') }}</a>
            <a href="{{ route('admin.institutes.create', ['board' => request('board')]) }}" class="btn-primary"><x-icon name="plus" />{{ __('Add institute') }}</a>
        </x-slot:actions>
    </x-page-header>
    <nav class="mb-5 flex gap-1 overflow-x-auto border-b border-rule">
        <a href="{{ route('admin.institutes.index', request()->except('board', 'page')) }}" @class(['tab', 'tab-active' => ! request('board')])>{{ __('All') }}</a>
        @foreach ($boards as $b)<a href="{{ route('admin.institutes.index', array_merge(request()->except('page'), ['board' => $b->id])) }}" @class(['tab', 'tab-active' => request('board') == $b->id])>{{ $b->short_name }} <span class="tab-count">{{ number_format($b->institutes_count) }}</span></a>@endforeach
    </nav>
    <form method="GET" class="filters">
        @if (request('board'))<input type="hidden" name="board" value="{{ request('board') }}">@endif
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name, index no. or district') }}"></div>
        <div class="field"><label class="label" for="district">{{ __('District') }}</label><select id="district" name="district" class="select"><option value="">{{ __('All') }}</option>@foreach ($districts as $d)<option value="{{ $d }}" @selected(request('district') === $d)>{{ $d }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="active">{{ __('Status') }}</label><select id="active" name="active" class="select"><option value="">{{ __('All') }}</option><option value="yes" @selected(request('active') === 'yes')>{{ __('Active') }}</option><option value="no" @selected(request('active') === 'no')>{{ __('Inactive') }}</option></select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Index no.') }}</th><th>{{ __('Name') }}</th><th>{{ __('Board') }}</th><th>{{ __('District') }}</th><th class="num">{{ __('Logins') }}</th><th class="num">{{ __('Paid forms') }}</th><th></th></tr></thead>
            <tbody>
            @forelse ($institutes as $i)
                <tr @class(['opacity-60' => ! $i->is_active])>
                    <td class="tabular-nums whitespace-nowrap">{{ $i->college_no }}</td>
                    <td class="min-w-64"><a href="{{ route('admin.institutes.edit', $i) }}" class="font-semibold text-ink">{{ $i->name }}</a>@unless ($i->is_active)<span class="badge-muted ml-1">{{ __('Inactive') }}</span>@endunless</td>
                    <td>{{ $i->board->short_name }}</td>
                    <td class="text-sm">{{ $i->district ?: '—' }}</td>
                    <td class="num">@if ($i->users_count){{ $i->users_count }}@else<a href="{{ route('admin.users.create', ['institute' => $i->id]) }}" class="text-sm">{{ __('Create') }}</a>@endif</td>
                    <td class="num">{{ $i->forms_count ?: '—' }}</td>
                    <td class="text-right"><a href="{{ route('admin.institutes.edit', $i) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a></td>
                </tr>
            @empty
                <tr><td colspan="7" class="py-8 text-center muted">{{ __('No institutes match.') }}</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $institutes->links() }}</div>
</x-layouts.portal>
