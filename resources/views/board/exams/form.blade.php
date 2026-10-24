@php use App\Support\Codes; $editing = $exam->exists; $types = old('candidate_types', $exam->candidate_types ?? []); @endphp
<x-layouts.portal :title="$editing ? $exam->name : __('New exam')">
    <x-page-header :title="$editing ? __('Edit exam') : __('New exam')" :back="route('board.exams.index')" />
    @if ($hasForms)<div class="alert-warn mb-6 max-w-4xl"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" /><p>{{ __('Students have already filled forms for this exam. Fee changes apply only to forms paid from now on.') }}</p></div>@endif
    <form method="POST" action="{{ $editing ? route('board.exams.update', $exam) : route('board.exams.store') }}" class="grid max-w-4xl gap-6">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Exam') }}</h2>
            <div class="fieldset">
                <x-form.input name="name" :label="__('Name shown to students')" :value="$exam->name" required span placeholder="HSC Examination February–March 2027" />
                <x-form.input name="code" :label="__('Short code')" :value="$exam->code" required class="uppercase" placeholder="HSC27FEB" />
                <x-form.select name="session" :label="__('Session')" :options="['FEB-MAR' => __('February–March'), 'JUL-AUG' => __('July–August (supplementary)')]" :value="$exam->session" required />
                <x-form.input name="year" type="number" :label="__('Exam year')" :value="$exam->year" required />
                <x-form.input name="academic_year" :label="__('Academic year')" :value="$exam->academic_year" required placeholder="2026-27" />
                <x-form.select name="stream_id" :label="__('Stream')" :options="$streams->mapWithKeys(fn ($s) => [$s->id => $s->label])" :value="$exam->stream_id" :placeholder="__('All streams')" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-5">{{ __('Dates') }}</h2>
            <div class="fieldset">
                <x-form.input name="opens_at" type="date" :label="__('Forms open on')" :value="$exam->opens_at?->format('Y-m-d')" required />
                <x-form.input name="closes_at" type="date" :label="__('Last date (normal fee)')" :value="$exam->closes_at?->format('Y-m-d')" required />
                <x-form.input name="late_closes_at" type="date" :label="__('Last date with late fee')" :value="$exam->late_closes_at?->format('Y-m-d')" :hint="__('Leave empty for no late-fee window.')" />
                <div></div>
                <x-form.input name="exam_starts_on" type="date" :label="__('Exam starts on')" :value="$exam->exam_starts_on?->format('Y-m-d')" />
                <x-form.input name="exam_ends_on" type="date" :label="__('Exam ends on')" :value="$exam->exam_ends_on?->format('Y-m-d')" />
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ __('Who can apply, and the fee') }}</h2>
            <p class="muted mb-5">{{ __('Tick each candidate type allowed for this exam and enter its fee in rupees.') }}</p>
            <div class="table-wrap">
                <table class="table">
                    <thead><tr><th>{{ __('Candidate type') }}</th><th>{{ __('Fee (₹)') }}</th><th>{{ __('Late fee (₹)') }}</th></tr></thead>
                    <tbody>
                    @foreach (Codes::options(Codes::CANDIDATE_TYPES) as $k => $l)
                        <tr x-data="{ on: @js(in_array($k, $types, true)) }">
                            <td><label class="flex items-center gap-3 font-semibold"><input type="checkbox" name="candidate_types[]" value="{{ $k }}" class="check" x-model="on"> {{ $l }}</label></td>
                            <td><input type="number" name="fee[{{ $k }}]" min="0" class="input w-32" value="{{ old("fee.$k", $fees[$k]?->fee) }}" :disabled="!on" :required="on" aria-label="{{ __('Fee for :type', ['type' => $l]) }}">@error("fee.$k")<p class="error">{{ $message }}</p>@enderror</td>
                            <td><input type="number" name="late_fee[{{ $k }}]" min="0" class="input w-32" value="{{ old("late_fee.$k", $fees[$k]?->late_fee) }}" :disabled="!on" aria-label="{{ __('Late fee for :type', ['type' => $l]) }}"></td>
                        </tr>
                    @endforeach
                    </tbody>
                </table>
            </div>
            @error('candidate_types')<p class="error mt-2">{{ $message }}</p>@enderror
        </section>
        <section class="sheet sheet-pad">
            <x-form.textarea name="instructions" :label="__('Instructions for students (shown on the form)')" :value="$exam->instructions" rows="4" />
            <label class="mt-5 flex items-start gap-3"><input type="checkbox" name="is_published" value="1" class="check mt-0.5" @checked(old('is_published', $exam->is_published))>
                <span><span class="font-semibold">{{ __('Published') }}</span><span class="block text-sm muted">{{ __('Students can apply between the dates above only when the exam is published.') }}</span></span></label>
        </section>
        <div class="flex flex-wrap justify-end gap-3">
            @if ($editing && ! $hasForms)<button form="delete-exam" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Delete') }}</button>@endif
            <a href="{{ route('board.exams.index') }}" class="btn-quiet">{{ __('Cancel') }}</a>
            <button class="btn-primary">{{ __('Save exam') }}</button>
        </div>
    </form>
    @if ($editing && ! $hasForms)
        <form id="delete-exam" method="POST" action="{{ route('board.exams.destroy', $exam) }}" onsubmit="return confirm(@js(__('Delete :name?', ['name' => $exam->name])))">@csrf @method('DELETE')</form>
    @endif
</x-layouts.portal>
