@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Subjects offered')">
    <x-page-header :title="__('Subjects offered')" :subtitle="__('Tick the subjects your college teaches. Students of that stream will only see these when filling the form. If nothing is ticked, students see every subject.')" />

    <nav class="mb-5 flex gap-1 overflow-x-auto border-b border-rule" aria-label="{{ __('Streams') }}">
        @foreach ($streams as $s)
            <a href="{{ route('institute.subjects.index', ['stream' => $s->id]) }}" @class(['tab', 'tab-active' => $active?->id === $s->id])>{{ $s->label }} <span class="tab-count">{{ $counts[$s->id] ?? 0 }}</span></a>
        @endforeach
    </nav>

    @if ($active)
    <form method="POST" action="{{ route('institute.subjects.update', $active) }}" x-data="{ picked: @js($offered->keys()->map(fn ($i) => (string) $i)->values()) }">
        @csrf @method('PUT')
        <div class="grid gap-5">
            @foreach ($subjects as $kind => $items)
                <section class="sheet sheet-pad">
                    <div class="mb-4 flex items-center justify-between gap-3">
                        <h2 class="title">{{ __(\App\Models\Subject::KINDS[$kind] ?? $kind) }}</h2>
                        <button type="button" class="btn-quiet btn-sm" @click="@js($items->pluck('id')->map(fn ($i) => (string) $i)).forEach(id => { if (!picked.includes(id)) picked.push(id) })">{{ __('Select all') }}</button>
                    </div>
                    <div class="grid gap-2 md:grid-cols-2">
                        @foreach ($items as $subject)
                            <div class="flex flex-wrap items-center gap-3 rounded-md border border-rule-strong px-3 py-2 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                                <label class="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                                    <input type="checkbox" name="subjects[]" value="{{ $subject->id }}" class="check" x-model="picked">
                                    <span class="kbd-code">{{ $subject->code }}</span>
                                    <span class="min-w-0 flex-1 font-medium leading-snug">{{ $subject->label }}</span>
                                </label>
                                <select name="language[{{ $subject->id }}]" class="select w-36 text-sm" style="min-height:38px" x-show="picked.includes('{{ $subject->id }}')" aria-label="{{ __('Fixed answer language') }}">
                                    <option value="">{{ __('Student chooses') }}</option>
                                    @foreach (Codes::options(Codes::MEDIUMS) as $c => $l)<option value="{{ $c }}" @selected(($offered[$subject->id]->answer_language ?? null) === $c)>{{ $l }}</option>@endforeach
                                </select>
                            </div>
                        @endforeach
                    </div>
                </section>
            @endforeach
        </div>
        <div class="bulkbar">
            <span class="font-semibold"><span x-text="picked.length"></span> {{ __('subjects ticked for :stream', ['stream' => $active->label]) }}</span>
            <button class="btn-primary btn-sm ml-auto">{{ __('Save subjects') }}</button>
        </div>
    </form>
    @endif
</x-layouts.portal>
