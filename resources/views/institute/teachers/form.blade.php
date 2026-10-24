@php use App\Support\Codes; $editing = $teacher->exists; @endphp
<x-layouts.portal :title="$editing ? $teacher->full_name : __('Add a teacher')">
    <x-page-header :title="$editing ? __('Edit teacher') : __('Add a teacher')" :back="route('institute.teachers.index')" />
    <form method="POST" action="{{ $editing ? route('institute.teachers.update', $teacher) : route('institute.teachers.store') }}" class="grid max-w-4xl gap-6">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Teacher') }}</h2>
            <div class="fieldset">
                <x-form.input name="full_name" :label="__('Full name (surname first)')" :value="$teacher->full_name" required class="uppercase" span />
                <x-form.select name="gender" :label="__('Gender')" :options="Codes::options(Codes::GENDERS)" :value="$teacher->gender" />
                <x-form.input name="dob" type="date" :label="__('Date of birth')" :value="$teacher->dob?->format('Y-m-d')" />
                <x-form.input name="mobile" type="tel" :label="__('Mobile number')" :value="$teacher->mobile" required inputmode="numeric" maxlength="10" />
                <x-form.input name="email" type="email" :label="__('Email')" :value="$teacher->email" />
                <x-form.input name="qualification" :label="__('Qualification')" :value="$teacher->qualification" placeholder="M.Sc., B.Ed." />
                <x-form.input name="designation" :label="__('Designation')" :value="$teacher->designation" placeholder="{{ __('Lecturer') }}" />
                <x-form.select name="subject_id" :label="__('Main subject')" :options="$subjects->mapWithKeys(fn ($s) => [$s->id => $s->code . ' · ' . $s->label])" :value="$teacher->subject_id" />
                <x-form.select name="appointment_type" :label="__('Appointment')" :options="Codes::options(Codes::APPOINTMENT_TYPES)" :value="$teacher->appointment_type" />
                <x-form.input name="joined_on" type="date" :label="__('Joined on')" :value="$teacher->joined_on?->format('Y-m-d')" />
                <x-form.input name="experience_years" type="number" :label="__('Teaching experience (years)')" :value="$teacher->experience_years" min="0" max="45" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ __('Board duties') }}</h2>
            <p class="muted mb-5">{{ __('Duties this teacher can take for the board exam. The board reviews these before appointment.') }}</p>
            @php $roles = old('duty_roles', $teacher->duty_roles ?? []); @endphp
            <div class="grid gap-2 sm:grid-cols-3">
                @foreach (Codes::options(Codes::DUTY_ROLES) as $k => $l)
                    <label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-sheet px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                        <input type="checkbox" name="duty_roles[]" value="{{ $k }}" class="check" @checked(in_array($k, $roles, true))> {{ $l }}
                    </label>
                @endforeach
            </div>
            <div class="mt-5 fieldset">
                <x-form.input name="examiner_years" type="number" :label="__('Years worked as examiner / moderator')" :value="$teacher->examiner_years" min="0" max="45" />
                <x-form.input name="last_appointment_no" :label="__('Last board appointment no.')" :value="$teacher->last_appointment_no" />
                <label class="flex items-center gap-3 sm:col-span-2"><input type="checkbox" name="available_for_duty" value="1" class="check" @checked(old('available_for_duty', $teacher->available_for_duty))> {{ __('Available for board duty this year') }}</label>
                @if ($editing)<label class="flex items-center gap-3 sm:col-span-2"><input type="hidden" name="is_active" value="0"><input type="checkbox" name="is_active" value="1" class="check" @checked(old('is_active', $teacher->is_active))> {{ __('Currently working at this college') }}</label>@endif
            </div>
            @if ($editing && $teacher->board_status === 'approved')<p class="mt-4 text-sm muted">{{ __('Changing duties or subject sends the teacher back to the board for review.') }}</p>@endif
        </section>
        <div class="flex flex-wrap justify-end gap-3">
            @if ($editing)
                <button form="delete-teacher" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Remove') }}</button>
            @endif
            <a href="{{ route('institute.teachers.index') }}" class="btn-quiet">{{ __('Cancel') }}</a>
            <button class="btn-primary">{{ __('Save') }}</button>
        </div>
    </form>
    @if ($editing)
        <form id="delete-teacher" method="POST" action="{{ route('institute.teachers.destroy', $teacher) }}" onsubmit="return confirm(@js(__('Remove :name?', ['name' => $teacher->full_name])))">@csrf @method('DELETE')</form>
    @endif
</x-layouts.portal>
