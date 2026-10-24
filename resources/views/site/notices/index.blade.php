<x-layouts.public :title="__('Notices')" :description="__('Board notices, circulars, timetables and results for HSC and SSC candidates.')">
    <div class="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <h1 class="display-xl">{{ __('Notices') }}</h1>
        <p class="lede mt-3">{{ __('Circulars, timetables and announcements from the board.') }}</p>
        <form method="GET" class="mt-8 flex flex-wrap gap-2" aria-label="{{ __('Filter notices') }}">
            <a href="{{ route('notices.index', array_filter(['board' => $board])) }}" @class(['chip no-underline', 'border-transparent bg-gradient-to-r from-rani to-plum text-white hover:text-white' => ! $category])>{{ __('All') }}</a>
            @foreach (\App\Support\Codes::NOTICE_CATEGORIES as $key => $label)
                <a href="{{ route('notices.index', array_filter(['category' => $key, 'board' => $board])) }}" @class(['chip no-underline', 'border-transparent bg-gradient-to-r from-rani to-plum text-white hover:text-white' => $category === $key])>{{ __($label) }}</a>
            @endforeach
            <span class="mx-1 hidden w-px bg-rule sm:block"></span>
            @foreach ($boards as $b)
                <a href="{{ route('notices.index', array_filter(['category' => $category, 'board' => $board === $b->code ? null : $b->code])) }}" @class(['chip no-underline', 'border-board bg-board-soft text-board' => $board === $b->code])>{{ $b->short_name }}</a>
            @endforeach
        </form>
        <div class="mt-8">
            @include('site.notices._list', ['notices' => $notices])
            <div class="mt-6">{{ $notices->links() }}</div>
        </div>
    </div>
</x-layouts.public>
