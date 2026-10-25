@php
    use App\Support\Codes;
    $editing = $student->exists;
    $title = $editing ? __('Edit :name', ['name' => $student->full_name]) : __('Add a student');
    $sections = [
        'college' => __('Board and college'), 'personal' => __('Personal details'), 'contact' => __('Contact and address'),
        'reservation' => __('Category and medium'), 'uploads' => __('Photo and signature'), 'previous' => __('Previous exams'),
        'bank' => __('Fee reimbursement'),
    ];
@endphp
<x-layouts.portal :title="$title">
    <x-page-header :title="$title" :back="route('student.dashboard')"
        :subtitle="__('Write names in English capital letters exactly as on the school leaving certificate. Fields marked * are required.')" />

    <form method="POST" enctype="multipart/form-data" action="{{ $editing ? route('student.students.update', $student) : route('student.students.store') }}"
          x-data="{
              board: @js((string) old('board_id', $student->board_id)),
              streams: @js($streamsByBoard),
              stream: @js((string) old('stream_id', $student->stream_id)),
              hasStreams: @js($boards->pluck('has_streams', 'id')),
              eligibility: @js((string) old('eligibility_cert_issued', $student->eligibility_cert_issued === null ? '' : (int) $student->eligibility_cert_issued)),
          }"
          class="grid gap-8 lg:grid-cols-[13rem_1fr]">
        @csrf
        @if ($editing) @method('PUT') @endif

        <nav class="no-print hidden lg:block" aria-label="{{ __('Sections') }}">
            <ol class="sticky top-24 grid gap-1 rounded-xl border border-rule bg-sheet p-2 text-sm shadow-sm">
                @foreach ($sections as $id => $label)
                    <li><a href="#{{ $id }}" class="nav-link py-2"><span class="kbd-code">{{ $loop->iteration }}</span>{{ $label }}</a></li>
                @endforeach
            </ol>
        </nav>

        <div class="grid min-w-0 gap-6">
            {{-- 1. Board and college --}}
            <section id="college" class="sheet sheet-pad scroll-mt-24 rise">
                <h2 class="title mb-5">{{ $sections['college'] }}</h2>
                @if ($locked)
                    <div class="alert-info mb-5"><x-icon name="lock" class="mt-0.5 size-5 shrink-0" /><p>{{ __('This student has a submitted form, so the board cannot be changed. Ask the college to correct other details if the form is already with them.') }}</p></div>
                @endif
                <fieldset class="field">
                    <legend class="label">{{ __('Board') }}<span class="req"> *</span></legend>
                    <div class="grid gap-3 sm:grid-cols-2">
                        @foreach ($boards as $b)
                            <label class="flex cursor-pointer items-start gap-3 rounded-md border border-rule-strong bg-sheet p-4 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                                <input type="radio" name="board_id" value="{{ $b->id }}" class="check mt-1" x-model="board" @disabled($locked) @checked((string) old('board_id', $student->board_id) === (string) $b->id) required>
                                <span><span class="block font-display text-2xl font-bold" style="font-stretch:115%">{{ $b->short_name }}</span><span class="text-sm muted">{{ $b->label }}</span></span>
                            </label>
                        @endforeach
                    </div>
                    @if ($locked)<input type="hidden" name="board_id" value="{{ $student->board_id }}">@endif
                    @error('board_id')<p class="error">{{ $message }}</p>@enderror
                </fieldset>

                <div class="mt-5 fieldset">
                    <div class="field span-2" x-data="institutePicker({ url: @js(route('lookup.institutes')), initialId: @js(old('institute_id', $student->institute_id)), initialLabel: @js($institute?->display_name), boardId: @js((string) $student->board_id) })"
                         x-effect="boardId = board" @click.outside="open = false">
                        <label for="institute_q" class="label">{{ __('College / school') }}<span class="req"> *</span></label>
                        <div class="relative">
                            <x-icon name="search" class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-3" />
                            <input id="institute_q" type="text" class="input pl-10" autocomplete="off" x-model="query" @input.debounce.250ms="search()" @keydown="key($event)"
                                   placeholder="{{ __('Type the college name, index number or UDISE') }}" role="combobox" :aria-expanded="open" aria-controls="institute_list"
                                   @error('institute_id') aria-invalid="true" @enderror>
                            <input type="hidden" name="institute_id" :value="selectedId">
                            <ul id="institute_list" role="listbox" x-show="open" x-cloak class="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-rule bg-sheet py-1 shadow-lg">
                                <template x-for="(item, i) in results" :key="item.id">
                                    <li role="option" :aria-selected="i === active" @click="choose(item)" @mouseenter="active = i"
                                        class="cursor-pointer px-3 py-2" :class="i === active && 'bg-board-soft'">
                                        <p class="font-medium" x-text="item.label"></p><p class="text-xs muted" x-text="item.meta"></p>
                                    </li>
                                </template>
                                <li x-show="!loading && results.length === 0" class="px-3 py-2 muted">{{ __('No match. Try the college index number.') }}</li>
                            </ul>
                        </div>
                        <p class="hint">{{ __('The college receives and verifies the form.') }}</p>
                        @error('institute_id')<p class="error">{{ __('Choose the college from the list.') }}</p>@enderror
                    </div>

                    <div class="field" x-show="hasStreams[board]" x-cloak>
                        <label for="stream_id" class="label">{{ __('Stream') }}<span class="req"> *</span></label>
                        <select id="stream_id" name="stream_id" class="select" x-model="stream" :required="hasStreams[board]" @error('stream_id') aria-invalid="true" @enderror>
                            <option value="">{{ __('Select') }}</option>
                            <template x-for="s in (streams[board] || [])" :key="s.id"><option :value="String(s.id)" x-text="s.label" :selected="String(s.id) === stream"></option></template>
                        </select>
                        @error('stream_id')<p class="error">{{ $message }}</p>@enderror
                    </div>
                </div>
            </section>

            {{-- 2. Personal --}}
            <section id="personal" class="sheet sheet-pad scroll-mt-24">
                <h2 class="title mb-5">{{ $sections['personal'] }}</h2>
                <div class="fieldset">
                    <x-form.input name="surname" :label="__('Surname')" :value="$student->surname" required class="uppercase" autocomplete="family-name" />
                    <x-form.input name="first_name" :label="__('First name')" :value="$student->first_name" required class="uppercase" autocomplete="given-name" />
                    <x-form.input name="middle_name" :label="__('Father’s / husband’s name')" :value="$student->middle_name" class="uppercase" />
                    <x-form.input name="mother_name" :label="__('Mother’s first name')" :value="$student->mother_name" required class="uppercase" />
                    <x-form.select name="gender" :label="__('Gender')" :options="Codes::options(Codes::GENDERS)" :value="$student->gender" required />
                    <x-form.input name="dob" type="date" :label="__('Date of birth')" :value="$student->dob?->format('Y-m-d')" required max="{{ now()->subYears(10)->format('Y-m-d') }}" />
                    <x-form.input name="aadhaar" :label="__('Aadhaar number')" inputmode="numeric" maxlength="14" placeholder="XXXX XXXX XXXX"
                        :hint="$student->aadhaar_last4 ? __('Saved: ending :d. Leave empty to keep it.', ['d' => $student->aadhaar_last4]) : __('Stored encrypted. Only the last 4 digits are shown.')" />
                    <x-form.input name="apaar_id" :label="__('APAAR ID')" :value="$student->apaar_id" inputmode="numeric" maxlength="12" />
                    <x-form.input name="pen_id" :label="__('UDISE+ PEN')" :value="$student->pen_id" />
                    <x-form.input name="saral_id" :label="__('Saral ID')" :value="$student->saral_id" />
                </div>
            </section>

            {{-- 3. Contact --}}
            <section id="contact" class="sheet sheet-pad scroll-mt-24">
                <h2 class="title mb-5">{{ $sections['contact'] }}</h2>
                <div class="fieldset">
                    <x-form.input name="mobile" type="tel" :label="__('Mobile number')" :value="$student->mobile" required inputmode="numeric" maxlength="10" autocomplete="tel-national" />
                    <x-form.input name="email" type="email" :label="__('Email')" :value="$student->email" autocomplete="email" />
                    <x-form.textarea name="address" :label="__('Residential address')" :value="$student->address" required rows="3" maxlength="300" />
                    <x-form.input name="village" :label="__('Village / city')" :value="$student->village" />
                    <x-form.input name="taluka" :label="__('Taluka')" :value="$student->taluka" />
                    <x-form.input name="district" :label="__('District')" :value="$student->district" />
                    <x-form.input name="pincode" :label="__('PIN code')" :value="$student->pincode" inputmode="numeric" maxlength="6" />
                </div>
            </section>

            {{-- 4. Reservation --}}
            <section id="reservation" class="sheet sheet-pad scroll-mt-24">
                <h2 class="title mb-5">{{ $sections['reservation'] }}</h2>
                <div class="fieldset">
                    <x-form.select name="category" :label="__('Category')" :options="Codes::options(Codes::CATEGORIES)" :value="$student->category" required />
                    <x-form.select name="minority_religion" :label="__('Religion (minority)')" :options="Codes::options(Codes::RELIGIONS)" :value="$student->minority_religion" />
                    <x-form.select name="medium" :label="__('Medium of instruction')" :options="Codes::options(Codes::MEDIUMS)" :value="$student->medium" required />
                    <x-form.select name="divyang" :label="__('Divyang (disability)')" :options="Codes::options(Codes::DIVYANG)" :value="$student->divyang ?? 'NONE'" />
                    <x-form.yesno name="ssc_from_maharashtra" :label="__('Passed SSC from Maharashtra board?')" :value="$student->ssc_from_maharashtra" />
                    <fieldset class="field">
                        <legend class="label">{{ __('Eligibility certificate issued?') }}</legend>
                        <div class="flex gap-2">
                            @foreach (['1' => __('Yes'), '0' => __('No')] as $v => $text)
                                <label class="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-sheet px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                                    <input type="radio" name="eligibility_cert_issued" value="{{ $v }}" class="check" x-model="eligibility"> {{ $text }}
                                </label>
                            @endforeach
                        </div>
                    </fieldset>
                    <div x-show="eligibility === '1'" x-cloak class="span-2 sm:col-span-1">
                        <x-form.input name="eligibility_cert_no" :label="__('Eligibility certificate number')" :value="$student->eligibility_cert_no" />
                    </div>
                </div>
            </section>

            {{-- 5. Photo and signature --}}
            <section id="uploads" class="sheet sheet-pad scroll-mt-24">
                <h2 class="title mb-2">{{ $sections['uploads'] }}</h2>
                <p class="muted mb-5">{{ __('Recent passport photo on a light background (JPG/PNG, under 300 KB). Signature in black or blue ink on white paper (under 200 KB).') }}</p>
                <div class="grid gap-6 sm:grid-cols-2">
                    @foreach (['photo' => [__('Photo'), $student->photoUrl(), 'h-40 w-32 object-cover'], 'signature' => [__('Signature'), $student->signatureUrl(), 'h-20 w-56 object-contain bg-white']] as $field => [$label, $url, $cls])
                        <div class="field" x-data="imageField(@js($url))">
                            <span class="label">{{ $label }}@if (! $url)<span class="req"> *</span>@endif</span>
                            <label class="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-rule-strong bg-wash/50 p-5 text-center hover:border-board">
                                <template x-if="preview"><img :src="preview" alt="" class="{{ $cls }} rounded border border-rule"></template>
                                <template x-if="!preview"><x-icon name="upload" class="size-8 text-ink-3" /></template>
                                <span class="font-semibold text-board" x-text="preview ? @js(__('Change')) : @js(__('Choose file'))"></span>
                                <input type="file" name="{{ $field }}" accept="image/jpeg,image/png" class="sr-only" @change="pick($event)" @if (! $url) required @endif>
                            </label>
                            @error($field)<p class="error">{{ $message }}</p>@enderror
                        </div>
                    @endforeach
                </div>
            </section>

            {{-- 6. Previous exams --}}
            <section id="previous" class="sheet sheet-pad scroll-mt-24">
                <h2 class="title mb-2">{{ $sections['previous'] }}</h2>
                <p class="muted mb-5">{{ __('Fill the exams already passed. Leave a row empty if it does not apply.') }}</p>
                <div class="grid gap-5">
                    @foreach ($previous as $exam => $row)
                        <fieldset class="rounded-md border border-rule p-4">
                            <legend class="px-1 font-semibold">{{ ['SSC' => __('SSC (Std X)'), 'XI' => __('Std XI'), 'HSC' => __('HSC (Std XII) — earlier attempt')][$exam] }}</legend>
                            <div class="grid gap-4 sm:grid-cols-5">
                                <x-form.input :name="'previous['.$exam.'][seat_no]'" :label="__('Seat no.')" :value="$row?->seat_no" class="uppercase" />
                                <x-form.select :name="'previous['.$exam.'][month]'" :label="__('Month')" :options="Codes::options(Codes::MONTHS)" :value="$row?->month" />
                                <x-form.input :name="'previous['.$exam.'][year]'" type="number" :label="__('Year')" :value="$row?->year" min="1990" max="{{ now()->year }}" />
                                <x-form.input :name="'previous['.$exam.'][percentage]'" type="number" step="0.01" :label="__('Marks %')" :value="$row?->percentage" min="0" max="100" />
                                <x-form.input :name="'previous['.$exam.'][board_or_college]'" :label="__('Board / college')" :value="$row?->board_or_college" />
                            </div>
                        </fieldset>
                    @endforeach
                </div>
            </section>

            {{-- 7. Bank --}}
            <section id="bank" class="sheet sheet-pad scroll-mt-24" x-data="{ open: @js(filled($student->bank_account_no) || filled($student->revenue_circle_village)) }">
                <div class="flex flex-wrap items-center justify-between gap-3">
                    <div><h2 class="title">{{ $sections['bank'] }}</h2><p class="muted">{{ __('Only for students from drought-affected areas eligible for an exam fee refund.') }}</p></div>
                    <button type="button" class="btn-secondary btn-sm" @click="open = !open" :aria-expanded="open"><span x-text="open ? @js(__('Hide')) : @js(__('Add bank details'))"></span></button>
                </div>
                <div x-show="open" x-collapse x-cloak class="mt-5 fieldset">
                    <x-form.input name="revenue_circle_village" :label="__('Revenue circle and village')" :value="$student->revenue_circle_village" span />
                    <x-form.input name="bank_account_no" :label="__('Bank account number')" :value="$student->bank_account_no" inputmode="numeric" />
                    <x-form.input name="bank_ifsc" :label="__('IFSC code')" :value="$student->bank_ifsc" class="uppercase" maxlength="11" />
                    <x-form.select name="bank_account_holder" :label="__('Account belongs to')" :options="Codes::options(Codes::ACCOUNT_HOLDERS)" :value="$student->bank_account_holder" />
                </div>
            </section>

            <div class="sticky bottom-0 z-20 -mx-4 flex flex-wrap items-center justify-end gap-3 border-t border-rule bg-paper/95 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-lg sm:border">
                <a href="{{ route('student.dashboard') }}" class="btn-quiet mr-auto">{{ __('Cancel') }}</a>
                <button name="after" value="save" class="btn-secondary">{{ __('Save') }}</button>
                <button name="after" value="apply" class="btn-primary">{{ __('Save and fill exam form') }}<x-icon name="arrow-right" /></button>
            </div>
        </div>
    </form>
</x-layouts.portal>
