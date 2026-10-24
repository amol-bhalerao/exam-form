<x-layouts.portal :title="__('Institutes')">
    <x-page-header :title="__('Institutes')" :subtitle="__(':count colleges and schools under this board.', ['count' => number_format($institutes->total())])" />
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name, index no. or district') }}"></div>
        <div class="field"><label class="label" for="district">{{ __('District') }}</label><select id="district" name="district" class="select"><option value="">{{ __('All') }}</option>@foreach ($districts as $d)<option value="{{ $d }}" @selected(request('district') === $d)>{{ $d }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="activity">{{ __('Forms') }}</label><select id="activity" name="activity" class="select"><option value="">{{ __('All') }}</option><option value="with" @selected(request('activity') === 'with')>{{ __('With paid forms') }}</option><option value="without" @selected(request('activity') === 'without')>{{ __('No forms yet') }}</option></select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($institutes->isEmpty())
        <x-empty :title="__('No institutes match')" icon="school">{{ __('Try another search.') }}</x-empty>
    @else
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Index no.') }}</th><th>{{ __('Name') }}</th><th>{{ __('District') }}</th><th class="num">{{ __('Paid forms') }}</th><th class="num">{{ __('With college') }}</th><th class="num">{{ __('Waiting for board') }}</th><th class="num">{{ __('Teachers') }}</th></tr></thead>
            <tbody>
            @foreach ($institutes as $i)
                <tr @class(['opacity-60' => ! $i->is_active])>
                    <td class="tabular-nums whitespace-nowrap">{{ $i->college_no }}</td>
                    <td class="min-w-64"><a href="{{ route('board.institutes.show', $i) }}" class="font-semibold text-ink">{{ $i->name }}</a>@unless ($i->accepting_forms)<span class="badge-muted ml-1">{{ __('Not accepting forms') }}</span>@endunless</td>
                    <td class="text-sm">{{ $i->district ?: '—' }}</td>
                    <td class="num">{{ $i->forms_count ? number_format($i->forms_count) : '—' }}</td>
                    <td class="num">@if ($i->pending_count)<span class="badge-pending">{{ $i->pending_count }}</span>@else — @endif</td>
                    <td class="num">@if ($i->verified_count)<a href="{{ route('board.forms.index', ['institute' => $i->id, 'status' => 'verified']) }}" class="badge-info no-underline">{{ $i->verified_count }}</a>@else — @endif</td>
                    <td class="num">{{ $i->teachers_count ?: '—' }}</td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $institutes->links() }}</div>
    @endif
</x-layouts.portal>
