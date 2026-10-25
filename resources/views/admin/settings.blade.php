@php $v = $values; @endphp
<x-layouts.portal :title="__('Site settings')">
    <x-page-header :title="__('Site settings')" :subtitle="__('Name, contact details and search-engine defaults for the public website.')" />
    <form method="POST" action="{{ route('admin.settings.update') }}" class="grid max-w-4xl gap-6">
        @csrf @method('PUT')
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Identity') }}</h2>
            <div class="fieldset">
                <x-form.input name="site_name" label="Site name (English)" :value="$v['site_name']" required />
                <x-form.input name="site_name_mr" label="संकेतस्थळाचे नाव (मराठी)" :value="$v['site_name_mr']" />
                <x-form.input name="site_name_hi" label="साइट का नाम (हिंदी)" :value="$v['site_name_hi']" />
                <x-form.input name="division" :label="__('Division / office line')" :value="$v['division']" />
                <x-form.input name="tagline" label="Tagline (English)" :value="$v['tagline']" span />
                <x-form.input name="tagline_mr" label="घोषवाक्य (मराठी)" :value="$v['tagline_mr']" span />
                <x-form.input name="tagline_hi" label="टैगलाइन (हिंदी)" :value="$v['tagline_hi']" span />
                <x-form.textarea name="footer_note" :label="__('Footer note')" :value="$v['footer_note']" rows="2" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Help desk') }}</h2>
            <div class="fieldset">
                <x-form.input name="helpline_email" type="email" :label="__('Email')" :value="$v['helpline_email']" />
                <x-form.input name="helpline_phone" :label="__('Phone')" :value="$v['helpline_phone']" />
                <x-form.input name="helpline_hours" :label="__('Hours')" :value="$v['helpline_hours']" span />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Search engines') }}</h2>
            <div class="fieldset">
                <x-form.textarea name="seo_description" :label="__('Default description')" :value="$v['seo_description']" rows="2" />
                <x-form.input name="seo_keywords" :label="__('Default keywords')" :value="$v['seo_keywords']" span />
                <x-form.input name="google_site_verification" :label="__('Google Search Console verification code')" :value="$v['google_site_verification']" />
                <x-form.input name="analytics_id" :label="__('Google Analytics ID')" :value="$v['analytics_id']" placeholder="G-XXXXXXX" />
            </div>
        </section>
        <section class="sheet sheet-pad grid gap-4">
            <h2 class="title">{{ __('Switches') }}</h2>
            <label class="flex items-start gap-3"><input type="checkbox" name="ticker_enabled" value="1" class="check mt-0.5" @checked($v['ticker_enabled'])><span><span class="font-semibold">{{ __('News ticker') }}</span><span class="block text-sm muted">{{ __('Scrolls notices marked “ticker” across the top of every public page.') }}</span></span></label>
            <label class="flex items-start gap-3"><input type="checkbox" name="registration_open" value="1" class="check mt-0.5" @checked($v['registration_open'] ?? true)><span><span class="font-semibold">{{ __('Student sign-up open') }}</span><span class="block text-sm muted">{{ __('When off, new Google accounts cannot sign up. Existing students can still sign in.') }}</span></span></label>
            <x-form.input name="maintenance_message" :label="__('Banner message (optional)')" :value="$v['maintenance_message']" :hint="__('Shown at the top of student pages, e.g. “Payments are slow today.”')" />
        </section>
        <div class="flex justify-end"><button class="btn-primary">{{ __('Save settings') }}</button></div>
    </form>
    <form method="POST" action="{{ route('admin.settings.refresh') }}" class="sheet sheet-pad mt-6 flex max-w-4xl flex-wrap items-center gap-4">
        @csrf
        <div class="min-w-0 flex-1 basis-64">
            <h2 class="title">{{ __('Apply update') }}</h2>
            <p class="muted mt-1 text-sm">{{ __('Use this after uploading new files to the server. It clears old cached files, adds new database tables and loads new questions into the question bank. Safe to run again.') }}</p>
        </div>
        <button class="btn-secondary"><x-icon name="history" />{{ __('Apply update now') }}</button>
    </form>
</x-layouts.portal>
