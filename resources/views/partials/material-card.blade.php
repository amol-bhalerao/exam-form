{{-- $m: StudyMaterial; $href: link --}}
@php $kind = $m->file_path ? (str_ends_with(strtolower($m->file_path), '.pdf') ? ['file-text', 'PDF', 'tone-omr'] : (preg_match('/\.(jpe?g|png)$/i', $m->file_path) ? ['image', __('Image'), 'tone-plum'] : ['download', __('File'), 'tone-board'])) : ($m->link_url ? ['external-link', __('Link'), 'tone-mor'] : ['notebook-pen', __('Notes'), 'tone-marigold']); @endphp
<a href="{{ $href }}" class="feature {{ $kind[2] }}" @if (! empty($external)) target="_blank" rel="noopener" @endif>
    <div class="flex items-start gap-3">
        <span class="tone-icon size-10 shrink-0 rounded-lg"><x-icon :name="$kind[0]" class="size-5" /></span>
        <div class="min-w-0 flex-1">
            <p class="font-semibold leading-snug">{{ $m->title }}</p>
            <p class="mt-0.5 text-xs muted">{{ $m->subject->label }}@if ($m->topic) · {{ $m->topic->label }}@endif</p>
        </div>
        <span class="badge-muted text-[0.7rem]">{{ $kind[1] }}</span>
    </div>
    @if ($m->description)<p class="line-clamp-2 text-sm text-ink-2">{{ $m->description }}</p>@endif
    <p class="mt-auto flex items-center gap-1.5 pt-1 text-xs muted">@if ($m->student_id)<x-icon name="graduation-cap" class="size-3.5 text-rani" />@else<x-icon name="user" class="size-3.5" />@endif{{ $m->authorName() }} · <x-icon name="eye" class="size-3.5" />{{ $m->views }}</p>
</a>
