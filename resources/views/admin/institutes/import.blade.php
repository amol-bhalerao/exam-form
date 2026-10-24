<x-layouts.portal :title="__('Import institutes')">
    <x-page-header :title="__('Import institutes')" :subtitle="__('Add or update many colleges or schools at once from a CSV file (Excel → Save as CSV UTF-8).')" :back="route('admin.institutes.index')" />
    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <form method="POST" enctype="multipart/form-data" class="sheet sheet-pad grid gap-5">
            @csrf
            <x-form.select name="board_id" :label="__('Board')" :options="$boards->pluck('short_name', 'id')" required />
            <div class="field"><label class="label" for="file">{{ __('CSV file') }} <span class="text-omr">*</span></label><input id="file" name="file" type="file" accept=".csv,text/csv" class="input py-2" required>@error('file')<p class="error">{{ $message }}</p>@enderror</div>
            <label class="flex items-center gap-3"><input type="checkbox" name="update_existing" value="1" class="check"> {{ __('Update institutes that already exist (matched by index no.)') }}</label>
            <div class="flex justify-end"><button class="btn-primary"><x-icon name="upload" />{{ __('Import') }}</button></div>
        </form>
        <aside class="sheet sheet-pad self-start text-sm">
            <h2 class="title mb-3">{{ __('Columns') }}</h2>
            <p class="mb-2">{{ __('The first row must have column names. Required:') }} <code>college_no</code>, <code>name</code>.</p>
            <p class="mb-3">{{ __('Optional:') }} <code>udise_no</code>, <code>district</code>, <code>taluka</code>, <code>address</code>, <code>pincode</code>, <code>principal_name</code>, <code>contact_email</code>, <code>contact_mobile</code>, <code>streams</code> (SCI|ART|COM|VOC).</p>
            <pre class="overflow-x-auto rounded-md bg-wash p-3 text-xs">college_no,name,district,streams
56.01.001,DEOGIRI COLLEGE,Chh. Sambhajinagar,SCI|ART</pre>
        </aside>
    </div>
</x-layouts.portal>
