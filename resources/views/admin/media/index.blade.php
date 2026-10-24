<x-layouts.portal :title="__('Media library')">
    <x-page-header :title="__('Media library')" :subtitle="__('Upload images and PDFs, then copy the link into a page or notice.')" />
    <form method="POST" action="{{ route('admin.media.store') }}" enctype="multipart/form-data" class="sheet sheet-pad mb-6 flex flex-wrap items-end gap-4" x-data="{ n: 0 }">
        @csrf
        <div class="field min-w-0 flex-1 basis-64"><label class="label" for="files">{{ __('Files (images or PDF, up to 5 MB each, 10 at a time)') }}</label>
            <input id="files" name="files[]" type="file" multiple accept="image/*,.pdf" class="input py-2" required @change="n = $event.target.files.length">@error('files.*')<p class="error">{{ $message }}</p>@enderror</div>
        <button class="btn-primary"><x-icon name="upload" />{{ __('Upload') }}<span x-show="n" x-text="'(' + n + ')'"></span></button>
    </form>
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input"></div>
        <div class="field"><label class="label" for="type">{{ __('Type') }}</label><select id="type" name="type" class="select"><option value="">{{ __('All') }}</option><option value="image" @selected(request('type') === 'image')>{{ __('Images') }}</option><option value="pdf" @selected(request('type') === 'pdf')>PDF</option></select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($media->isEmpty())
        <x-empty :title="__('Nothing uploaded yet')" icon="image">{{ __('Uploaded files appear here.') }}</x-empty>
    @else
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        @foreach ($media as $m)
            <figure class="sheet overflow-hidden" x-data="{ copied: false }">
                <div class="grid aspect-[4/3] place-items-center bg-wash">
                    @if ($m->isImage())<img src="{{ $m->url() }}" alt="{{ $m->original_name }}" class="size-full object-cover" loading="lazy">@else<x-icon name="file-text" class="size-10 text-ink-3" />@endif
                </div>
                <figcaption class="p-3">
                    <p class="truncate text-sm font-semibold" title="{{ $m->original_name }}">{{ $m->original_name }}</p>
                    <p class="text-xs muted">{{ number_format($m->size / 1024) }} KB · {{ $m->created_at->format('d M Y') }}</p>
                    <div class="mt-2 flex gap-1">
                        <button type="button" class="btn-secondary btn-sm flex-1" @click="navigator.clipboard.writeText(@js($m->url())); copied = true; setTimeout(() => copied = false, 1500)"><span x-text="copied ? @js(__('Copied')) : @js(__('Copy link'))"></span></button>
                        <form method="POST" action="{{ route('admin.media.destroy', $m) }}" onsubmit="return confirm(@js(__('Delete this file? Links to it will stop working.')))">@csrf @method('DELETE')<button class="btn-quiet btn-sm text-omr" aria-label="{{ __('Delete') }}"><x-icon name="trash-2" /></button></form>
                    </div>
                </figcaption>
            </figure>
        @endforeach
    </div>
    <div class="mt-5">{{ $media->links() }}</div>
    @endif
</x-layouts.portal>
