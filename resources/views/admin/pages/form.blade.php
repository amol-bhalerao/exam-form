@php $editing = $page->exists; @endphp
<x-layouts.portal :title="$editing ? $page->title : __('New page')">
    @push('head')@vite('resources/js/editor.js')@endpush
    <x-page-header :title="$editing ? __('Edit page') : __('New page')" :back="route('admin.pages.index')">
        <x-slot:actions>
            @if ($editing)
                <a href="{{ $page->url() }}" target="_blank" class="btn-secondary"><x-icon name="external-link" />{{ $page->status === 'published' ? __('View page') : __('Preview') }}</a>
            @endif
        </x-slot:actions>
    </x-page-header>
    <form method="POST" enctype="multipart/form-data" action="{{ $editing ? route('admin.pages.update', $page) : route('admin.pages.store') }}" class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]"
          x-data="{ title: @js(old('title', $page->title)), slug: @js(old('slug', $page->slug)), touched: @js($editing), seoTitle: @js(old('seo_title', $page->seo_title)), seoDesc: @js(old('seo_description', $page->seo_description)), summary: @js(old('summary', $page->summary)),
                    slugify(v) { return v.toLowerCase().normalize('NFKD').replace(/[^a-z0-9\s-]/g, '').trim().replace(/[\s-]+/g, '-').slice(0, 60) } }">
        @csrf @if ($editing) @method('PUT') @endif
        <div class="grid min-w-0 gap-6">
            <section class="sheet sheet-pad grid gap-5">
                <div class="field"><label class="label" for="title">{{ __('Title') }} <span class="text-omr">*</span></label>
                    <input id="title" name="title" class="input text-lg font-semibold" required maxlength="200" x-model="title" @input="if (!touched) slug = slugify(title)">@error('title')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field"><label class="label" for="slug">{{ __('Web address') }}</label>
                    <div class="flex items-stretch overflow-hidden rounded-md border border-rule-strong bg-sheet focus-within:border-board"><span class="flex items-center bg-wash px-3 text-sm muted whitespace-nowrap border-r border-rule">{{ url('/') }}/</span><input id="slug" name="slug" class="input rounded-none border-0 shadow-none focus:shadow-none" x-model="slug" @input="touched = true" maxlength="120"></div>
                    @error('slug')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field"><label class="label" for="summary">{{ __('Short summary') }}</label><textarea id="summary" name="summary" class="textarea" rows="2" maxlength="300" x-model="summary"></textarea><p class="hint">{{ __('Shown below the title and in search results when no SEO description is set.') }}</p></div>
                <div class="field"><label class="label" for="body">{{ __('Content') }}</label><textarea id="body" name="body" data-editor>{{ old('body', $page->body) }}</textarea></div>
            </section>
            <section class="sheet sheet-pad grid gap-5">
                <h2 class="title">{{ __('Search engine (SEO)') }}</h2>
                <div class="rounded-md border border-rule bg-sheet p-4" aria-label="{{ __('Search result preview') }}">
                    <p class="text-sm text-leaf" x-text="@js(url('/')) + '/' + (slug || '')"></p>
                    <p class="text-lg font-medium text-board" x-text="(seoTitle || title || @js(__('Page title'))).slice(0, 70)"></p>
                    <p class="text-sm text-ink-2" x-text="(seoDesc || summary || @js(__('Description shown in Google results.'))).slice(0, 160)"></p>
                </div>
                <div class="field"><label class="label" for="seo_title">{{ __('SEO title') }}</label><input id="seo_title" name="seo_title" class="input" maxlength="70" x-model="seoTitle"><p class="hint"><span x-text="(seoTitle || '').length"></span>/70</p></div>
                <div class="field"><label class="label" for="seo_description">{{ __('SEO description') }}</label><textarea id="seo_description" name="seo_description" class="textarea" rows="2" maxlength="300" x-model="seoDesc"></textarea><p class="hint"><span x-text="(seoDesc || '').length"></span>/160 {{ __('recommended') }}</p></div>
                <x-form.input name="seo_keywords" :label="__('Keywords (comma separated)')" :value="$page->seo_keywords" />
                <label class="flex items-center gap-3"><input type="checkbox" name="noindex" value="1" class="check" @checked(old('noindex', $page->noindex))> {{ __('Hide this page from search engines') }}</label>
            </section>
        </div>
        <aside class="grid gap-6 self-start lg:sticky lg:top-24">
            <section class="sheet sheet-pad grid gap-4">
                <x-form.select name="status" :label="__('Status')" :options="['draft' => __('Draft'), 'published' => __('Published')]" :value="$page->status" required />
                <x-form.input name="published_at" type="datetime-local" :label="__('Publish from')" :value="$page->published_at?->format('Y-m-d\TH:i')" />
                <x-form.select name="layout" :label="__('Layout')" :options="['default' => __('Reading width'), 'wide' => __('Wide'), 'landing' => __('Landing (full width)')]" :value="$page->layout" required />
                <x-form.select name="parent_id" :label="__('Parent page')" :options="$parents" :value="$page->parent_id" :placeholder="__('None')" />
            </section>
            <section class="sheet sheet-pad grid gap-3">
                <h2 class="font-semibold">{{ __('Menu') }}</h2>
                <label class="flex items-center gap-3"><input type="checkbox" name="in_header" value="1" class="check" @checked(old('in_header', $page->in_header))> {{ __('Show in header menu') }}</label>
                <label class="flex items-center gap-3"><input type="checkbox" name="in_footer" value="1" class="check" @checked(old('in_footer', $page->in_footer))> {{ __('Show in footer') }}</label>
                <x-form.input name="menu_order" type="number" :label="__('Menu order')" :value="$page->menu_order" min="0" />
            </section>
            <section class="sheet sheet-pad grid gap-3">
                <h2 class="font-semibold">{{ __('Banner image') }}</h2>
                @if ($page->hero_image)<img src="{{ asset('storage/' . $page->hero_image) }}" alt="" class="rounded-md border border-rule"><label class="flex items-center gap-2 text-sm"><input type="checkbox" name="remove_hero" value="1" class="check"> {{ __('Remove') }}</label>@endif
                <input name="hero" type="file" accept="image/*" class="input py-2" aria-label="{{ __('Banner image') }}">@error('hero')<p class="error">{{ $message }}</p>@enderror
            </section>
            <div class="flex flex-wrap justify-end gap-3">
                @if ($editing)<button form="delete-page" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Delete') }}</button>@endif
                <button class="btn-primary">{{ __('Save page') }}</button>
            </div>
        </aside>
    </form>
    @if ($editing)<form id="delete-page" method="POST" action="{{ route('admin.pages.destroy', $page) }}" onsubmit="return confirm(@js(__('Delete this page?')))">@csrf @method('DELETE')</form>@endif
</x-layouts.portal>
