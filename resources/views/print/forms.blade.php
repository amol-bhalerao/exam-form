@php use App\Support\Codes; @endphp
<x-layouts.print :title="$applications->count() === 1 ? $applications->first()->application_no : __('Exam forms')">
@foreach ($applications as $a)
    @php
        $s = $a->student; $prev = $s->previousExams->keyBy('exam');
        $yn = fn ($v) => is_null($v) ? '—' : ($v ? __('Yes') : __('No'));
        $isHsc = $a->board->code === 'HSC';
    @endphp
    <article class="page">
        <header class="pf-head">
            <div class="pf-title">
                <div class="t1">{{ \App\Models\Setting::get('site_name', config('app.name')) }}</div>
                <div class="t2">{{ $isHsc ? __('Higher Secondary Certificate Examination Application Form') : __('Secondary School Certificate Examination Application Form') }}</div>
                <div class="mt-1 font-semibold">{{ $a->exam->name }}</div>
                <div class="mt-0.5 font-bold">{{ $a->institute->name }} ({{ $a->institute->college_no }})</div>
                <div class="pf-meta">
                    <span>{{ __('UDISE') }}: {{ $a->institute->udise_no ?: '—' }}</span>
                    @if ($a->centre_no)<span>{{ __('Centre no.') }}: {{ $a->centre_no }}</span>@endif
                    @if ($isHsc)<span>{{ __('Stream') }}: {{ $a->stream?->name }}</span>@endif
                    <span>{{ __('Status') }}: <span class="pf-status">{{ $a->status_label }}</span></span>
                    <span>{{ __('Printed') }}: {{ now()->format('d/m/Y') }}</span>
                </div>
            </div>
            <div class="pf-ids">
                <div><span>{{ __('Application no.') }}</span><b>{{ $a->application_no }}</b></div>
                <div><span>{{ __('Institute seq.') }}</span><b>{{ $a->institute_seq ?: '—' }}</b></div>
                <div><span>{{ __('Board seq.') }}</span><b>{{ $a->board_seq ?: '—' }}</b></div>
                <div><span>{{ __('Candidate type') }}</span><b>{{ $a->candidate_type_label }}</b></div>
            </div>
        </header>

        <section class="pf-sec"><h3>{{ __('Candidate personal particulars') }}</h3>
            <div class="pf-grid">
                <div class="pf-row"><span>{{ __('Full name') }}</span><span>{{ $s->full_name }}</span></div>
                <div class="pf-row"><span>{{ __("Mother's name") }}</span><span>{{ $s->mother_name }}</span></div>
                <div class="pf-row"><span>{{ __('Aadhaar') }}</span><span>{{ $s->masked_aadhaar ?? '—' }}</span></div>
                <div class="pf-row"><span>{{ __('UDISE+ PEN') }}</span><span>{{ $s->pen_id ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('APAAR ID') }}</span><span>{{ $s->apaar_id ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Mobile') }}</span><span>{{ $s->mobile }}</span></div>
                <div class="pf-row"><span>{{ __('Date of birth') }}</span><span>{{ $s->dob?->format('d M Y') }}</span></div>
                <div class="pf-row"><span>{{ __('Gender') }}</span><span>{{ Codes::label(Codes::GENDERS, $s->gender) }}</span></div>
                <div class="pf-row"><span>{{ __('Email') }}</span><span style="text-transform:none">{{ $s->email ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Address') }}</span><span>{{ collect([$s->address, $s->village, $s->taluka, $s->district, $s->pincode])->filter()->implode(', ') }}</span></div>
            </div>
        </section>

        <section class="pf-sec"><h3>{{ __('Academic and reservation details') }}</h3>
            <div class="pf-grid">
                <div class="pf-row"><span>{{ __('Stream') }}</span><span>{{ $a->stream?->name ?? '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Minority religion') }}</span><span>{{ Codes::label(Codes::RELIGIONS, $s->minority_religion) }}</span></div>
                <div class="pf-row"><span>{{ __('Category') }}</span><span>{{ Codes::label(Codes::CATEGORIES, $s->category) }}</span></div>
                <div class="pf-row"><span>{{ __('Medium') }}</span><span>{{ Codes::label(Codes::MEDIUMS, $s->medium) }}</span></div>
                <div class="pf-row"><span>{{ __('Divyang') }}</span><span>{{ Codes::label(Codes::DIVYANG, $s->divyang ?: 'NONE') }}</span></div>
                <div class="pf-row"><span>{{ __('SSC from Maharashtra') }}</span><span>{{ $yn($s->ssc_from_maharashtra) }}</span></div>
                <div class="pf-row"><span>{{ __('Eligibility certificate') }}</span><span>{{ $yn($s->eligibility_cert_issued) }}</span></div>
                <div class="pf-row"><span>{{ __('Certificate no.') }}</span><span>{{ $s->eligibility_cert_no ?: '—' }}</span></div>
            </div>
        </section>

        <section class="pf-sec"><h3>{{ __('Subject details') }}</h3>
            <table class="pf-table">
                <thead><tr><th style="width:9mm">{{ __('Sr.') }}</th><th style="width:16mm">{{ __('Code') }}</th><th>{{ __('Subject') }}</th><th style="width:34mm">{{ __('Category') }}</th><th style="width:22mm">{{ __('Ans. lang.') }}</th></tr></thead>
                <tbody>
                @foreach ($a->subjects as $row)
                    <tr><td>{{ $loop->iteration }}</td><td>{{ $row->subject->code }}</td><td>{{ mb_strtoupper($row->subject->name) }}@if ($row->is_exempted) ({{ __('exempted') }})@endif</td><td>{{ mb_strtoupper($row->subject->kind_label) }}</td><td>{{ $row->answer_language }}</td></tr>
                @endforeach
                </tbody>
            </table>
        </section>

        <section class="pf-sec"><h3>{{ __('Type of candidate and eligibility') }}</h3>
            <div class="pf-grid">
                <div class="pf-row"><span>{{ __('Candidate') }}</span><span>{{ $a->candidate_type_label }}</span></div>
                <div class="pf-row"><span>{{ __('Enrolment cert. (private)') }}</span><span>{{ $a->enrolment_cert_no ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Exemption status') }}</span><span>{{ $a->exemption_status === 'EXEMPTED' ? __('Exempted') : __('Non-exempted') }}</span></div>
                <div class="pf-row"><span>{{ __('Exemptions claimed') }}</span><span>{{ $a->exemptions_claimed }}</span></div>
                <div class="pf-row"><span>{{ __('Group') }}</span><span>{{ Codes::label(Codes::SUBJECT_GROUPS, $a->subject_group) }}</span></div>
                <div class="pf-row"><span>{{ __('Foreigner') }}</span><span>{{ $yn($a->is_foreigner) }}</span></div>
                @if ($a->last_exam_seat_no)
                    <div class="pf-row"><span>{{ __('Last exam') }}</span><span>{{ $a->last_exam_month }} {{ $a->last_exam_year }}</span></div>
                    <div class="pf-row"><span>{{ __('Last seat no.') }}</span><span>{{ $a->last_exam_seat_no }}</span></div>
                @endif
            </div>
        </section>

        <section class="pf-sec"><h3>{{ __('Previous examination details') }}</h3>
            <table class="pf-table">
                <thead><tr><th>{{ __('Exam') }}</th><th>{{ __('Seat no.') }}</th><th>{{ __('Month') }}</th><th>{{ __('Year') }}</th><th>{{ __('Marks %') }}</th><th>{{ __('Board / college') }}</th></tr></thead>
                <tbody>
                @forelse ($prev as $p)
                    <tr><td>{{ $p->exam === 'XI' ? 'XITH' : $p->exam }}</td><td>{{ $p->seat_no ?: '—' }}</td><td>{{ $p->month ?: '—' }}</td><td>{{ $p->year ?: '—' }}</td><td>{{ $p->percentage ?? '—' }}</td><td>{{ mb_strtoupper((string) $p->board_or_college) ?: '—' }}</td></tr>
                @empty
                    <tr><td colspan="6">—</td></tr>
                @endforelse
                </tbody>
            </table>
        </section>

        @if ($s->bank_account_no || $s->revenue_circle_village)
        <section class="pf-sec"><h3>{{ __('Fee reimbursement (drought-prone areas)') }}</h3>
            <div class="pf-grid">
                <div class="pf-row"><span>{{ __('Revenue circle / village') }}</span><span>{{ $s->revenue_circle_village ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Account no.') }}</span><span>{{ $s->bank_account_no ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('IFSC') }}</span><span>{{ $s->bank_ifsc ?: '—' }}</span></div>
                <div class="pf-row"><span>{{ __('Account holder') }}</span><span>{{ Codes::label(Codes::ACCOUNT_HOLDERS, $s->bank_account_holder) }}</span></div>
            </div>
        </section>
        @endif

        <div class="pf-foot">
            <div class="pf-box">
                <p class="font-bold uppercase" style="font-size:8pt;letter-spacing:.05em">{{ __('Declaration') }}</p>
                <p class="mt-1">{{ __('I hereby declare that the information furnished by me in this form is true and correct to the best of my knowledge.') }}</p>
                <p class="mt-1">{{ __('Fee') }}: ₹{{ number_format($a->fee_amount) }} · {{ $a->isPaid() ? __('Paid on :date', ['date' => $a->paid_at->format('d/m/Y')]) : __('Not paid') }}</p>
                <div class="mt-6 flex justify-between gap-4" style="font-size:8pt">
                    <span class="border-t border-ink pt-1">{{ __('Candidate signature') }}</span>
                    <span class="border-t border-ink pt-1">{{ __('Principal seal and signature') }}</span>
                </div>
            </div>
            <div class="pf-box text-center">
                <p class="font-bold uppercase" style="font-size:7pt">{{ __('Verification QR') }}</p>
                <div class="mt-1 flex justify-center [&_svg]:h-[26mm] [&_svg]:w-[26mm]">{!! $qr[$a->id] ?? '' !!}</div>
            </div>
            <div class="pf-box text-center">
                <div class="pf-photo">@if ($s->photoUrl())<img src="{{ $s->photoUrl() }}" alt="">@else<span class="text-xs">{{ __('Photo') }}</span>@endif</div>
                <div class="pf-sign">@if ($s->signatureUrl())<img src="{{ $s->signatureUrl() }}" alt="">@endif</div>
            </div>
        </div>
        <p class="pf-note"><span>{{ __('System-generated form. Check genuineness at :url', ['url' => route('verify.form')]) }}</span><span>{{ $a->application_no }}</span></p>
    </article>
@endforeach
</x-layouts.print>
