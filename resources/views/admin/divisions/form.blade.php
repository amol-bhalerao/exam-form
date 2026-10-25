@php $editing = $division->exists; @endphp
<x-layouts.portal :title="$editing ? $division->name : __('Add division')">
    <x-page-header :title="$editing ? __('Edit division') : __('Add division')" :back="route('admin.divisions.index')" />
    <form method="POST" action="{{ $editing ? route('admin.divisions.update', $division) : route('admin.divisions.store') }}" class="grid max-w-4xl gap-6">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <x-form.input name="code" :label="__('Code')" :value="$division->code" required maxlength="10" :hint="__('Division number printed on documents, e.g. 3')" />
                <x-form.input name="short_name" :label="__('Short name')" :value="$division->short_name" required maxlength="60" placeholder="Pune" />
                <x-form.input name="name" :label="__('Full name (English)')" :value="$division->name" required span placeholder="Pune Divisional Board" />
                <x-form.input name="name_mr" label="नाव (मराठी)" :value="$division->name_mr" />
                <x-form.input name="name_hi" label="नाम (हिंदी)" :value="$division->name_hi" />
                <x-form.input name="email" type="email" :label="__('Email')" :value="$division->email" />
                <x-form.input name="phone" :label="__('Phone')" :value="$division->phone" />
                <x-form.input name="website" type="url" :label="__('Website')" :value="$division->website" placeholder="https://" />
                <x-form.input name="sort" type="number" :label="__('Order')" :value="$division->sort" min="0" max="999" />
                <x-form.textarea name="address" :label="__('Office address')" :value="$division->address" rows="2" />
            </div>
            <label class="mt-5 flex items-center gap-2 font-semibold"><input type="checkbox" name="is_active" value="1" class="check" @checked(old('is_active', $division->is_active))>{{ __('Active') }}</label>
        </section>
        <div class="flex flex-wrap gap-3"><button class="btn-primary"><x-icon name="check" />{{ __('Save') }}</button></div>
    </form>
    @if ($editing)
        <form method="POST" action="{{ route('admin.divisions.destroy', $division) }}" class="mt-4" onsubmit="return confirm(@js(__('Delete this division?')))">@csrf @method('DELETE')<button class="btn-quiet text-omr"><x-icon name="trash-2" />{{ __('Delete') }}</button></form>
    @endif
</x-layouts.portal>
