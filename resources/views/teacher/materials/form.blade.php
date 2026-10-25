<x-layouts.portal :title="$material->exists ? __('Edit material') : __('Add material')">
    @push('head')@vite('resources/js/editor.js')@endpush
    <x-page-header :title="$material->exists ? __('Edit material') : __('Add study material')" :back="route('teacher.materials.index')" />
    <form method="POST" action="{{ $material->exists ? route('teacher.materials.update', $material) : route('teacher.materials.store') }}" enctype="multipart/form-data" class="grid max-w-4xl gap-6"
          x-data="{ subject: @js((string) old('subject_id', $material->subject_id)), topics: @js($topics) }">
        @csrf @if ($material->exists) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <div class="field"><label class="label" for="subject_id">{{ __('Subject') }}<span class="req"> *</span></label><select id="subject_id" name="subject_id" class="select" x-model="subject" required><option value="">{{ __('Select') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}">{{ $s->code }} · {{ $s->label }}</option>@endforeach</select>@error('subject_id')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field"><label class="label" for="topic_id">{{ __('Topic') }}</label><select id="topic_id" name="topic_id" class="select"><option value="">{{ __('General') }}</option><template x-for="t in (topics[subject] || [])" :key="t.id"><option :value="t.id" x-text="t.label" :selected="String(t.id) === @js((string) old('topic_id', $material->topic_id))"></option></template></select></div>
                <x-form.input name="title" :label="__('Title')" :value="$material->title" required maxlength="200" span />
                <x-form.textarea name="description" :label="__('Short description')" :value="$material->description" rows="2" maxlength="1000" />
                <div class="field span-2"><label class="label" for="body">{{ __('Notes') }}</label><textarea id="body" name="body" data-editor>{{ old('body', $material->body) }}</textarea></div>
                <div class="field"><label class="label" for="file">{{ __('Attach a file') }}</label><input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.ppt,.pptx" class="input"><p class="hint">{{ $material->file_name ? __('Current: :f', ['f' => $material->file_name]) : __('PDF, image, Word or PowerPoint, up to 10 MB.') }}</p>@error('file')<p class="error">{{ $message }}</p>@enderror</div>
                <x-form.input name="link_url" type="url" :label="__('Or a link (YouTube, website)')" :value="$material->link_url" placeholder="https://" />
            </div>
        </section>
        <div class="flex flex-wrap gap-3">
            <button class="btn-primary"><x-icon name="check" />{{ __('Publish') }}</button>
        </div>
    </form>
    @if ($material->exists)
        <form method="POST" action="{{ route('teacher.materials.destroy', $material) }}" class="mt-4" onsubmit="return confirm(@js(__('Remove this material?')))">@csrf @method('DELETE')<button class="btn-quiet text-omr"><x-icon name="trash-2" />{{ __('Remove') }}</button></form>
    @endif
</x-layouts.portal>
