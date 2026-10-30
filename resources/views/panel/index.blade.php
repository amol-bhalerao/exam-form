@php use App\Support\Codes; $route = $isBoard ? 'board.panel' : 'institute.panel'; @endphp
<x-layouts.portal :title="__('Print panel list')">
    <x-page-header :title="__('Print panel list')" :subtitle="__('Choose the teachers, the columns and the page description, then print or save as PDF — for signatures or for the board office.')" />

    <form method="GET" action="{{ route($route) }}" class="grid gap-6" x-data>
        <section class="sheet sheet-pad">
            <h2 class="title mb-4">{{ __('1. Which teachers') }}</h2>
            <div class="field"><span class="label">{{ __('Duty') }}</span>
                <div class="flex flex-wrap gap-2">
                    @foreach (Codes::DUTY_ROLES as $k => $l)
                        <label class="chip cursor-pointer has-[input:checked]:border-board has-[input:checked]:bg-board-soft has-[input:checked]:font-semibold has-[input:checked]:text-board-deep">
                            <input type="checkbox" name="duties[]" value="{{ $k }}" class="sr-only" @checked(in_array($k, $f['duties'], true))>{{ __($l) }}</label>
                    @endforeach
                </div><p class="hint">{{ __('None ticked = all teachers.') }}</p></div>
            <div class="fieldset mt-4">
                <div class="field"><label class="label" for="subject">{{ __('Subject') }}</label>
                    <select id="subject" name="subject" class="select"><option value="">{{ __('All subjects') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}" @selected($f['subject'] === $s->id)>{{ $s->code }} · {{ $s->label }}</option>@endforeach</select></div>
                <div class="field"><label class="label" for="status">{{ __('Board review') }}</label>
                    <select id="status" name="status" class="select">@foreach (['all' => __('All'), 'approved' => __('Approved'), 'pending' => __('Pending'), 'rejected' => __('Not approved')] as $k => $l)<option value="{{ $k }}" @selected($f['status'] === $k)>{{ $l }}</option>@endforeach</select></div>
                @if ($isBoard)
                    <div class="field"><label class="label" for="institute">{{ __('College / school') }}</label>
                        <select id="institute" name="institute" class="select"><option value="">{{ __('All') }}</option>@foreach ($institutes as $i)<option value="{{ $i->id }}" @selected($f['institute'] === $i->id)>{{ $i->college_no }} · {{ \Illuminate\Support\Str::limit($i->name, 60) }}</option>@endforeach</select></div>
                    <div class="field"><label class="label" for="district">{{ __('District') }}</label>
                        <select id="district" name="district" class="select"><option value="">{{ __('All') }}</option>@foreach ($districts as $d)<option value="{{ $d }}" @selected($f['district'] === $d)>{{ $d }}</option>@endforeach</select></div>
                @endif
                <div class="field"><label class="label" for="order">{{ __('Order') }}</label>
                    <select id="order" name="order" class="select"><option value="subject" @selected($f['order'] === 'subject')>{{ __('Subject-wise') }}</option><option value="name" @selected($f['order'] === 'name')>{{ __('By name') }}</option></select></div>
                <div class="field justify-end"><label class="flex min-h-11 items-center gap-2 font-semibold"><input type="checkbox" name="available" value="1" class="check" @checked($f['available'])>{{ __('Only teachers available for duty') }}</label></div>
            </div>
        </section>

        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ __('2. Columns to print') }}</h2>
            <p class="mb-4 text-sm muted">{{ __('Tick “Signature” to add a blank column for each teacher to sign.') }}</p>
            <div class="grid gap-2 sm:grid-cols-3 lg:grid-cols-4">
                @foreach ($columns as $k => [$l])
                    @continue($k === 'college' && ! $isBoard)
                    <label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-sheet px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                        <input type="checkbox" name="cols[]" value="{{ $k }}" class="check" @checked(in_array($k, $f['cols'], true))>
                        <span @class(['font-semibold text-rani' => $k === 'signature'])>{{ __($l) }}</span></label>
                @endforeach
            </div>
            <div class="mt-4 flex flex-wrap gap-4">
                <label class="flex items-center gap-2"><input type="radio" name="orientation" value="portrait" class="check" @checked($f['orientation'] === 'portrait')>{{ __('A4 portrait') }}</label>
                <label class="flex items-center gap-2"><input type="radio" name="orientation" value="landscape" class="check" @checked($f['orientation'] === 'landscape')>{{ __('A4 landscape (many columns)') }}</label>
                @if ($isBoard)<label class="flex items-center gap-2"><input type="hidden" name="per_college" value="0"><input type="checkbox" name="per_college" value="1" class="check" @checked($f['per_college'])>{{ __('Separate page for each college (to send for signatures)') }}</label>@endif
            </div>
        </section>

        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ __('3. Page description') }}</h2>
            <p class="mb-4 text-sm muted">{{ __('Printed at the top of every page. Edit the wording as needed.') }}</p>
            <div class="fieldset">
                <div class="field"><label class="label" for="exam">{{ __('Exam (optional)') }}</label>
                    <select id="exam" name="exam" class="select" onchange="document.getElementById('c_title').value=''"><option value="">{{ __('None') }}</option>@foreach ($exams as $e)<option value="{{ $e->id }}" @selected($f['exam'] === $e->id)>{{ $e->name }}</option>@endforeach</select>
                    <p class="hint">{{ __('Choosing an exam adds its name to the title. Clear the title box to rebuild it.') }}</p></div>
                <x-form.input name="c_due" type="date" :label="__('Return before (date)')" :value="$cover['due']" />
                <x-form.input name="c_title" :label="__('Title')" :value="$cover['title']" span />
                <x-form.input name="c_subtitle" :label="__('Description')" :value="$cover['subtitle']" span />
                <x-form.textarea name="c_note" :label="__('Instruction (:date is replaced by the date above)')" :value="$cover['note']" rows="2" />
                <x-form.input name="c_footer" :label="__('Signature line at the bottom')" :value="$cover['footer']" span :hint="__('Leave empty to print no signature line.')" />
            </div>
        </section>

        <div class="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-xl border border-rule bg-sheet/95 p-3 shadow-lg backdrop-blur">
            <p class="mr-auto font-semibold">{{ trans_choice(':count teacher selected|:count teachers selected', $teachers->count(), ['count' => $teachers->count()]) }}</p>
            <button class="btn-secondary"><x-icon name="eye" />{{ __('Update preview') }}</button>
            <button name="print" value="1" formtarget="_blank" class="btn-primary" @disabled($teachers->isEmpty())><x-icon name="printer" />{{ __('Print / Save PDF') }}</button>
        </div>
    </form>

    <section class="sheet mt-6 overflow-hidden">
        <h2 class="title p-5 pb-3">{{ __('Preview') }}</h2>
        @if ($teachers->isEmpty())
            <p class="px-5 pb-5 muted">{{ __('No teachers match these choices.') }}</p>
        @else
            <div class="table-wrap rounded-none border-x-0 border-b-0">@include('panel._table', ['rows' => $teachers->take(15), 'screen' => true])</div>
            @if ($teachers->count() > 15)<p class="p-4 text-sm muted">{{ __('… and :n more on the print.', ['n' => $teachers->count() - 15]) }}</p>@endif
        @endif
    </section>
</x-layouts.portal>
