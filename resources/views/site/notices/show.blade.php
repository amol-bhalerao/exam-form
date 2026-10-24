<x-layouts.public :title="$notice->title" :description="\Illuminate\Support\Str::limit(strip_tags((string) $notice->body), 160)" type="article"
    :jsonld="[
        '@context' => 'https://schema.org', '@type' => 'NewsArticle', 'headline' => $notice->title,
        'datePublished' => optional($notice->published_at ?? $notice->created_at)->toIso8601String(),
        'dateModified' => optional($notice->updated_at)->toIso8601String(),
        'mainEntityOfPage' => route('notices.show', $notice),
        'publisher' => ['@type' => 'Organization', 'name' => \App\Models\Setting::get('site_name')],
    ]">
    <article class="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <a href="{{ route('notices.index') }}" class="inline-flex items-center gap-1 text-sm font-semibold no-underline"><x-icon name="arrow-left" class="size-4" />{{ __('All notices') }}</a>
        <p class="mt-6 flex flex-wrap gap-3 text-sm">
            <span class="font-semibold text-[#8a5d00]">{{ $notice->category_label }}</span>
            @if ($notice->board)<span class="text-ink-3">{{ $notice->board->label }}</span>@endif
            <time class="text-ink-3" datetime="{{ ($notice->published_at ?? $notice->created_at)->toDateString() }}">{{ ($notice->published_at ?? $notice->created_at)->translatedFormat('j F Y') }}</time>
        </p>
        <h1 class="display-lg mt-3">{{ $notice->title }}</h1>
        <div class="prose-page mt-6">{!! $notice->body !!}</div>
        @if ($notice->attachment_path || $notice->link_url)
            <div class="mt-8 flex flex-wrap gap-3">
                @if ($notice->attachment_path)<a href="{{ $notice->attachmentUrl() }}" class="btn-primary" target="_blank" rel="noopener"><x-icon name="download" />{{ __('Download attachment') }}</a>@endif
                @if ($notice->link_url)<a href="{{ $notice->link_url }}" class="btn-secondary" target="_blank" rel="noopener"><x-icon name="external-link" />{{ __('Open link') }}</a>@endif
            </div>
        @endif
        @if ($related->isNotEmpty())
            <aside class="mt-14">
                <h2 class="title mb-3">{{ __('More notices') }}</h2>
                @include('site.notices._list', ['notices' => $related])
            </aside>
        @endif
    </article>
</x-layouts.public>
