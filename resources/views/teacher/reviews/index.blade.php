<x-layouts.portal :title="__('Review submissions')">
    <x-page-header :title="__('Review submissions')" :subtitle="__('Questions, notes and memory tips sent by your students (and AI drafts). Nothing is shown to other students until you approve it.')" />
    <nav class="mb-6 flex gap-1 overflow-x-auto border-b border-rule" aria-label="{{ __('Submission type') }}">
        @foreach (['questions' => __('Questions'), 'materials' => __('Notes and material'), 'tips' => __('Memory tips')] as $k => $l)
            <a href="{{ route('teacher.reviews.index', ['tab' => $k]) }}" @class(['tab', 'tab-active' => $tab === $k]) @if ($tab === $k) aria-current="page" @endif>{{ $l }}<span class="tab-count">{{ $counts[$k] }}</span></a>
        @endforeach
    </nav>

    @php
        $decide = function ($kind, $id) { return route('teacher.reviews.decide', [$kind, $id]); };
    @endphp

    @if ($tab === 'questions')
        @forelse ($questions as $q)
            <article class="sheet mb-3 p-5">
                <div class="mb-2 flex flex-wrap gap-1.5 text-xs"><span class="badge-info">{{ $q->type_label }}</span><span class="badge-muted">{{ $q->subject->label }}@if ($q->topic) · {{ $q->topic->label }}@endif</span><span class="badge-rani">{{ $q->source === 'ai' ? __('AI draft') : __('From :name', ['name' => $q->author?->name ?? __('a student')]) }}</span></div>
                <p class="font-semibold whitespace-pre-line">{{ $q->text }}</p>
                <ul class="mt-3 grid gap-1.5 sm:grid-cols-2">@foreach ($q->options as $o)<li @class(['flex items-start gap-2 rounded-md px-2.5 py-1.5 text-sm', 'bg-leaf-soft font-semibold text-leaf' => $o->is_correct, 'bg-wash' => ! $o->is_correct])><x-icon :name="$o->is_correct ? 'circle-check' : 'x'" class="mt-0.5 size-4 shrink-0" />{{ $o->text }}</li>@endforeach</ul>
                @if ($q->explanation)<p class="mt-2 text-sm"><b>{{ __('Explanation') }}:</b> {{ $q->explanation }}</p>@endif
                @foreach ($q->tips as $t)<p class="tipcard mt-2"><x-icon name="lightbulb" class="inline size-4 text-marigold" /> {{ $t->text }}</p>@endforeach
                @include('teacher.reviews._decide', ['action' => $decide('questions', $q->id), 'edit' => route('teacher.questions.edit', $q)])
            </article>
        @empty
            <x-empty :title="__('Nothing waiting')" icon="square-check-big">{{ __('New questions from students will appear here.') }}</x-empty>
        @endforelse
        {{ $questions?->links() }}
    @elseif ($tab === 'materials')
        @forelse ($materials as $m)
            <article class="sheet mb-3 p-5">
                <div class="mb-2 flex flex-wrap gap-1.5 text-xs"><span class="badge-muted">{{ $m->subject->label }}@if ($m->topic) · {{ $m->topic->label }}@endif</span><span class="badge-rani">{{ __('From :name', ['name' => $m->student?->full_name ?? __('a student')]) }}</span></div>
                <p class="title">{{ $m->title }}</p>
                @if ($m->description)<p class="mt-1 text-ink-2">{{ $m->description }}</p>@endif
                @if ($m->body)<details class="mt-3"><summary class="cursor-pointer text-sm font-semibold">{{ __('Read the notes') }}</summary><div class="prose-page mt-3 max-h-96 overflow-auto rounded-lg border border-rule p-4">{!! $m->body !!}</div></details>@endif
                @if ($m->fileUrl())<a href="{{ $m->fileUrl() }}" target="_blank" class="btn-secondary btn-sm mt-3"><x-icon name="file-text" />{{ __('Open attachment') }} · {{ $m->file_name }}</a>@endif
                @include('teacher.reviews._decide', ['action' => $decide('materials', $m->id), 'edit' => null])
            </article>
        @empty
            <x-empty :title="__('Nothing waiting')" icon="square-check-big">{{ __('Notes shared by students will appear here.') }}</x-empty>
        @endforelse
        {{ $materials?->links() }}
    @else
        @forelse ($tips as $t)
            <article class="sheet mb-3 p-5">
                <p class="text-sm muted">{{ __('For the question:') }} <span class="text-ink">{{ \Illuminate\Support\Str::limit($t->question?->text ?? $t->topic?->label, 160) }}</span></p>
                <p class="tipcard mt-2 text-base"><x-icon name="lightbulb" class="inline size-4 text-marigold" /> {{ $t->text }}</p>
                <p class="mt-1 text-xs muted">{{ __('From :name', ['name' => $t->student?->full_name ?? __('a student')]) }}</p>
                @include('teacher.reviews._decide', ['action' => $decide('tips', $t->id), 'edit' => null, 'noNote' => true])
            </article>
        @empty
            <x-empty :title="__('Nothing waiting')" icon="square-check-big">{{ __('Memory tips shared by students will appear here.') }}</x-empty>
        @endforelse
        {{ $tips?->links() }}
    @endif
</x-layouts.portal>
