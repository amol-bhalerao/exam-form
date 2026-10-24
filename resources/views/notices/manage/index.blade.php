@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Notices')">
    <x-page-header :title="__('Notices and circulars')" :subtitle="__('Published on the public website. Pinned notices stay on top; ticker notices scroll on the home page.')">
        <x-slot:actions><a href="{{ route($routePrefix . '.notices.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('New notice') }}</a></x-slot:actions>
    </x-page-header>
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input"></div>
        <div class="field"><label class="label" for="category">{{ __('Type') }}</label><select id="category" name="category" class="select"><option value="">{{ __('All') }}</option>@foreach (Codes::options(Codes::NOTICE_CATEGORIES) as $k => $l)<option value="{{ $k }}" @selected(request('category') === $k)>{{ $l }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($notices->isEmpty())
        <x-empty :title="__('No notices yet')" icon="megaphone">{{ __('Post exam timetables, circulars and news for students and colleges.') }}</x-empty>
    @else
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Title') }}</th><th>{{ __('Type') }}</th><th>{{ __('Published') }}</th><th>{{ __('Status') }}</th><th></th></tr></thead>
            <tbody>
            @foreach ($notices as $n)
                <tr>
                    <td class="min-w-64"><p class="font-semibold">@if ($n->is_pinned)<x-icon name="pin" class="mr-1 inline size-4 text-marigold" />@endif{{ $n->title }}</p>
                        <p class="text-sm muted">@if ($n->in_ticker){{ __('In ticker') }} · @endif @if ($n->attachment_path){{ __('Attachment') }}@endif</p></td>
                    <td class="text-sm">{{ $n->category_label }}</td>
                    <td class="text-sm whitespace-nowrap">{{ $n->published_at?->format('d M Y') }}@if ($n->expires_at)<p class="text-xs muted">{{ __('until :date', ['date' => $n->expires_at->format('d M Y')]) }}</p>@endif</td>
                    <td>@if ($n->status === 'draft')<span class="badge-muted">{{ __('Draft') }}</span>@elseif ($n->expires_at && $n->expires_at->isPast())<span class="badge-muted">{{ __('Expired') }}</span>@elseif ($n->published_at?->isFuture())<span class="badge-info">{{ __('Scheduled') }}</span>@else<span class="badge-ok">{{ __('Live') }}</span>@endif</td>
                    <td class="text-right whitespace-nowrap">
                        @if (Route::has('notices.show'))<a href="{{ route('notices.show', $n->slug) }}" target="_blank" class="btn-quiet btn-sm">{{ __('View') }}</a>@endif
                        <a href="{{ route($routePrefix . '.notices.edit', $n) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a>
                    </td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $notices->links() }}</div>
    @endif
</x-layouts.portal>
