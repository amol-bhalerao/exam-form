<x-layouts.portal :title="__('College details')">
    <x-page-header :title="__('College details')" :subtitle="__('Contact details shown to the board. The name, index number and UDISE are managed by the board office.')" />
    <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <form method="POST" action="{{ route('institute.profile.update') }}" class="sheet sheet-pad">
            @csrf @method('PUT')
            <div class="fieldset">
                <x-form.input name="principal_name" :label="__('Principal / headmaster name')" :value="$institute->principal_name" required span />
                <x-form.input name="contact_email" type="email" :label="__('Office email')" :value="$institute->contact_email" required />
                <x-form.input name="contact_mobile" type="tel" :label="__('Office mobile')" :value="$institute->contact_mobile" required inputmode="numeric" maxlength="10" />
                <x-form.textarea name="address" :label="__('Address')" :value="$institute->address" required rows="3" />
                <x-form.input name="taluka" :label="__('Taluka')" :value="$institute->taluka" />
                <x-form.input name="district" :label="__('District')" :value="$institute->district" />
                <x-form.input name="pincode" :label="__('PIN code')" :value="$institute->pincode" inputmode="numeric" maxlength="6" />
                <label class="flex items-center gap-3 sm:col-span-2"><input type="checkbox" name="accepting_forms" value="1" class="check" @checked(old('accepting_forms', $institute->accepting_forms))> {{ __('Accept new exam forms from students') }}</label>
            </div>
            <div class="mt-6 flex justify-end"><button class="btn-primary">{{ __('Save') }}</button></div>
        </form>
        <aside class="sheet sheet-pad self-start">
            <dl class="dl">
                <dt>{{ __('Name') }}</dt><dd>{{ $institute->name }}</dd>
                <dt>{{ __('Index no.') }}</dt><dd>{{ $institute->college_no }}</dd>
                <dt>{{ __('UDISE') }}</dt><dd>{{ $institute->udise_no ?: '—' }}</dd>
                <dt>{{ __('Board') }}</dt><dd>{{ $institute->board->short_name }}</dd>
                <dt>{{ __('Streams') }}</dt><dd>{{ $institute->streams->map->label->implode(', ') ?: '—' }}</dd>
            </dl>
        </aside>
    </div>
</x-layouts.portal>
