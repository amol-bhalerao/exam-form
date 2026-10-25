@php use App\Models\Question; @endphp
<x-layouts.portal :title="__('Practise')">
    <x-page-header :title="__('Build your practice set')" :subtitle="__('Choose the subject, chapters, level and question types. Every set is shuffled — wrong options change each time.')">
        <x-slot:actions>@include('learn._learner')</x-slot:actions>
    </x-page-header>

    @if ($subjects->isEmpty())
        <x-empty :title="__('Questions are being added')" icon="circle-help">{{ __('Your teachers are adding questions. Check back soon.') }}</x-empty>
    @else
    <form method="POST" action="{{ route('learn.practice.store') }}" class="grid max-w-5xl gap-6"
          x-data="{ subject: @js((string) old('subject_id', $subjectId)), topics: @js($topics), picked: @js(array_map('strval', old('topic_ids', $topicId ? [$topicId] : []))),
                    count: {{ (int) old('count', 10) }}, minutes: {{ (int) old('minutes', 0) }}, difficulty: @js(old('difficulty', 'mixed')),
                    preset(c, m, d) { this.count = c; this.minutes = m; this.difficulty = d; },
                    get available() { const list = this.topics[this.subject] || []; return (this.picked.length ? list.filter(t => this.picked.includes(String(t.id))) : list).reduce((a, t) => a + t.n, 0); } }">
        @csrf
        <section class="sheet sheet-pad">
            <h2 class="title mb-4">{{ __('1. Subject') }}</h2>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($subjects as $s)
                    <label class="subject-chip" :aria-pressed="subject === '{{ $s->id }}'">
                        <input type="radio" name="subject_id" value="{{ $s->id }}" x-model="subject" class="sr-only" @change="picked = []">
                        <span class="box"><x-icon name="check" class="size-3.5" /></span>
                        <span class="min-w-0"><span class="block truncate font-semibold">{{ $s->label }}</span><span class="text-xs muted">{{ $s->code }} · {{ $s->questions_count }} {{ __('questions') }}</span></span>
                    </label>
                @endforeach
            </div>
        </section>

        <section class="sheet sheet-pad" x-show="subject">
            <div class="mb-1 flex flex-wrap items-center justify-between gap-2">
                <h2 class="title">{{ __('2. Chapters / topics') }}</h2>
                <button type="button" class="text-sm font-semibold" @click="picked = []">{{ __('All topics') }}</button>
            </div>
            <p class="mb-4 text-sm muted">{{ __('Leave all unticked to practise the whole subject.') }}</p>
            <div class="flex flex-wrap gap-2">
                <template x-for="t in (topics[subject] || [])" :key="t.id">
                    <label class="chip cursor-pointer has-[input:checked]:border-board has-[input:checked]:bg-board-soft has-[input:checked]:font-semibold has-[input:checked]:text-board-deep">
                        <input type="checkbox" name="topic_ids[]" :value="t.id" x-model="picked" class="sr-only"><span x-text="t.label"></span><span class="text-xs muted" x-text="t.n"></span>
                    </label>
                </template>
            </div>
        </section>

        <section class="sheet sheet-pad" x-show="subject">
            <h2 class="title mb-4">{{ __('3. How hard, how many, how fast') }}</h2>
            <div class="mb-5 grid gap-2 sm:grid-cols-3">
                <button type="button" class="feature tone-mor text-left" @click="preset(10, 0, 'mixed')"><p class="font-semibold"><x-icon name="zap" class="inline size-4" /> {{ __('Quick revision') }}</p><p class="text-xs muted">{{ __('10 questions · no timer · check each answer') }}</p></button>
                <button type="button" class="feature tone-board text-left" @click="preset(20, 15, 'mixed')"><p class="font-semibold"><x-icon name="timer" class="inline size-4" /> {{ __('Exam rehearsal') }}</p><p class="text-xs muted">{{ __('20 questions · 15 minutes') }}</p></button>
                <button type="button" class="feature tone-rani text-left" @click="preset(25, 20, 'hard')"><p class="font-semibold"><x-icon name="trophy" class="inline size-4" /> {{ __('Challenge') }}</p><p class="text-xs muted">{{ __('25 hard questions · 20 minutes') }}</p></button>
            </div>
            <div class="fieldset">
                <div class="field"><span class="label">{{ __('Level') }}</span>
                    <div class="flex flex-wrap gap-2">
                        @foreach (['mixed' => __('All levels')] + array_map('__', Question::LEVELS) as $k => $l)
                            <label class="chip cursor-pointer has-[input:checked]:border-rani has-[input:checked]:bg-rani-soft has-[input:checked]:font-semibold has-[input:checked]:text-rani"><input type="radio" name="difficulty" value="{{ $k }}" x-model="difficulty" class="sr-only">{{ $l }}</label>
                        @endforeach
                    </div></div>
                <div class="field"><span class="label">{{ __('Question types') }}</span>
                    <div class="flex flex-wrap gap-2">
                        @foreach (Question::TYPES as $k => $l)
                            <label class="chip cursor-pointer has-[input:checked]:border-mor has-[input:checked]:bg-mor-soft has-[input:checked]:font-semibold has-[input:checked]:text-mor"><input type="checkbox" name="types[]" value="{{ $k }}" class="sr-only" @checked(in_array($k, old('types', [])))>{{ __($l) }}</label>
                        @endforeach
                    </div><p class="hint">{{ __('None ticked = all types.') }}</p></div>
                <div class="field"><label class="label" for="count">{{ __('Number of questions') }}: <b x-text="count"></b></label>
                    <input id="count" name="count" type="range" min="5" max="50" step="5" x-model.number="count" class="w-full accent-[var(--color-rani)]">
                    <p class="hint"><span x-text="available"></span> {{ __('questions available for this choice') }}</p></div>
                <div class="field"><label class="label" for="minutes">{{ __('Timer') }}: <b x-text="minutes ? minutes + ' ' + @js(__('min')) : @js(__('No timer'))"></b></label>
                    <input id="minutes" name="minutes" type="range" min="0" max="120" step="5" x-model.number="minutes" class="w-full accent-[var(--color-board)]"></div>
            </div>
        </section>

        <div x-show="subject"><button class="btn-rani text-lg"><x-icon name="play" />{{ __('Start practice') }}</button></div>
    </form>
    @endif
</x-layouts.portal>
