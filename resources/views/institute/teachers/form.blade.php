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
                <x-form.select name="category" :label="__('Category')" :options="Codes::options(Codes::CATEGORIES)" :value="$teacher->category" />
                <x-form.input name="mobile" type="tel" :label="__('Mobile number')" :value="$teacher->mobile" required inputmode="numeric" maxlength="10" />
                <x-form.input name="email" type="email" :label="__('Email')" :value="$teacher->email" />
                <x-form.input name="qualification" :label="__('Qualification')" :value="$teacher->qualification" placeholder="M.Sc., B.Ed." />
                <x-form.input name="designation" :label="__('Designation')" :value="$teacher->designation" placeholder="{{ __('Lecturer') }}" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Teaching') }}</h2>
            <div class="fieldset">
                <x-form.select name="subject_id" :label="__('Main subject')" :options="$subjects->mapWithKeys(fn ($s) => [$s->id => $s->code . ' · ' . $s->label])" :value="$teacher->subject_id" />
                <x-form.select name="second_subject_id" :label="__('Second subject (if any)')" :options="$subjects->mapWithKeys(fn ($s) => [$s->id => $s->code . ' · ' . $s->label])" :value="$teacher->second_subject_id" />
                <x-form.select name="medium" :label="__('Medium of teaching')" :options="Codes::options(Codes::MEDIUMS)" :value="$teacher->medium" />
                <x-form.input name="teaches_classes" :label="__('Classes taught')" :value="$teacher->teaches_classes" placeholder="XI, XII" />
                <x-form.input name="experience_years" type="number" :label="__('Total teaching experience (years)')" :value="$teacher->experience_years" min="0" max="45" :hint="__('Including service at earlier colleges.')" />
            </div>
        </section>
        @php $ruleAge = \App\Support\Retirement::age(); @endphp
        <section class="sheet sheet-pad" x-data="{
                dob: @js(old('dob', $teacher->dob?->format('Y-m-d'))), age: @js(old('retirement_age', $teacher->retirement_age)), joined: @js(old('joined_on', $teacher->joined_on?->format('Y-m-d'))),
                rule: {{ $ruleAge }},
                get retire() {
                    if (!this.dob) return null;
                    const [y, m, d] = this.dob.split('-').map(Number), a = Number(this.age) || this.rule;
                    // last day of the month in which the age is reached; born on the 1st → last day of the previous month
                    return d === 1 ? new Date(y + a, m - 1, 0) : new Date(y + a, m, 0);
                },
                span(from, to) {
                    if (!from || !to || to < from) return null;
                    let mo = (to.getFullYear() - from.getFullYear()) * 12 + to.getMonth() - from.getMonth();
                    if (to.getDate() < from.getDate()) mo--;
                    const y = Math.floor(mo / 12), r = mo % 12;
                    return (y ? y + ' ' + @js(__('years')) + ' ' : '') + (r ? r + ' ' + @js(__('months')) : (y ? '' : @js(__('less than a month'))));
                },
                fmt(dt) { return dt ? String(dt.getDate()).padStart(2, '0') + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + dt.getFullYear() : '—'; },
                get nowAge() { if (!this.dob) return null; const b = new Date(this.dob), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; },
             }">
            <h2 class="title mb-5">{{ __('Service and retirement') }}</h2>
            <div class="fieldset">
                <div class="field"><label class="label" for="f_dob">{{ __('Date of birth') }}</label><input id="f_dob" name="dob" type="date" class="input" x-model="dob" value="{{ old('dob', $teacher->dob?->format('Y-m-d')) }}">@error('dob')<p class="error">{{ $message }}</p>@enderror</div>
                <div class="field"><label class="label" for="f_joined_on">{{ __('Joined this college on') }}</label><input id="f_joined_on" name="joined_on" type="date" class="input" x-model="joined" value="{{ old('joined_on', $teacher->joined_on?->format('Y-m-d')) }}">@error('joined_on')<p class="error">{{ $message }}</p>@enderror</div>
                <x-form.select name="appointment_type" :label="__('Appointment')" :options="Codes::options(Codes::APPOINTMENT_TYPES)" :value="$teacher->appointment_type" />
                <x-form.input name="shalarth_id" :label="__('Shalarth ID')" :value="$teacher->shalarth_id" maxlength="30" :hint="__('Payroll ID of aided teachers, if any.')" />
                <x-form.input name="approval_no" :label="__('Approval (मान्यता) order no.')" :value="$teacher->approval_no" maxlength="60" />
                <x-form.input name="approval_date" type="date" :label="__('Approval date')" :value="$teacher->approval_date?->format('Y-m-d')" />
                <div class="field"><label class="label" for="f_retirement_age">{{ __('Retirement age') }}</label><input id="f_retirement_age" name="retirement_age" type="number" min="50" max="70" class="input" x-model="age" placeholder="{{ $ruleAge }}" value="{{ old('retirement_age', $teacher->retirement_age) }}">
                    <p class="hint">{{ __('Leave empty to use the rule (:age years). Fill only if a different age applies to this teacher.', ['age' => $ruleAge]) }}</p>@error('retirement_age')<p class="error">{{ $message }}</p>@enderror</div>
            </div>
            <div class="mt-5 grid gap-3 sm:grid-cols-4" x-show="dob" x-cloak>
                <div class="rounded-lg bg-board-soft p-3"><p class="text-xs font-semibold uppercase tracking-wide text-ink-2">{{ __('Present age') }}</p><p class="mt-1 text-lg font-bold text-ink" x-text="nowAge + ' ' + @js(__('years'))"></p></div>
                <div class="rounded-lg bg-rani-soft p-3"><p class="text-xs font-semibold uppercase tracking-wide text-ink-2">{{ __('Date of retirement') }}</p><p class="mt-1 text-lg font-bold text-ink" x-text="fmt(retire)"></p></div>
                <div class="rounded-lg p-3" :class="retire && retire < new Date() ? 'bg-omr-soft' : 'bg-leaf-soft'"><p class="text-xs font-semibold uppercase tracking-wide text-ink-2">{{ __('Remaining service') }}</p><p class="mt-1 text-lg font-bold text-ink" x-text="span(new Date(), retire) ?? @js(__('Retired'))"></p></div>
                <div class="rounded-lg bg-marigold-soft p-3"><p class="text-xs font-semibold uppercase tracking-wide text-ink-2">{{ __('Service in this college') }}</p><p class="mt-1 text-lg font-bold text-ink" x-text="joined ? (span(new Date(joined), new Date()) ?? '—') : '—'"></p></div>
            </div>
            <p class="mt-3 text-xs muted" x-show="dob" x-cloak>{{ __('Retirement is on the last day of the month in which the teacher reaches the retirement age; a teacher born on the 1st retires on the last day of the previous month.') }}</p>
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
