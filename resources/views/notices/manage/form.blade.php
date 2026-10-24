@php use App\Support\Codes; $editing = $notice->exists; @endphp
<x-layouts.portal :title="$editing ? $notice->title : __('New notice')">
    @push('head')@vite('resources/js/editor.js')@endpush
    <x-page-header :title="$editing ? __('Edit notice') : __('New notice')" :back="route($routePrefix . '.notices.index')" />
    <form method="POST" enctype="multipart/form-data" action="{{ $editing ? route($routePrefix . '.notices.update', $notice) : route($routePrefix . '.notices.store') }}" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad grid gap-5">
            <x-form.input name="title" :label="__('Title')" :value="$notice->title" required />
            <div class="field">
                <label class="label" for="body">{{ __('Details') }}</label>
                <textarea id="body" name="body" data-editor>{{ old('body', $notice->body) }}</textarea>
                @error('body')<p class="error">{{ $message }}</p>@enderror
            </div>
            <x-form.input name="link_url" type="url" :label="__('External link (optional)')" :value="$notice->link_url" placeholder="https://" />
            <div class="field">
                <label class="label" for="attachment">{{ __('Attachment (PDF or image, up to 5 MB)') }}</label>
                <input id="attachment" name="attachment" type="file" accept=".pdf,image/png,image/jpeg" class="input py-2">
                @error('attachment')<p class="error">{{ $message }}</p>@enderror
                @if ($notice->attachment_path)
                    <p class="mt-2 flex items-center gap-3 text-sm"><a href="{{ $notice->attachmentUrl() }}" target="_blank">{{ __('Current attachment') }}</a>
                        <label class="flex items-center gap-2"><input type="checkbox" name="remove_attachment" value="1" class="check"> {{ __('Remove') }}</label></p>
                @endif
            </div>
        </section>
        <aside class="grid gap-6 self-start">
            <section class="sheet sheet-pad grid gap-4">
                @if ($routePrefix === 'admin')
                    <x-form.select name="board_id" :label="__('Board')" :options="\App\Models\Board::orderBy('sort')->pluck('short_name', 'id')" :value="$notice->board_id" :placeholder="__('All boards (site-wide)')" />
                @endif
                <x-form.select name="category" :label="__('Type')" :options="Codes::options(Codes::NOTICE_CATEGORIES)" :value="$notice->category" required />
                <x-form.select name="status" :label="__('Status')" :options="['published' => __('Published'), 'draft' => __('Draft')]" :value="$notice->status" required />
                <x-form.input name="published_at" type="datetime-local" :label="__('Publish from')" :value="$notice->published_at?->format('Y-m-d\TH:i')" />
                <x-form.input name="expires_at" type="datetime-local" :label="__('Hide after (optional)')" :value="$notice->expires_at?->format('Y-m-d\TH:i')" />
                <label class="flex items-center gap-3"><input type="checkbox" name="is_pinned" value="1" class="check" @checked(old('is_pinned', $notice->is_pinned))> {{ __('Pin to top') }}</label>
                <label class="flex items-center gap-3"><input type="checkbox" name="in_ticker" value="1" class="check" @checked(old('in_ticker', $notice->in_ticker))> {{ __('Show in home page ticker') }}</label>
            </section>
            <div class="flex flex-wrap justify-end gap-3">
                @if ($editing)<button form="delete-notice" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Delete') }}</button>@endif
                <button class="btn-primary">{{ __('Save') }}</button>
            </div>
        </aside>
    </form>
    @if ($editing)
        <form id="delete-notice" method="POST" action="{{ route($routePrefix . '.notices.destroy', $notice) }}" onsubmit="return confirm(@js(__('Delete this notice?')))">@csrf @method('DELETE')</form>
    @endif
</x-layouts.portal>
