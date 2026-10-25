<x-layouts.portal :title="__('Study material')">
    <x-page-header :title="__('Study material')" :subtitle="__('Notes, PDFs and links students can read for each subject and topic.')">
        <x-slot:actions><a href="{{ route('teacher.materials.create', ['subject' => request('subject')]) }}" class="btn-primary"><x-icon name="upload" />{{ __('Add material') }}</a></x-slot:actions>
    </x-page-header>
    <form method="GET" class="filters">
        <div class="field"><label class="label" for="subject">{{ __('Subject') }}</label><select id="subject" name="subject" class="select"><option value="">{{ __('All subjects') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}" @selected(request('subject') == $s->id)>{{ $s->label }}</option>@endforeach</select></div>
        <label class="flex min-h-11 items-center gap-2 text-sm font-semibold"><input type="checkbox" name="mine" value="1" class="check" @checked(request('mine'))>{{ __('Only mine') }}</label>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    @if ($materials->isEmpty())
        <x-empty :title="__('No study material yet')" icon="book-marked">{{ __('Add notes, a PDF or a useful link for a topic.') }}</x-empty>
    @else
        <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            @foreach ($materials as $m)
                <div class="relative">
                    @include('partials.material-card', ['href' => $m->uploaded_by === auth()->id() ? route('teacher.materials.edit', $m) : ($m->fileUrl() ?? $m->link_url ?? '#'), 'external' => $m->uploaded_by !== auth()->id()])
                </div>
            @endforeach
        </div>
        <div class="mt-5">{{ $materials->links() }}</div>
    @endif
</x-layouts.portal>
