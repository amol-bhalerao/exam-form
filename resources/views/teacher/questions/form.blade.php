<x-layouts.portal :title="$question->exists ? __('Edit question') : __('Add question')">
    <x-page-header :title="$question->exists ? __('Edit question') : __('Add question')" :back="route('teacher.questions.index', ['subject' => $question->subject_id])" />
    @if ($question->exists && $question->status === 'pending')
        <div class="alert-info mb-5"><x-icon name="info" class="mt-0.5 size-5 shrink-0" /><p>{{ __('This question is waiting for review. Saving your changes approves it and makes it live for students.') }}</p></div>
    @endif
    <form method="POST" action="{{ $question->exists ? route('teacher.questions.update', $question) : route('teacher.questions.store') }}" class="grid max-w-4xl gap-6">
        @csrf @if ($question->exists) @method('PUT') @endif
        @include('partials.question-fields')
        <div class="flex flex-wrap gap-3">
            <button class="btn-primary"><x-icon name="check" />{{ __('Save question') }}</button>
            @unless ($question->exists)<button name="after" value="another" class="btn-secondary"><x-icon name="plus" />{{ __('Save and add another') }}</button>@endunless
        </div>
    </form>
</x-layouts.portal>
