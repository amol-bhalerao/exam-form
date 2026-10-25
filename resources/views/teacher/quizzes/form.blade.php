@php use App\Models\Question; $editing = $quiz->exists; @endphp
<x-layouts.portal :title="$editing ? __('Edit test') : __('Schedule a test')">
    <x-page-header :title="$editing ? __('Edit test') : __('Schedule a test')" :back="$editing ? route('teacher.quizzes.show', $quiz) : route('teacher.quizzes.index')" />
    @if ($locked)
        <div class="alert-warn mb-5"><x-icon name="lock" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Students have started this test. You can change only the title, instructions, end time, answer display and certificate design.') }}</p></div>
    @endif
    <form method="POST" action="{{ $editing ? route('teacher.quizzes.update', $quiz) : route('teacher.quizzes.store') }}" class="grid max-w-4xl gap-6"
          x-data="{ subject: @js((string) old('subject_id', $quiz->subject_id)), topics: @js($topics), picked: @js(array_map('strval', old('topic_ids', $quiz->topic_ids ?? []))),
                    get available() { const l = this.topics[this.subject] || []; return (this.picked.length ? l.filter(t => this.picked.includes(String(t.id))) : l).reduce((a, t) => a + t.n, 0); } }">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Test details') }}</h2>
            <div class="fieldset">
                <x-form.input name="title" :label="__('Test name')" :value="$quiz->title" required maxlength="200" span :placeholder="__('e.g. Unit Test 1 — Physics')" />
                <div class="field"><label class="label" for="subject_id">{{ __('Subject') }}<span class="req"> *</span></label>
                    <select id="subject_id" name="subject_id" class="select" x-model="subject" required @change="picked = []" @disabled($locked)><option value="">{{ __('Select') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}">{{ $s->code }} · {{ $s->label }} ({{ $s->questions_count }})</option>@endforeach</select>
                    @if ($locked)<input type="hidden" name="subject_id" value="{{ $quiz->subject_id }}">@endif
                    @error('subject_id')<p class="error">{{ $message }}</p>@enderror</div>
                <x-form.select name="stream_id" :label="__('For students of')" :options="$streams->mapWithKeys(fn ($s) => [$s->id => $s->label])" :value="$quiz->stream_id" :placeholder="__('All streams')" />
                <x-form.textarea name="instructions" :label="__('Instructions for students')" :value="$quiz->instructions" rows="3" maxlength="2000" />
            </div>
        </section>

        <section class="sheet sheet-pad" x-show="subject">
            <h2 class="title mb-1">{{ __('Questions') }}</h2>
            <p class="mb-4 text-sm muted">{{ __('Each student gets a random set from these choices, with options shuffled — neighbours will not have the same paper.') }}</p>
            <div class="field"><span class="label">{{ __('Topics') }}</span>
                <div class="flex flex-wrap gap-2">
                    <template x-for="t in (topics[subject] || [])" :key="t.id">
                        <label class="chip cursor-pointer has-[input:checked]:border-board has-[input:checked]:bg-board-soft has-[input:checked]:font-semibold"><input type="checkbox" name="topic_ids[]" :value="t.id" x-model="picked" class="sr-only" @disabled($locked)><span x-text="t.label"></span><span class="text-xs muted" x-text="t.n"></span></label>
                    </template>
                </div><p class="hint">{{ __('None ticked = whole subject.') }} <span x-text="available"></span> {{ __('questions available.') }}</p>
                @error('topic_ids')<p class="error">{{ $message }}</p>@enderror</div>
            <div class="mt-4 fieldset">
                <div class="field"><span class="label">{{ __('Question types') }}</span><div class="flex flex-wrap gap-2">@foreach (Question::TYPES as $k => $l)<label class="chip cursor-pointer has-[input:checked]:border-mor has-[input:checked]:bg-mor-soft has-[input:checked]:font-semibold"><input type="checkbox" name="types[]" value="{{ $k }}" class="sr-only" @checked(in_array($k, old('types', $quiz->types ?? []))) @disabled($locked)>{{ __($l) }}</label>@endforeach</div><p class="hint">{{ __('None ticked = all types.') }}</p></div>
                <x-form.select name="difficulty" :label="__('Level')" :options="['mixed' => __('Mixed')] + array_map('__', Question::LEVELS)" :value="$quiz->difficulty" required />
                <x-form.input name="question_count" type="number" :label="__('Number of questions')" :value="$quiz->question_count" min="1" max="200" required />
                <x-form.input name="duration_minutes" type="number" :label="__('Time allowed (minutes)')" :value="$quiz->duration_minutes" min="1" max="300" required />
            </div>
        </section>

        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('When and marks') }}</h2>
            <div class="fieldset">
                <x-form.input name="starts_at" type="datetime-local" :label="__('Opens at')" :value="$quiz->starts_at?->format('Y-m-d\TH:i')" required />
                <x-form.input name="ends_at" type="datetime-local" :label="__('Closes at')" :value="$quiz->ends_at?->format('Y-m-d\TH:i')" required :hint="__('Students can start any time in this window. The timer never runs past the closing time.')" />
                <x-form.input name="marks_per_question" type="number" step="0.25" :label="__('Marks per correct answer')" :value="$quiz->marks_per_question" min="0.25" max="20" required />
                <x-form.input name="negative_marks" type="number" step="0.25" :label="__('Marks cut per wrong answer')" :value="$quiz->negative_marks" min="0" max="10" :hint="__('0 = no negative marking')" />
                <x-form.input name="pass_percent" type="number" :label="__('Pass mark (%)')" :value="$quiz->pass_percent" min="0" max="100" required />
                <x-form.input name="max_warnings" type="number" :label="__('Warnings before the test ends')" :value="$quiz->max_warnings" min="0" max="5" required :hint="__('Leaving the test page more than this many times ends the test. Closing the page always ends it.')" />
            </div>
            <label class="mt-5 flex items-center gap-2 font-semibold"><input type="hidden" name="show_answers_after" value="0"><input type="checkbox" name="show_answers_after" value="1" class="check" @checked(old('show_answers_after', $quiz->show_answers_after))>{{ __('Show correct answers and explanations to students after the test closes') }}</label>
        </section>

        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ __('Certificate design') }}</h2>
            <p class="mb-4 text-sm muted">{{ __('You can change it later when you print the certificates.') }}</p>
            @include('teacher.quizzes._templates', ['current' => old('certificate_template', $quiz->certificate_template ?? 'paithani')])
        </section>

        <div class="flex flex-wrap gap-3">
            <button name="publish" value="1" class="btn-primary"><x-icon name="send" />{{ $editing && $quiz->status === 'published' ? __('Save') : __('Publish to students') }}</button>
            @if (! $editing || $quiz->status === 'draft')<button name="publish" value="0" class="btn-secondary"><x-icon name="check" />{{ __('Save as draft') }}</button>@endif
        </div>
    </form>
    @if ($editing && ! $locked)
        <form method="POST" action="{{ route('teacher.quizzes.destroy', $quiz) }}" class="mt-4" onsubmit="return confirm(@js(__('Delete this test?')))">@csrf @method('DELETE')<button class="btn-quiet text-omr"><x-icon name="trash-2" />{{ __('Delete test') }}</button></form>
    @endif
</x-layouts.portal>
