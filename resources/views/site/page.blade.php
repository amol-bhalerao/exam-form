<x-layouts.public :title="$page->seo_title ?: $page->title" :description="$page->seo_description ?: $page->summary" :noindex="$page->noindex"
    :image="$page->hero_image ? asset('storage/' . $page->hero_image) : null"
    :jsonld="['@context' => 'https://schema.org', '@type' => 'WebPage', 'name' => $page->title, 'description' => $page->summary, 'url' => route('page.show', $page->slug), 'dateModified' => optional($page->updated_at)->toIso8601String()]">
    @if ($page->status !== 'published')
        <div class="alert-warn mx-auto mt-6 max-w-5xl">{{ __('Preview: this page is a draft and is not visible to the public.') }}</div>
    @endif
    <article @class(['mx-auto px-4 py-12 sm:px-6', 'max-w-3xl' => $page->layout === 'default', 'max-w-6xl' => $page->layout !== 'default'])>
        @if ($page->parent)<a href="{{ route('page.show', $page->parent->slug) }}" class="text-sm font-semibold no-underline">{{ $page->parent->title }}</a>@endif
        <h1 class="display-xl mt-2">{{ $page->title }}</h1>
        @if ($page->summary)<p class="lede mt-4">{{ $page->summary }}</p>@endif
        @if ($page->hero_image)<img src="{{ asset('storage/' . $page->hero_image) }}" alt="" class="mt-8 w-full rounded-lg border border-rule object-cover" loading="lazy">@endif
        <div @class(['prose-page mt-8', 'max-w-none' => $page->layout !== 'default'])>{!! $page->body !!}</div>
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
