<x-layouts.portal :title="$material->title">
    <x-page-header :title="$material->title" :subtitle="$material->subject->label . ($material->topic ? ' · ' . $material->topic->label : '') . ' · ' . $material->authorName()" :back="route('learn.materials.index', ['subject' => $material->subject_id])">
        <x-slot:actions>
            <a href="{{ route('learn.practice.create', ['subject' => $material->subject_id, 'topic' => $material->topic_id]) }}" class="btn-rani"><x-icon name="brain" />{{ __('Practise this topic') }}</a>
        </x-slot:actions>
    </x-page-header>
    @if ($material->status !== 'approved')
        <div class="alert-warn mb-5"><x-icon name="clock" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Only you can see this until a teacher approves it.') }}</p></div>
    @endif
    <article class="sheet sheet-pad max-w-4xl">
        @if ($material->description)<p class="lede">{{ $material->description }}</p>@endif
        @if ($material->body)<div class="prose-page mt-5">{!! $material->body !!}</div>@endif
        @if ($url = $material->fileUrl())
            @if (str_ends_with(strtolower($material->file_path), '.pdf'))
                <iframe src="{{ $url }}" class="mt-6 h-[75vh] w-full rounded-lg border border-rule" title="{{ $material->title }}"></iframe>
            @elseif (preg_match('/\.(jpe?g|png)$/i', $material->file_path))
                <img src="{{ $url }}" alt="{{ $material->title }}" class="mt-6 max-w-full rounded-lg border border-rule">
            @endif
            <a href="{{ $url }}" class="btn-secondary mt-4" download="{{ $material->file_name }}"><x-icon name="download" />{{ __('Download') }} {{ $material->file_name }}</a>
        @endif
        @if ($material->link_url)<a href="{{ $material->link_url }}" class="btn-secondary mt-4" target="_blank" rel="noopener nofollow"><x-icon name="external-link" />{{ __('Open link') }}</a>@endif
    </article>
</x-layouts.portal>
