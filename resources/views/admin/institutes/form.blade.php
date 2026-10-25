@php $editing = $institute->exists; $picked = old('streams', $institute->streams?->pluck('id')->all() ?? []); @endphp
<x-layouts.portal :title="$editing ? $institute->name : __('Add institute')">
    <x-page-header :title="$editing ? __('Edit institute') : __('Add institute')" :subtitle="$editing ? $institute->name : null" :back="route('admin.institutes.index')" />
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <form method="POST" action="{{ $editing ? route('admin.institutes.update', $institute) : route('admin.institutes.store') }}" class="grid gap-6" x-data="{ board: '{{ old('board_id', $institute->board_id) }}' }">
            @csrf @if ($editing) @method('PUT') @endif
            <section class="sheet sheet-pad">
                <div class="fieldset">
                    <div class="field"><label class="label" for="board_id">{{ __('Board') }} <span class="text-omr">*</span></label>
                        <select id="board_id" name="board_id" class="select" x-model="board" required>@foreach ($boards as $b)<option value="{{ $b->id }}">{{ $b->short_name }} — {{ $b->name }}</option>@endforeach</select></div>
                    <x-form.select name="division_id" :label="__('Divisional board')" :options="$divisions" :value="$institute->division_id" :placeholder="__('Not set')" />
                    <x-form.input name="college_no" :label="__('Index no.')" :value="$institute->college_no" required placeholder="56.01.001" />
                    <x-form.input name="name" :label="__('Name')" :value="$institute->name" required span class="uppercase" />
                    <x-form.input name="udise_no" :label="__('UDISE number')" :value="$institute->udise_no" inputmode="numeric" maxlength="11" />
                    <x-form.input name="district" :label="__('District')" :value="$institute->district" />
                    <x-form.input name="taluka" :label="__('Taluka')" :value="$institute->taluka" />
                    <x-form.input name="pincode" :label="__('PIN code')" :value="$institute->pincode" inputmode="numeric" maxlength="6" />
                    <x-form.textarea name="address" :label="__('Address')" :value="$institute->address" rows="2" />
                    <x-form.input name="principal_name" :label="__('Principal / headmaster')" :value="$institute->principal_name" />
                    <x-form.input name="contact_email" type="email" :label="__('Office email')" :value="$institute->contact_email" />
                    <x-form.input name="contact_mobile" type="tel" :label="__('Office mobile')" :value="$institute->contact_mobile" inputmode="numeric" maxlength="10" />
                </div>
            </section>
            <section class="sheet sheet-pad">
                <h2 class="title mb-4">{{ __('Streams taught') }}</h2>
                @foreach ($boards as $b)
                    <div class="grid gap-2 sm:grid-cols-3" x-show="board == '{{ $b->id }}'">
                        @forelse ($b->streams as $s)
                            <label class="flex min-h-11 items-center gap-2 rounded-md border border-rule-strong px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft"><input type="checkbox" name="streams[]" value="{{ $s->id }}" class="check" @checked(in_array($s->id, $picked)) :disabled="board != '{{ $b->id }}'"> {{ $s->label }}</label>
                        @empty
                            <p class="muted">{{ __('This board has no streams.') }}</p>
                        @endforelse
                    </div>
                @endforeach
                <div class="mt-5 grid gap-3">
                    <label class="flex items-center gap-3"><input type="checkbox" name="is_active" value="1" class="check" @checked(old('is_active', $institute->is_active))> {{ __('Active (shown to students)') }}</label>
                    <label class="flex items-center gap-3"><input type="checkbox" name="accepting_forms" value="1" class="check" @checked(old('accepting_forms', $institute->accepting_forms))> {{ __('Accepting exam forms') }}</label>
                </div>
            </section>
            <div class="flex flex-wrap justify-end gap-3">
                @if ($editing)<button form="delete-inst" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Remove') }}</button>@endif
                <a href="{{ route('admin.institutes.index') }}" class="btn-quiet">{{ __('Cancel') }}</a>
                <button class="btn-primary">{{ __('Save') }}</button>
            </div>
        </form>
        @if ($editing)
            <aside class="sheet sheet-pad self-start">
                <h2 class="title mb-3">{{ __('Portal logins') }}</h2>
                @forelse ($institute->users as $u)
                    <a href="{{ route('admin.users.edit', $u) }}" class="mb-2 block rounded-md border border-rule p-3 text-ink no-underline hover:bg-wash"><span class="font-semibold">{{ $u->username }}</span><span class="block text-sm muted">{{ $u->name }} @unless ($u->is_active)· {{ __('Inactive') }}@endunless</span></a>
                @empty
                    <p class="text-sm muted">{{ __('No login yet. The college cannot sign in until you create one.') }}</p>
                @endforelse
                <a href="{{ route('admin.users.create', ['institute' => $institute->id]) }}" class="btn-secondary btn-sm mt-3 w-full"><x-icon name="user-plus" />{{ __('Create login') }}</a>
            </aside>
            <form id="delete-inst" method="POST" action="{{ route('admin.institutes.destroy', $institute) }}" onsubmit="return confirm(@js(__('Remove :name? If it has forms on record it will be deactivated instead.', ['name' => $institute->name])))">@csrf @method('DELETE')</form>
        @endif
    </div>
</x-layouts.portal>
