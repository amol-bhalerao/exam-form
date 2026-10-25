{{-- Shared question editor (teacher and student). Needs: $question, $subjects, $topics (subject_id => [{id,label}]), $tip. --}}
@php
    use App\Models\Question;
    $opts = old('options', $question->exists && $question->type !== 'true_false'
        ? $question->options->map(fn ($o) => ['text' => $o->text, 'correct' => $o->is_correct])->all()
        : []);
    $opts = collect($opts)->map(fn ($o) => ['text' => (string) ($o['text'] ?? ''), 'correct' => (bool) ($o['correct'] ?? false)])->values()->all();
    $tf = old('tf_answer', $question->type === 'true_false' ? $question->options->firstWhere('is_correct', true)?->text : null);
@endphp
<div x-data="questionEditor({
        type: @js(old('type', $question->type ?? 'single')),
        subject: @js((string) old('subject_id', $question->subject_id)),
        topic: @js((string) old('topic_id', $question->topic_id)),
        topics: @js($topics),
        options: @js($opts),
    })" class="grid gap-6">
    <section class="sheet sheet-pad">
        <h2 class="title mb-5">{{ __('Where it belongs') }}</h2>
        <div class="fieldset">
            <div class="field"><label class="label" for="subject_id">{{ __('Subject') }}<span class="req"> *</span></label>
                <select id="subject_id" name="subject_id" class="select" x-model="subject" required>
                    <option value="">{{ __('Select') }}</option>
                    @foreach ($subjects as $s)<option value="{{ $s->id }}">{{ $s->code }} · {{ $s->label }}</option>@endforeach
                </select>@error('subject_id')<p class="error">{{ $message }}</p>@enderror</div>
            <div class="field"><label class="label" for="topic_id">{{ __('Topic / chapter') }}</label>
                <select id="topic_id" name="topic_id" class="select" x-model="topic">
                    <option value="">{{ __('New topic or none') }}</option>
                    <template x-for="t in (topics[subject] || [])" :key="t.id"><option :value="String(t.id)" x-text="t.label" :selected="String(t.id) === topic"></option></template>
                </select></div>
            <div class="field" x-show="!topic"><label class="label" for="new_topic">{{ __('New topic name') }}</label><input id="new_topic" name="new_topic" value="{{ old('new_topic') }}" class="input" maxlength="150" placeholder="{{ __('Leave blank if not needed') }}"></div>
            <div class="field"><label class="label" for="difficulty">{{ __('Level') }}</label>
                <select id="difficulty" name="difficulty" class="select">@foreach (Question::LEVELS as $k => $l)<option value="{{ $k }}" @selected(old('difficulty', $question->difficulty ?? 'medium') === $k)>{{ __($l) }}</option>@endforeach</select></div>
        </div>
    </section>

    <section class="sheet sheet-pad">
        <h2 class="title mb-4">{{ __('Question type') }}</h2>
        <div class="grid gap-2 sm:grid-cols-4" role="radiogroup">
            @foreach (Question::TYPES as $k => $l)
                <label class="flex min-h-12 cursor-pointer items-center gap-2 rounded-md border-2 border-rule-strong px-3 font-semibold has-[input:checked]:border-board has-[input:checked]:bg-board-soft has-[input:checked]:text-board-deep">
                    <input type="radio" name="type" value="{{ $k }}" x-model="type" class="sr-only"><x-icon :name="['single' => 'circle-check', 'multi' => 'list-checks', 'true_false' => 'check', 'fill_blank' => 'pencil'][$k]" class="size-5" />{{ __($l) }}
                </label>
            @endforeach
        </div>
        <div class="mt-5 field">
            <label class="label" for="text">{{ __('Question') }}<span class="req"> *</span></label>
            <textarea id="text" name="text" rows="3" class="textarea" required maxlength="2000">{{ old('text', $question->text) }}</textarea>
            <p class="hint" x-show="type === 'fill_blank'">{{ __('Type ____ (four underscores) where the blank goes. Example: The SI unit of force is ____.') }}</p>
            <p class="hint" x-show="type === 'true_false'">{{ __('Write a statement that is either true or false.') }}</p>
            @error('text')<p class="error">{{ $message }}</p>@enderror
        </div>
    </section>

    <section class="sheet sheet-pad">
        <div x-show="type === 'true_false'">
            <h2 class="title mb-4">{{ __('Correct answer') }}</h2>
            <div class="flex gap-3">
                @foreach (['True' => __('True'), 'False' => __('False')] as $k => $l)
                    <label class="flex min-h-12 flex-1 cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-rule-strong font-bold has-[input:checked]:border-leaf has-[input:checked]:bg-leaf-soft has-[input:checked]:text-leaf sm:flex-none sm:px-10">
                        <input type="radio" name="tf_answer" value="{{ $k }}" class="sr-only" @checked($tf === $k)>{{ $l }}</label>
                @endforeach
            </div>
        </div>

        <div x-show="type !== 'true_false'">
            <div class="mb-1 flex flex-wrap items-center justify-between gap-3">
                <h2 class="title" x-text="type === 'fill_blank' ? @js(__('Accepted answers')) : @js(__('Answer options'))"></h2>
                <button type="button" class="btn-secondary btn-sm" @click="add()"><x-icon name="plus" /><span x-text="type === 'fill_blank' ? @js(__('Add another accepted answer')) : @js(__('Add option'))"></span></button>
            </div>
            <p class="mb-4 text-sm muted" x-show="type === 'single'">{{ __('Tick the one correct answer. Add many wrong answers (5–8 is ideal): each time a student sees this question, three wrong answers are picked at random and shuffled with the correct one.') }}</p>
            <p class="mb-4 text-sm muted" x-show="type === 'multi'">{{ __('Tick every correct answer (at least two) and add wrong ones. Students must pick all the correct answers and no wrong one.') }}</p>
            <p class="mb-4 text-sm muted" x-show="type === 'fill_blank'">{{ __('Every spelling you will accept. Capital letters and extra spaces are ignored.') }}</p>
            <ol class="grid gap-2">
                <template x-for="(o, i) in options" :key="i">
                    <li class="flex items-center gap-2">
                        <label class="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md border border-rule-strong px-2.5 text-sm font-semibold" :class="o.correct || type === 'fill_blank' ? 'border-leaf bg-leaf-soft text-leaf' : ''" x-show="type !== 'fill_blank'">
                            <input :type="type === 'single' ? 'radio' : 'checkbox'" class="check" :checked="o.correct" @change="mark(i, $event.target.checked)">
                            <span x-text="o.correct ? @js(__('Correct')) : @js(__('Wrong'))"></span>
                        </label>
                        <input type="hidden" :name="`options[${i}][correct]`" :value="(o.correct || type === 'fill_blank') ? 1 : 0">
                        <input class="input flex-1" :name="`options[${i}][text]`" x-model="o.text" maxlength="500" :placeholder="type === 'fill_blank' ? @js(__('Accepted answer')) : (o.correct ? @js(__('Correct answer')) : @js(__('Wrong answer')))">
                        <button type="button" class="btn-quiet btn-sm text-omr" @click="options.splice(i, 1)" :aria-label="@js(__('Remove'))"><x-icon name="x" /></button>
                    </li>
                </template>
            </ol>
        </div>
        @error('options')<p class="error mt-3">{{ $message }}</p>@enderror
    </section>

    <section class="sheet sheet-pad">
        <h2 class="title mb-1">{{ __('Help students learn') }}</h2>
        <p class="mb-5 text-sm muted">{{ __('Shown after the student answers.') }}</p>
        <div class="fieldset">
            <x-form.textarea name="explanation" :label="__('Explanation — why this answer is correct')" :value="$question->explanation" rows="3" maxlength="2000" />
            <x-form.textarea name="tip" :label="__('Memory tip — a short trick to remember the answer')" :value="$tip" rows="2" maxlength="500" :hint="__('Example: “King Henry Died By Drinking Chocolate Milk” for kilo, hecto, deca, base, deci, centi, milli.')" />
        </div>
    </section>
</div>
