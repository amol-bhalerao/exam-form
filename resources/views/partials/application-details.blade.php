{{-- Read-only view of an exam form, shared by student, institute and board screens. --}}
@php
    use App\Support\Codes;
    $s = $application->student;
    $prev = $s->previousExams->keyBy('exam');
@endphp
<div class="grid gap-6">
    <section class="sheet sheet-pad">
        <div class="flex flex-wrap items-start gap-5">
            <div class="flex gap-3">
                @if ($s->photoUrl())<img src="{{ $s->photoUrl() }}" alt="{{ __('Photo of :name', ['name' => $s->full_name]) }}" class="h-28 w-22 rounded border border-rule object-cover">@endif
                @if ($s->signatureUrl())<img src="{{ $s->signatureUrl() }}" alt="{{ __('Signature') }}" class="h-12 w-32 self-end rounded border border-rule bg-white object-contain p-1">@endif
            </div>
            <div class="min-w-0 flex-1 basis-56">
                <p class="title">{{ $s->full_name }}</p>
                <p class="muted">{{ __("Mother's name") }}: {{ $s->mother_name ?: '—' }}</p>
                <div class="mt-3 flex flex-wrap gap-2">
                    <span class="chip"><x-icon name="graduation-cap" class="size-4" />{{ $application->exam->name }}</span>
                    <span class="chip">{{ $application->candidate_type_label }}</span>
                    @if ($application->stream)<span class="chip">{{ $application->stream->label }}</span>@endif
                </div>
            </div>
            <dl class="grid grid-cols-[auto_auto] gap-x-6 gap-y-1 text-sm xl:ml-auto">
                <dt class="muted">{{ __('Application no.') }}</dt><dd class="font-semibold tabular-nums">{{ $application->application_no }}</dd>
                @if ($application->institute_seq)<dt class="muted">{{ __('Institute seq.') }}</dt><dd class="font-semibold tabular-nums">{{ $application->institute_seq }}</dd>@endif
                @if ($application->board_seq)<dt class="muted">{{ __('Board seq.') }}</dt><dd class="font-semibold tabular-nums">{{ $application->board_seq }}</dd>@endif
                <dt class="muted">{{ __('Fee') }}</dt><dd class="font-semibold">₹{{ number_format($application->fee_amount) }} @if ($application->isPaid())<span class="badge-ok ml-1">{{ __('Paid') }}</span>@else<span class="badge-pending ml-1">{{ __('Not paid') }}</span>@endif</dd>
            </dl>
        </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
        <section class="sheet sheet-pad">
            <h3 class="title mb-4">{{ __('Personal details') }}</h3>
            <dl class="dl">
                <dt>{{ __('Date of birth') }}</dt><dd>{{ $s->dob?->format('d M Y') ?? '—' }}</dd>
                <dt>{{ __('Gender') }}</dt><dd>{{ Codes::label(Codes::GENDERS, $s->gender) }}</dd>
                <dt>{{ __('Aadhaar') }}</dt><dd>{{ $s->masked_aadhaar ?? '—' }}</dd>
                <dt>{{ __('APAAR ID') }}</dt><dd>{{ $s->apaar_id ?: '—' }}</dd>
                <dt>{{ __('UDISE+ PEN') }}</dt><dd>{{ $s->pen_id ?: '—' }}</dd>
                <dt>{{ __('Mobile') }}</dt><dd>{{ $s->mobile ?: '—' }}</dd>
                <dt>{{ __('Email') }}</dt><dd class="break-all">{{ $s->email ?: '—' }}</dd>
                <dt>{{ __('Address') }}</dt><dd>{{ collect([$s->address, $s->village, $s->taluka, $s->district, $s->pincode])->filter()->implode(', ') ?: '—' }}</dd>
            </dl>
        </section>
        <section class="sheet sheet-pad">
            <h3 class="title mb-4">{{ __('Academic and reservation details') }}</h3>
            <dl class="dl">
                <dt>{{ __('Institute') }}</dt><dd>{{ $application->institute->display_name }}</dd>
                <dt>{{ __('Category') }}</dt><dd>{{ Codes::label(Codes::CATEGORIES, $s->category) }}</dd>
                <dt>{{ __('Minority religion') }}</dt><dd>{{ Codes::label(Codes::RELIGIONS, $s->minority_religion) }}</dd>
                <dt>{{ __('Medium of instruction') }}</dt><dd>{{ Codes::label(Codes::MEDIUMS, $s->medium) }}</dd>
                <dt>{{ __('Divyang') }}</dt><dd>{{ Codes::label(Codes::DIVYANG, $s->divyang ?: 'NONE') }}</dd>
                <dt>{{ __('SSC from Maharashtra') }}</dt><dd>{{ is_null($s->ssc_from_maharashtra) ? '—' : ($s->ssc_from_maharashtra ? __('Yes') : __('No')) }}</dd>
                <dt>{{ __('Eligibility certificate') }}</dt><dd>{{ $s->eligibility_cert_issued ? ($s->eligibility_cert_no ?: __('Yes')) : __('No') }}</dd>
            </dl>
        </section>
    </div>

    <section class="sheet overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-2 px-5 pt-5 sm:px-7">
            <h3 class="title">{{ __('Subjects') }}</h3>
            <span class="muted text-sm">{{ trans_choice(':count subject|:count subjects', $application->subjects->count(), ['count' => $application->subjects->count()]) }}</span>
        </div>
        <div class="mt-4 overflow-x-auto">
            <table class="table">
                <thead><tr><th>#</th><th>{{ __('Code') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Type') }}</th><th>{{ __('Answer language') }}</th></tr></thead>
                <tbody>
                @forelse ($application->subjects as $row)
                    <tr>
                        <td class="tabular-nums">{{ $loop->iteration }}</td>
                        <td><span class="kbd-code">{{ $row->subject->code }}</span></td>
                        <td class="font-medium">{{ $row->subject->label }} @if ($row->is_exempted)<span class="badge-muted ml-1">{{ __('Exempted') }}</span>@endif</td>
                        <td class="muted">{{ $row->subject->kind_label }}</td>
                        <td>{{ Codes::label(Codes::MEDIUMS, $row->answer_language) }}</td>
                    </tr>
                @empty
                    <tr><td colspan="5" class="muted">{{ __('No subjects chosen yet.') }}</td></tr>
                @endforelse
                </tbody>
            </table>
        </div>
    </section>

    <div class="grid gap-6 lg:grid-cols-2">
        <section class="sheet sheet-pad">
            <h3 class="title mb-4">{{ __('Candidate and eligibility') }}</h3>
            <dl class="dl">
                <dt>{{ __('Candidate type') }}</dt><dd>{{ $application->candidate_type_label }}</dd>
                <dt>{{ __('Exemption') }}</dt><dd>{{ $application->exemption_status === 'EXEMPTED' ? __('Exempted') : __('Non-exempted') }} @if ($application->exemptions_claimed)({{ $application->exemptions_claimed }})@endif</dd>
                <dt>{{ __('Subject group') }}</dt><dd>{{ Codes::label(Codes::SUBJECT_GROUPS, $application->subject_group) }}</dd>
                <dt>{{ __('Foreign national') }}</dt><dd>{{ $application->is_foreigner ? __('Yes') : __('No') }}</dd>
                @if ($application->enrolment_cert_no)<dt>{{ __('Enrolment certificate') }}</dt><dd>{{ $application->enrolment_cert_no }}</dd>@endif
                @if ($application->last_exam_seat_no)
                    <dt>{{ __('Last exam') }}</dt><dd>{{ Codes::label(Codes::MONTHS, $application->last_exam_month) }} {{ $application->last_exam_year }} · {{ __('Seat') }} {{ $application->last_exam_seat_no }}</dd>
                @endif
            </dl>
        </section>
        <section class="sheet sheet-pad">
            <h3 class="title mb-4">{{ __('Previous exams') }}</h3>
            @if ($prev->isEmpty())
                <p class="muted">{{ __('Not entered.') }}</p>
            @else
                <div class="overflow-x-auto">
                <table class="table text-sm">
                    <thead><tr><th>{{ __('Exam') }}</th><th>{{ __('Seat no.') }}</th><th>{{ __('Month / year') }}</th><th class="num">%</th><th>{{ __('Board / college') }}</th></tr></thead>
                    <tbody>@foreach ($prev as $p)<tr><td class="font-semibold">{{ $p->exam === 'XI' ? 'XI' : $p->exam }}</td><td>{{ $p->seat_no ?: '—' }}</td><td>{{ Codes::label(Codes::MONTHS, $p->month) }} {{ $p->year }}</td><td class="num">{{ $p->percentage ?? '—' }}</td><td>{{ $p->board_or_college ?: '—' }}</td></tr>@endforeach</tbody>
                </table>
                </div>
            @endif
            @if ($s->bank_account_no || $s->revenue_circle_village)
                <h4 class="mt-6 mb-2 font-semibold">{{ __('Fee reimbursement (drought-prone areas)') }}</h4>
                <dl class="dl">
                    <dt>{{ __('Revenue circle / village') }}</dt><dd>{{ $s->revenue_circle_village ?: '—' }}</dd>
                    <dt>{{ __('Bank account') }}</dt><dd>{{ $s->bank_account_no ? 'XXXX' . substr($s->bank_account_no, -4) : '—' }} · {{ $s->bank_ifsc }}</dd>
                    <dt>{{ __('Account holder') }}</dt><dd>{{ Codes::label(Codes::ACCOUNT_HOLDERS, $s->bank_account_holder) }}</dd>
                </dl>
            @endif
        </section>
    </div>
</div>
