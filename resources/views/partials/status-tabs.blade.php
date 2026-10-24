{{-- Status filter tabs with counts. $route, $counts, $statuses --}}
@php $current = request('status'); @endphp
<nav class="mb-5 flex gap-1 overflow-x-auto border-b border-rule" aria-label="{{ __('Filter by status') }}">
    <a href="{{ route($route, request()->except('status', 'page')) }}" @class(['tab', 'tab-active' => ! $current])>{{ __('All') }}</a>
    @foreach ($statuses as $key)
        <a href="{{ route($route, array_merge(request()->except('page'), ['status' => $key])) }}" @class(['tab', 'tab-active' => $current === $key])>
            {{ __(\App\Support\Codes::STATUSES[$key]) }} <span class="tab-count">{{ $counts[$key] ?? 0 }}</span>
        </a>
    @endforeach
</nav>
