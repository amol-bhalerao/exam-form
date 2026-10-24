@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Exam forms')">
    <x-page-header :title="__('Exam forms')" :subtitle="__('Check each paid form, correct mistakes, then forward it to the board.')">
        <x-slot:actions>
            <a href="{{ route('institute.forms.export', request()->query()) }}" class="btn-secondary"><x-icon name="file-spreadsheet" />{{ __('Download Excel (CSV)') }}</a>
        </x-slot:actions>
    </x-page-header>

    @include('partials.status-tabs', ['route' => 'institute.forms.index', 'statuses' => ['submitted', 'returned', 'verified', 'board_returned', 'approved', 'rejected']])

    <form method="GET" class="filters">
        @if (request('status'))<input type="hidden" name="status" value="{{ request('status') }}">@endif
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name, application no. or mobile') }}"></div>
        <div class="field"><label class="label" for="exam">{{ __('Exam') }}</label><select id="exam" name="exam" class="select"><option value="">{{ __('All') }}</option>@foreach ($exams as $e)<option value="{{ $e->id }}" @selected(request('exam') == $e->id)>{{ $e->name }}</option>@endforeach</select></div>
        @if ($streams->count() > 1)
        <div class="field"><label class="label" for="stream">{{ __('Stream') }}</label><select id="stream" name="stream" class="select"><option value="">{{ __('All') }}</option>@foreach ($streams as $s)<option value="{{ $s->id }}" @selected(request('stream') == $s->id)>{{ $s->label }}</option>@endforeach</select></div>
        @endif
        <div class="field"><label class="label" for="type">{{ __('Candidate type') }}</label><select id="type" name="type" class="select"><option value="">{{ __('All') }}</option>@foreach (Codes::options(Codes::CANDIDATE_TYPES) as $k => $l)<option value="{{ $k }}" @selected(request('type') === $k)>{{ $l }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>

    @if ($drafts)<p class="mb-4 text-sm muted">{{ trans_choice(':count more form is being filled by students and is not paid yet.|:count more forms are being filled by students and are not paid yet.', $drafts, ['count' => $drafts]) }}</p>@endif

    @if ($forms->isEmpty())
        <x-empty :title="__('No forms match')" icon="file-check">{{ __('Try another status or clear the search.') }}</x-empty>
    @else
    <form method="POST" action="{{ route('institute.forms.bulk') }}" x-data="{ ids: [], all: false }">
        @csrf
        <div class="table-wrap">
            <table class="table">
                <thead><tr>
                    <th class="w-10"><input type="checkbox" class="check" aria-label="{{ __('Select all') }}" x-model="all" @change="ids = all ? @js($forms->pluck('id')->map(fn ($i) => (string) $i)) : []"></th>
                    <th>{{ __('Candidate') }}</th><th>{{ __('Application no.') }}</th><th>{{ __('Exam') }}</th><th>{{ __('Type') }}</th><th>{{ __('Status') }}</th><th class="num">{{ __('Fee') }}</th><th></th>
                </tr></thead>
                <tbody>
                @foreach ($forms as $a)
                    <tr>
                        <td><input type="checkbox" name="ids[]" value="{{ $a->id }}" class="check" x-model="ids" aria-label="{{ __('Select :name', ['name' => $a->student->full_name]) }}"></td>
                        <td><a href="{{ route('institute.forms.show', $a) }}" class="font-semibold text-ink">{{ $a->student->full_name }}</a><p class="text-sm muted">{{ $a->stream?->label }} · {{ $a->student->mobile }}</p></td>
                        <td class="tabular-nums whitespace-nowrap">{{ $a->application_no }}@if ($a->institute_seq)<p class="text-xs muted">{{ $a->institute_seq }}</p>@endif</td>
                        <td class="text-sm">{{ $a->exam->name }}</td>
                        <td class="text-sm">{{ $a->candidate_type_label }}</td>
                        <td><x-status :application="$a" /></td>
                        <td class="num">₹{{ number_format($a->fee_amount) }}</td>
                        <td class="text-right"><a href="{{ route('institute.forms.show', $a) }}" class="btn-secondary btn-sm">{{ in_array($a->status, ['submitted', 'board_returned']) ? __('Check') : __('Open') }}</a></td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
        <div class="bulkbar" x-show="ids.length" x-cloak x-transition>
            <span class="font-semibold"><span x-text="ids.length"></span> {{ __('selected') }}</span>
            <button name="action" value="verify" class="btn-ok btn-sm ml-auto" onclick="return confirm(@js(__('Verify the selected forms and forward them to the board?')))"><x-icon name="send" />{{ __('Verify and forward') }}</button>
            <button name="action" value="print" class="btn-secondary btn-sm" formtarget="_blank"><x-icon name="printer" />{{ __('Print selected') }}</button>
        </div>
    </form>
    <div class="mt-5">{{ $forms->links() }}</div>
    @endif
</x-layouts.portal>
