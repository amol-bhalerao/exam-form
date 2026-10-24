<x-layouts.portal :title="__('Change password')">
    <x-page-header :title="__('Change password')" :subtitle="__('Use at least 10 characters with upper and lower case letters and a number.')" />
    <form method="POST" action="{{ route('password.update') }}" class="sheet sheet-pad max-w-xl space-y-5">
        @csrf @method('PUT')
        <x-form.input type="password" name="current_password" :label="__('Current password')" required autocomplete="current-password" />
        <x-form.input type="password" name="password" :label="__('New password')" required autocomplete="new-password" />
        <x-form.input type="password" name="password_confirmation" :label="__('Repeat new password')" required autocomplete="new-password" />
        <button class="btn-primary">{{ __('Save new password') }}</button>
    </form>
</x-layouts.portal>
