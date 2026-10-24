@php use App\Support\Codes; $s = $application->student; @endphp
<x-layouts.portal :title="__('Correct form :no', ['no' => $application->application_no])">
    <x-page-header :title="__('Correct details')" :subtitle="$s->full_name . ' · ' . $application->application_no" :back="route('institute.forms.show', $application)" />
    <div class="alert-info mb-6"><x-icon name="history" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Every correction is recorded in the form’s history with your name, so the student and the board can see what changed.') }}</p></div>

    <form method="POST" action="{{ route('institute.forms.update', $application) }}" class="grid gap-6"
          x-data="subjectPicker({ selected: @js($selected), locked: [], checkUrl: @js(route('institute.forms.check', $application)) })">
        @csrf @method('PUT')
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Candidate') }}</h2>
            <div class="fieldset">
                <x-form.input name="surname" :label="__('Surname')" :value="$s->surname" required class="uppercase" />
                <x-form.input name="first_name" :label="__('First name')" :value="$s->first_name" required class="uppercase" />
                <x-form.input name="middle_name" :label="__('Father’s / husband’s name')" :value="$s->middle_name" class="uppercase" />
                <x-form.input name="mother_name" :label="__('Mother’s first name')" :value="$s->mother_name" required class="uppercase" />
                <x-form.select name="gender" :label="__('Gender')" :options="Codes::options(Codes::GENDERS)" :value="$s->gender" required />
                <x-form.input name="dob" type="date" :label="__('Date of birth')" :value="$s->dob?->format('Y-m-d')" required />
                <x-form.select name="category" :label="__('Category')" :options="Codes::options(Codes::CATEGORIES)" :value="$s->category" required />
                <x-form.select name="medium" :label="__('Medium of instruction')" :options="Codes::options(Codes::MEDIUMS)" :value="$s->medium" required />
                <x-form.select name="minority_religion" :label="__('Religion (minority)')" :options="Codes::options(Codes::RELIGIONS)" :value="$s->minority_religion" />
                <x-form.select name="divyang" :label="__('Divyang (disability)')" :options="Codes::options(Codes::DIVYANG)" :value="$s->divyang ?? 'NONE'" />
                <x-form.input name="mobile" :label="__('Mobile number')" :value="$s->mobile" required inputmode="numeric" maxlength="10" />
                <x-form.textarea name="address" :label="__('Residential address')" :value="$s->address" required rows="2" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Exam details') }}</h2>
            <div class="fieldset">
                <x-form.select name="exemption_status" :label="__('Exemption')" :options="['NON_EXEMPTED' => __('Non-exempted'), 'EXEMPTED' => __('Exempted')]" :value="$application->exemption_status" required />
                <x-form.input name="exemptions_claimed" type="number" :label="__('Number of exempted subjects')" :value="$application->exemptions_claimed" min="0" max="8" />
                <x-form.select name="subject_group" :label="__('Subject group')" :options="Codes::options(Codes::SUBJECT_GROUPS)" :value="$application->subject_group" />
                <x-form.input name="centre_no" :label="__('Exam centre no.')" :value="$application->centre_no" />
                <x-form.input name="index_no" :label="__('Index no.')" :value="$application->index_no" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 class="title">{{ __('Subjects') }}</h2>
                <span class="text-sm font-semibold muted"><span x-text="count"></span> {{ __('chosen') }}</span>
            </div>
            <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                @foreach ($subjects as $subject)
                    <button type="button" class="subject-chip" @click="toggle({{ $subject->id }})" :aria-pressed="has({{ $subject->id }})">
                        <span class="box"><x-icon name="check" class="size-4" x-show="has({{ $subject->id }})" /></span>
                        <span class="kbd-code">{{ $subject->code }}</span><span class="min-w-0 flex-1 font-medium leading-snug">{{ $subject->label }}</span>
                    </button>
                @endforeach
            </div>
            <template x-for="id in [...selected]" :key="id"><input type="hidden" name="subject_ids[]" :value="id"></template>
            <div class="mt-4 grid gap-2" aria-live="polite">
                <template x-for="e in (result?.errors || [])"><p class="alert-bad text-sm" x-text="e.message"></p></template>
                <template x-for="w in (result?.warnings || [])"><p class="alert-warn text-sm" x-text="w.message"></p></template>
                <template x-if="result && result.ok && !(result.warnings || []).length"><p class="alert-ok text-sm">{{ __('This choice follows the board rules.') }}</p></template>
            </div>
            @error('subject_ids')<p class="error mt-2">{{ $message }}</p>@enderror
            <h3 class="mt-6 mb-3 font-semibold">{{ __('Answer language') }}</h3>
            <div class="grid gap-2 sm:grid-cols-2">
                @foreach ($subjects as $subject)
                    <label class="flex items-center gap-3" x-show="has({{ $subject->id }})">
                        <span class="kbd-code">{{ $subject->code }}</span><span class="min-w-0 flex-1 truncate">{{ $subject->label }}</span>
                        <select name="answer_language[{{ $subject->id }}]" class="select w-40">
                            @foreach (Codes::options(Codes::MEDIUMS) as $code => $label)<option value="{{ $code }}" @selected(($answerLanguages[$subject->id] ?? $s->medium) === $code)>{{ $label }}</option>@endforeach
                        </select>
                    </label>
                @endforeach
            </div>
        </section>
        <section class="sheet sheet-pad">
            <x-form.textarea name="note" :label="__('Reason for the correction (shown in history)')" rows="2" maxlength="500" />
        </section>
        <div class="flex justify-end gap-3">
            <a href="{{ route('institute.forms.show', $application) }}" class="btn-quiet">{{ __('Cancel') }}</a>
            <button class="btn-primary"><x-icon name="circle-check" />{{ __('Save corrections') }}</button>
        </div>
    </form>
</x-layouts.portal>
