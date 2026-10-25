<x-layouts.portal :title="__('Share my notes')">
    @push('head')@vite('resources/js/editor.js')@endpush
    <x-page-header :title="__('Share my notes')" :subtitle="__('Write your notes or upload a PDF / photo of them. A teacher of your college checks them, then everyone can learn from them.')" :back="route('learn.materials.index')" />
    <form method="POST" action="{{ route('learn.materials.store') }}" enctype="multipart/form-data" class="grid max-w-4xl gap-6" x-data="{ subject: @js((string) old('subject_id', $subjectId)), topics: @js($topics) }">
        @csrf
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <div class="field"><label class="label" for="subject_id">{{ __('Subject') }}<span class="req"> *</span></label><select id="subject_id" name="subject_id" class="select" x-model="subject" required><option value="">{{ __('Select') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}">{{ $s->label }}</option>@endforeach</select>@error('subject_id')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field"><label class="label" for="topic_id">{{ __('Topic') }}</label><select id="topic_id" name="topic_id" class="select"><option value="">{{ __('General') }}</option><template x-for="t in (topics[subject] || [])" :key="t.id"><option :value="t.id" x-text="t.label" :selected="String(t.id) === @js((string) old('topic_id'))"></option></template></select></div>
                <x-form.input name="title" :label="__('Title')" required maxlength="200" span :placeholder="__('e.g. Laws of motion — one-page summary')" />
                <x-form.textarea name="description" :label="__('Short description')" rows="2" maxlength="1000" />
                <div class="field span-2"><label class="label" for="body">{{ __('Notes') }}</label><textarea id="body" name="body" data-editor>{{ old('body') }}</textarea>@error('body')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field span-2"><label class="label" for="file">{{ __('Or attach a PDF / photo') }}</label><input id="file" name="file" type="file" accept=".pdf,.jpg,.jpeg,.png" class="input"><p class="hint">{{ __('Up to 8 MB.') }}</p>@error('file')<p class="error">{{ $message }}</p>@enderror</div>
            </div>
        </section>
        <div><button class="btn-primary"><x-icon name="send" />{{ __('Send for review') }}</button></div>
    </form>
</x-layouts.portal>
