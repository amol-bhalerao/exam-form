@php use App\Models\Subject; $editing = $subject->exists; $picked = old('streams', $subject->streams?->pluck('id')->all() ?? []); @endphp
<x-layouts.portal :title="$editing ? $subject->name : __('Add subject')">
    <x-page-header :title="$editing ? __('Edit subject') : __('Add subject')" :back="route('admin.subjects.index', ['board' => $subject->board_id])" />
    <form method="POST" action="{{ $editing ? route('admin.subjects.update', $subject) : route('admin.subjects.store') }}" class="grid max-w-4xl gap-6" x-data="{ board: '{{ old('board_id', $subject->board_id) }}' }">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <div class="field"><label class="label" for="board_id">{{ __('Board') }}</label><select id="board_id" name="board_id" class="select" x-model="board">@foreach ($boards as $b)<option value="{{ $b->id }}">{{ $b->short_name }}</option>@endforeach</select></div>
                <x-form.input name="code" :label="__('Subject code')" :value="$subject->code" required class="uppercase" />
                <x-form.input name="name" :label="__('Name (English)')" :value="$subject->name" required />
                <x-form.input name="name_mr" :label="__('Name (Marathi)')" :value="$subject->name_mr" />
                <x-form.input name="name_hi" :label="__('Name (Hindi)')" :value="$subject->name_hi" />
                <x-form.select name="kind" :label="__('Type')" :options="collect(Subject::KINDS)->map(fn ($l) => __($l))" :value="$subject->kind" required />
                <x-form.input name="theory_marks" type="number" :label="__('Theory marks')" :value="$subject->theory_marks" />
                <x-form.input name="internal_marks" type="number" :label="__('Internal / practical marks')" :value="$subject->internal_marks" />
                <x-form.input name="papers" type="number" :label="__('Number of papers')" :value="$subject->papers" />
                <x-form.input name="sort" type="number" :label="__('Display order')" :value="$subject->sort" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-4">{{ __('Streams') }}</h2>
            @foreach ($boards as $b)
                <div class="grid gap-2 sm:grid-cols-3" x-show="board == '{{ $b->id }}'">
                    @foreach ($b->streams as $st)
                        <label class="flex min-h-11 items-center gap-2 rounded-md border border-rule-strong px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft"><input type="checkbox" name="streams[]" value="{{ $st->id }}" class="check" @checked(in_array($st->id, $picked)) :disabled="board != '{{ $b->id }}'"> {{ $st->label }}</label>
                    @endforeach
                </div>
            @endforeach
            <div class="mt-5 grid gap-3">
                <label class="flex items-center gap-3"><input type="checkbox" name="graded" value="1" class="check" @checked(old('graded', $subject->graded))> {{ __('Graded subject (no marks on the mark sheet)') }}</label>
                <label class="flex items-center gap-3"><input type="checkbox" name="is_active" value="1" class="check" @checked(old('is_active', $subject->is_active))> {{ __('Active') }}</label>
            </div>
        </section>
        <div class="flex flex-wrap justify-end gap-3">
            @if ($editing)<button form="delete-subject" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Remove') }}</button>@endif
            <a href="{{ route('admin.subjects.index', ['board' => $subject->board_id]) }}" class="btn-quiet">{{ __('Cancel') }}</a>
            <button class="btn-primary">{{ __('Save') }}</button>
        </div>
    </form>
    @if ($editing)<form id="delete-subject" method="POST" action="{{ route('admin.subjects.destroy', $subject) }}" onsubmit="return confirm(@js(__('Remove this subject?')))">@csrf @method('DELETE')</form>@endif
</x-layouts.portal>
