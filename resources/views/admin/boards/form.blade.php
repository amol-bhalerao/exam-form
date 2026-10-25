@php $editing = $board->exists; @endphp
<x-layouts.portal :title="$editing ? $board->short_name : __('Add exam board')">
    <x-page-header :title="$editing ? __('Edit exam board') : __('Add exam board')" :back="route('admin.boards.index')" />
    <form method="POST" action="{{ $editing ? route('admin.boards.update', $board) : route('admin.boards.store') }}" class="grid max-w-4xl gap-6">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <x-form.input name="code" :label="__('Code')" :value="$board->code" required maxlength="10" class="uppercase" :hint="__('Capital letters, e.g. HSC. Used in form numbers.')" />
                <x-form.input name="short_name" :label="__('Short name')" :value="$board->short_name" required maxlength="40" placeholder="HSC" />
                <x-form.input name="name" :label="__('Full name (English)')" :value="$board->name" required span placeholder="Higher Secondary Certificate (Std XII)" />
                <x-form.input name="name_mr" label="नाव (मराठी)" :value="$board->name_mr" />
                <x-form.input name="name_hi" label="नाम (हिंदी)" :value="$board->name_hi" />
                <x-form.input name="sort" type="number" :label="__('Order')" :value="$board->sort" min="0" max="999" />
            </div>
            <label class="mt-5 flex items-center gap-2 font-semibold"><input type="checkbox" name="has_streams" value="1" class="check" @checked(old('has_streams', $board->has_streams))>{{ __('Students choose a stream (Science, Arts, Commerce …)') }}</label>
        </section>
        <div class="flex flex-wrap gap-3"><button class="btn-primary"><x-icon name="check" />{{ __('Save') }}</button></div>
    </form>
    @if ($editing)
        <form method="POST" action="{{ route('admin.boards.destroy', $board) }}" class="mt-4" onsubmit="return confirm(@js(__('Delete this exam board?')))">@csrf @method('DELETE')<button class="btn-quiet text-omr"><x-icon name="trash-2" />{{ __('Delete') }}</button></form>
    @endif
</x-layouts.portal>
