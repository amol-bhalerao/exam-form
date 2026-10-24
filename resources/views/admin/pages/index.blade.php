<x-layouts.portal :title="__('Pages')">
    <x-page-header :title="__('Website pages')" :subtitle="__('Create as many pages as you need. Tick “header” or “footer” to place a page in the site menu.')">
        <x-slot:actions><a href="{{ route('admin.pages.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('New page') }}</a></x-slot:actions>
    </x-page-header>
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input"></div>
        <div class="field"><label class="label" for="status">{{ __('Status') }}</label><select id="status" name="status" class="select"><option value="">{{ __('All') }}</option><option value="published" @selected(request('status') === 'published')>{{ __('Published') }}</option><option value="draft" @selected(request('status') === 'draft')>{{ __('Draft') }}</option></select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($pages->isEmpty())
        <x-empty :title="__('No pages yet')" icon="layout-template">{{ __('Start with About, How to apply or Contact.') }}</x-empty>
    @else
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Title') }}</th><th>{{ __('Address') }}</th><th>{{ __('Menu') }}</th><th>{{ __('Status') }}</th><th>{{ __('Updated') }}</th><th></th></tr></thead>
            <tbody>
            @foreach ($pages as $p)
                <tr>
                    <td class="min-w-56"><a href="{{ route('admin.pages.edit', $p) }}" class="font-semibold text-ink">{{ $p->title }}</a>@if ($p->parent)<p class="text-sm muted">{{ __('Under :page', ['page' => $p->parent->title]) }}</p>@endif</td>
                    <td class="text-sm"><code>/{{ $p->slug }}</code></td>
                    <td class="text-sm">{{ collect([$p->in_header ? __('Header') : null, $p->in_footer ? __('Footer') : null])->filter()->implode(', ') ?: '—' }}</td>
                    <td>@if ($p->status === 'published')<span class="badge-ok">{{ __('Published') }}</span>@else<span class="badge-muted">{{ __('Draft') }}</span>@endif @if ($p->noindex)<span class="badge-muted">noindex</span>@endif</td>
                    <td class="text-sm whitespace-nowrap">{{ $p->updated_at?->diffForHumans() }}</td>
                    <td class="text-right whitespace-nowrap"><a href="{{ $p->url() }}" target="_blank" class="btn-quiet btn-sm">{{ __('View') }}</a><a href="{{ route('admin.pages.edit', $p) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a></td>
                </tr>
            @endforeach
            </tbody>
        </table>
    </div>
    @endif
</x-layouts.portal>
