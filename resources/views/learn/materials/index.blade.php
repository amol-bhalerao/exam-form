<x-layouts.portal :title="__('Study material')">
    <x-page-header :title="__('Study material')" :subtitle="__('Notes, PDFs and links from teachers — and the best notes shared by students, after teacher review.')">
        <x-slot:actions><a href="{{ route('learn.materials.create', ['subject' => $subjectId]) }}" class="btn-primary"><x-icon name="upload" />{{ __('Share my notes') }}</a></x-slot:actions>
    </x-page-header>
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="subject">{{ __('Subject') }}</label><select id="subject" name="subject" class="select" onchange="this.form.topic && (this.form.topic.value = ''); this.form.submit()"><option value="">{{ __('All subjects') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}" @selected($subjectId === $s->id)>{{ $s->label }}</option>@endforeach</select></div>
        @if ($topics->isNotEmpty())<div class="field"><label class="label" for="topic">{{ __('Topic') }}</label><select id="topic" name="topic" class="select"><option value="">{{ __('All topics') }}</option>@foreach ($topics as $t)<option value="{{ $t->id }}" @selected(request('topic') == $t->id)>{{ $t->label }}</option>@endforeach</select></div>@endif
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input"></div>
        <button class="btn-secondary"><x-icon name="search" />{{ __('Find') }}</button>
    </form>
    @if ($mine->where('status', '!=', 'approved')->isNotEmpty())
        <div class="alert-info mb-5"><x-icon name="info" class="mt-0.5 size-5 shrink-0" /><div><p class="font-semibold">{{ __('Your shared notes') }}</p>
            <ul class="mt-1 text-sm">@foreach ($mine->where('status', '!=', 'approved') as $m)<li>{{ $m->title }} — <span class="{{ $m->status === 'pending' ? 'badge-pending' : 'badge-bad' }}">{{ $m->status === 'pending' ? __('Waiting for teacher review') : __('Not approved') }}</span>@if ($m->review_note) <span class="muted">“{{ $m->review_note }}”</span>@endif</li>@endforeach</ul></div></div>
    @endif
    @if ($materials->isEmpty())
        <x-empty :title="__('No study material here yet')" icon="book-marked">{{ __('Be the first — share your notes for this subject. A teacher reviews them before they go live.') }}</x-empty>
    @else
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @foreach ($materials as $m)@include('partials.material-card', ['href' => route('learn.materials.show', $m)])@endforeach
        </div>
        <div class="mt-5">{{ $materials->links() }}</div>
    @endif
</x-layouts.portal>
