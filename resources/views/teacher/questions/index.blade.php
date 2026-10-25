@php use App\Models\Question; @endphp
<x-layouts.portal :title="__('Question bank')">
    <x-page-header :title="__('Question bank')" :subtitle="__('Questions shared by all teachers and approved student contributions. Students practise from here; tests pick from here.')">
        <x-slot:actions>
            <a href="{{ route('teacher.questions.create', ['subject' => $subject?->id, 'topic' => request('topic')]) }}" class="btn-primary"><x-icon name="plus" />{{ __('Add question') }}</a>
        </x-slot:actions>
    </x-page-header>

    <form method="GET" class="filters">
        <div class="field"><label class="label" for="subject">{{ __('Subject') }}</label>
            <select id="subject" name="subject" class="select" onchange="this.form.topic && (this.form.topic.value=''); this.form.submit()">
                @foreach ($subjects as $s)<option value="{{ $s->id }}" @selected($subject?->id === $s->id)>{{ $s->code }} · {{ $s->label }} ({{ $s->questions_count }})</option>@endforeach
            </select></div>
        <div class="field"><label class="label" for="topic">{{ __('Topic') }}</label>
            <select id="topic" name="topic" class="select"><option value="">{{ __('All topics') }}</option>@foreach ($topics as $t)<option value="{{ $t->id }}" @selected(request('topic') == $t->id)>{{ $t->label }} ({{ $t->questions_count }})</option>@endforeach</select></div>
        <div class="field"><label class="label" for="type">{{ __('Type') }}</label>
            <select id="type" name="type" class="select"><option value="">{{ __('All') }}</option>@foreach (Question::TYPES as $k => $l)<option value="{{ $k }}" @selected(request('type') === $k)>{{ __($l) }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="level">{{ __('Level') }}</label>
            <select id="level" name="level" class="select"><option value="">{{ __('All') }}</option>@foreach (Question::LEVELS as $k => $l)<option value="{{ $k }}" @selected(request('level') === $k)>{{ __($l) }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Words in the question') }}"></div>
        <label class="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="mine" value="1" class="check" @checked(request('mine'))>{{ __('Only mine') }}</label>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>

    @if ($aiEnabled && $subject)
        <details class="sheet mb-5 overflow-hidden" x-data="{ subject: @js($subject->id) }">
            <summary class="flex cursor-pointer items-center gap-3 p-4 font-semibold"><span class="tone-icon tone-plum size-9 rounded-lg"><x-icon name="sparkles" class="size-5" /></span>{{ __('Draft questions with AI') }}<span class="text-sm font-normal muted">{{ __('— drafts wait for your review before students see them') }}</span></summary>
            <form method="POST" action="{{ route('teacher.questions.draft') }}" class="grid gap-3 border-t border-rule p-4 sm:grid-cols-5 sm:items-end" x-data="{ busy: false }" @submit="busy = true">
                @csrf
                <input type="hidden" name="subject_id" value="{{ $subject->id }}">
                <div class="field sm:col-span-2"><label class="label" for="ai_topic">{{ __('Topic') }}</label><select id="ai_topic" name="topic_id" class="select" required>@foreach ($topics as $t)<option value="{{ $t->id }}" @selected(request('topic') == $t->id)>{{ $t->label }}</option>@endforeach</select></div>
                <div class="field"><label class="label" for="ai_count">{{ __('How many') }}</label><input id="ai_count" name="count" type="number" min="1" max="15" value="5" class="input"></div>
                <div class="field"><label class="label" for="ai_level">{{ __('Level') }}</label><select id="ai_level" name="difficulty" class="select">@foreach (Question::LEVELS as $k => $l)<option value="{{ $k }}" @selected($k === 'medium')>{{ __($l) }}</option>@endforeach</select></div>
                <div class="field"><label class="label" for="ai_lang">{{ __('Language') }}</label><select id="ai_lang" name="language" class="select"><option>English</option><option>Marathi</option><option>Hindi</option></select></div>
                <button class="btn-rani sm:col-span-5 sm:justify-self-start" :disabled="busy"><x-icon name="sparkles" /><span x-text="busy ? @js(__('Drafting… this takes up to a minute')) : @js(__('Draft questions'))"></span></button>
            </form>
        </details>
    @endif

    @if ($questions->isEmpty())
        <x-empty :title="__('No questions here yet')" icon="circle-help">{{ __('Add the first question for this subject or topic. Add more than three wrong answers — the portal shows a different mix each time.') }}
            <x-slot:action><a href="{{ route('teacher.questions.create', ['subject' => $subject?->id]) }}" class="btn-primary"><x-icon name="plus" />{{ __('Add question') }}</a></x-slot:action></x-empty>
    @else
        <p class="mb-3 text-sm muted">{{ trans_choice(':count question|:count questions', $questions->total(), ['count' => $questions->total()]) }}</p>
        <div class="grid gap-3">
            @foreach ($questions as $q)
                <article class="sheet p-4 sm:p-5" x-data="{ open: false }">
                    <div class="flex flex-wrap items-start gap-3">
                        <div class="min-w-0 flex-1">
                            <div class="mb-1.5 flex flex-wrap items-center gap-1.5 text-xs">
                                <span class="badge-info">{{ $q->type_label }}</span>
                                <span class="{{ ['easy' => 'badge-ok', 'medium' => 'badge-warn', 'hard' => 'badge-bad'][$q->difficulty] }}">{{ __(Question::LEVELS[$q->difficulty]) }}</span>
                                @if ($q->topic)<span class="badge-muted">{{ $q->topic->label }}</span>@endif
                                @if ($q->status !== 'approved')<span class="badge-pending">{{ $q->status === 'pending' ? __('Waiting for review') : __('Hidden') }}</span>@endif
                                @if ($q->source === 'student')<span class="badge-rani">{{ __('From a student') }}</span>@elseif ($q->source === 'ai')<span class="badge-rani">AI</span>@endif
                            </div>
                            <p class="font-semibold whitespace-pre-line">{{ $q->text }}</p>
                        </div>
                        <div class="flex shrink-0 gap-1.5">
                            <button type="button" class="btn-quiet btn-sm" @click="open = !open" :aria-expanded="open"><x-icon name="eye" />{{ __('Answers') }}</button>
                            @if ($q->created_by === auth()->id())
                                <a href="{{ route('teacher.questions.edit', $q) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a>
                                <form method="POST" action="{{ route('teacher.questions.destroy', $q) }}" onsubmit="return confirm(@js(__('Delete this question?')))">@csrf @method('DELETE')<button class="btn-quiet btn-sm text-omr" aria-label="{{ __('Delete') }}"><x-icon name="trash-2" /></button></form>
                            @endif
                        </div>
                    </div>
                    <div x-show="open" x-collapse x-cloak class="mt-3 border-t border-rule pt-3">
                        <ul class="grid gap-1.5 sm:grid-cols-2">
                            @foreach ($q->options as $o)
                                <li @class(['flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm', 'bg-leaf-soft font-semibold text-leaf' => $o->is_correct, 'bg-wash' => ! $o->is_correct])>
                                    <x-icon :name="$o->is_correct ? 'circle-check' : 'x'" class="mt-0.5 size-4 shrink-0" />{{ $o->text }}</li>
                            @endforeach
                        </ul>
                        @if ($q->explanation)<p class="mt-3 text-sm"><b>{{ __('Explanation') }}:</b> {{ $q->explanation }}</p>@endif
                        <p class="mt-2 text-xs muted">{{ __('Added by :name', ['name' => $q->author?->name ?? __('Portal')]) }}</p>
                    </div>
                </article>
            @endforeach
        </div>
        <div class="mt-5">{{ $questions->links() }}</div>
    @endif
</x-layouts.portal>
