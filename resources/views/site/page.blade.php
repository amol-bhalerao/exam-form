<x-layouts.public :title="$page->seo_title ?: $page->title" :description="$page->seo_description ?: $page->summary" :noindex="$page->noindex"
    :image="$page->hero_image ? asset('storage/' . $page->hero_image) : null"
    :jsonld="['@context' => 'https://schema.org', '@type' => 'WebPage', 'name' => $page->title, 'description' => $page->summary, 'url' => route('page.show', $page->slug), 'dateModified' => optional($page->updated_at)->toIso8601String()]">
    @if ($page->status !== 'published')
        <div class="alert-warn mx-auto mt-6 max-w-5xl">{{ __('Preview: this page is a draft and is not visible to the public.') }}</div>
    @endif
    <x-page-hero :title="$page->title" :lede="$page->summary" :width="$page->layout === 'default' ? 'max-w-3xl' : 'max-w-6xl'">
        <x-slot:before>
            @if ($page->parent)
                <a href="{{ route('page.show', $page->parent->slug) }}" class="mb-2 inline-block text-sm font-semibold text-marigold no-underline hover:text-white">{{ $page->parent->title }}</a>
            @endif
        </x-slot:before>
    </x-page-hero>
    <article @class(['mx-auto px-4 py-10 sm:px-6', 'max-w-3xl' => $page->layout === 'default', 'max-w-6xl' => $page->layout !== 'default'])>
        @if ($page->hero_image)<img src="{{ asset('storage/' . $page->hero_image) }}" alt="" class="mt-8 w-full rounded-lg border border-rule object-cover" loading="lazy">@endif
        <div @class(['prose-page sheet p-6 sm:p-10', 'max-w-none' => $page->layout !== 'default'])>{!! $page->body !!}</div>
        @if ($children->isNotEmpty())
            <div class="mt-12 grid gap-3 sm:grid-cols-2">
                @foreach ($children as $c)
                    <a href="{{ route('page.show', $c->slug) }}" class="group block rounded-lg border border-rule bg-sheet p-5 no-underline hover:border-board">
                        <p class="title text-ink group-hover:text-board">{{ $c->title }}</p>
                        @if ($c->summary)<p class="muted mt-1">{{ $c->summary }}</p>@endif
                    </a>
                @endforeach
            </div>
        @endif
        <p class="muted mt-12 text-sm">{{ __('Last updated :date', ['date' => $page->updated_at->translatedFormat('j F Y')]) }}</p>
    </article>
</x-layouts.public>
