@php $badge = fn ($s) => ['approved' => ['badge-ok', __('Live')], 'pending' => ['badge-pending', __('Waiting for review')], 'rejected' => ['badge-bad', __('Not approved')]][$s] ?? ['badge-muted', $s]; @endphp
<x-layouts.portal :title="__('Share questions and tips')">
    <x-page-header :title="__('Share questions and tips')" :subtitle="__('Help your classmates: add questions for practice tests, memory tricks and notes. Teachers review everything before it goes live.')" />
    <div class="mb-7 grid gap-4 sm:grid-cols-3">
        <a href="{{ route('learn.contribute.create') }}" class="feature tone-board"><span class="tone-icon size-10 rounded-lg"><x-icon name="circle-help" class="size-5" /></span><p class="title">{{ __('Add a question') }}</p><p class="text-sm muted">{{ __('With options, the correct answer and why.') }}</p></a>
        <a href="{{ route('learn.materials.create') }}" class="feature tone-mor"><span class="tone-icon size-10 rounded-lg"><x-icon name="notebook-pen" class="size-5" /></span><p class="title">{{ __('Share notes') }}</p><p class="text-sm muted">{{ __('Typed notes, a PDF or a photo.') }}</p></a>
        <div class="feature tone-marigold"><span class="tone-icon size-10 rounded-lg"><x-icon name="lightbulb" class="size-5" /></span><p class="title">{{ __('Memory tricks') }}</p><p class="text-sm muted">{{ __('After any practice, open the result and tap “I have a trick to remember this”.') }}</p></div>
    </div>

    <section class="sheet mb-6 overflow-hidden">
        <div class="zari-thin" aria-hidden="true"></div>
        <h2 class="title p-5 pb-2">{{ __('Ideas for remembering answers') }}</h2>
        <div class="grid gap-3 p-5 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            @foreach ([
                ['First-letter code', 'Make a sentence from first letters: “VIBGYOR” for the rainbow colours, “My Very Educated Mother Just Served Us Nachos” for the planets.'],
                ['Rhyme or song', 'Put a rule into a short rhyme or a filmi tune — rhythm sticks in memory.'],
                ['Picture story', 'Imagine a funny picture linking the question and the answer. The sillier, the better.'],
                ['Chunking', 'Split long numbers or lists into groups of 3–4: 1857 → “18-57”.'],
                ['Teach it', 'Explain the answer aloud to a friend or family member in one minute.'],
                ['Spaced repetition', 'Revise after 1 day, 3 days, 7 days. Use “Practise weak topics” to do this automatically.'],
            ] as [$t, $d])
                <div class="tipcard"><p class="font-semibold">{{ __($t) }}</p><p class="mt-0.5 text-ink-2">{{ __($d) }}</p></div>
            @endforeach
        </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-3">
        <section class="sheet p-5 lg:col-span-1">
            <h2 class="title mb-3">{{ __('My questions') }}</h2>
            @forelse ($questions as $q)
                <div class="border-t border-rule py-2.5 first:border-0"><p class="line-clamp-2 text-sm font-semibold">{{ $q->text }}</p><p class="mt-1 text-xs"><span class="{{ $badge($q->status)[0] }}">{{ $badge($q->status)[1] }}</span> <span class="muted">{{ $q->subject->label }}</span></p>@if ($q->review_note)<p class="mt-1 text-xs muted">“{{ $q->review_note }}”</p>@endif</div>
            @empty<p class="text-sm muted">{{ __('None yet.') }}</p>@endforelse
        </section>
        <section class="sheet p-5">
            <h2 class="title mb-3">{{ __('My memory tips') }}</h2>
            @forelse ($tips as $t)
                <div class="border-t border-rule py-2.5 first:border-0"><p class="text-sm">{{ $t->text }}</p><p class="mt-1 text-xs"><span class="{{ $badge($t->status)[0] }}">{{ $badge($t->status)[1] }}</span> @if ($t->likes)<span class="muted"><x-icon name="thumbs-up" class="inline size-3" /> {{ $t->likes }}</span>@endif</p></div>
            @empty<p class="text-sm muted">{{ __('None yet.') }}</p>@endforelse
        </section>
        <section class="sheet p-5">
            <h2 class="title mb-3">{{ __('My notes') }}</h2>
            @forelse ($materials as $m)
                <a href="{{ route('learn.materials.show', $m) }}" class="block border-t border-rule py-2.5 no-underline text-ink first:border-0"><p class="text-sm font-semibold">{{ $m->title }}</p><p class="mt-1 text-xs"><span class="{{ $badge($m->status)[0] }}">{{ $badge($m->status)[1] }}</span> <span class="muted">{{ $m->subject->label }} · {{ $m->views }} {{ __('views') }}</span></p>@if ($m->review_note)<p class="mt-1 text-xs muted">“{{ $m->review_note }}”</p>@endif</a>
            @empty<p class="text-sm muted">{{ __('None yet.') }}</p>@endforelse
        </section>
    </div>
</x-layouts.portal>
