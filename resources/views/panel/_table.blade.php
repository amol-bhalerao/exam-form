@php
    use App\Support\Codes;
    $cols = $f['cols'];
    // On a page for one college, the college column would repeat the page heading.
    if (! empty($perPage)) { $cols = array_values(array_diff($cols, ['college'])); }
    $labels = \App\Http\Controllers\PanelController::COLUMNS;
@endphp
<table class="{{ ! empty($screen) ? 'table' : 'pl-table' }}">
    <thead><tr>@foreach ($cols as $c)<th @class(['sig' => $c === 'signature', 'num' => in_array($c, ['sr', 'experience', 'examiner_years', 'age'], true)])>{{ __($labels[$c][0]) }}</th>@endforeach</tr></thead>
    <tbody>
    @foreach ($rows as $t)
        <tr>
        @foreach ($cols as $c)
            @switch($c)
                @case('sr')<td class="num">{{ $loop->parent->iteration }}</td>@break
                @case('name')<td class="nm">{{ mb_strtoupper($t->full_name) }}</td>@break
                @case('subject_code')<td class="code">{{ $t->subject?->code ?? '—' }}</td>@break
                @case('subject')<td>{{ $t->subject ? mb_strtoupper($t->subject->name) : '—' }}@if ($t->subject && $t->subject->name_mr && app()->getLocale() !== 'en')<span class="sub">{{ $t->subject->label }}</span>@endif</td>@break
                @case('appointment_no')<td class="code">{{ $t->last_appointment_no ?: '' }}</td>@break
                @case('duties')<td>{{ $t->rolesLabel() }}</td>@break
                @case('designation')<td>{{ $t->designation }}</td>@break
                @case('qualification')<td>{{ $t->qualification }}</td>@break
                @case('second_subject')<td>{{ $t->secondSubject ? $t->secondSubject->code . ' ' . mb_strtoupper($t->secondSubject->name) : '' }}</td>@break
                @case('medium')<td>{{ Codes::label(Codes::MEDIUMS, $t->medium) }}</td>@break
                @case('classes')<td>{{ $t->teaches_classes }}</td>@break
                @case('gender')<td>{{ Codes::label(Codes::GENDERS, $t->gender) }}</td>@break
                @case('category')<td>{{ $t->category }}</td>@break
                @case('dob')<td class="code">{{ $t->dob?->format('d-m-Y') }}</td>@break
                @case('age')<td class="num">{{ $t->age() }}</td>@break
                @case('joined_on')<td class="code">{{ $t->joined_on?->format('d-m-Y') }}</td>@break
                @case('service_here')<td>{{ $t->serviceHere() }}</td>@break
                @case('approval')<td>{{ $t->approval_no }}@if ($t->approval_date)<span class="sub">{{ $t->approval_date->format('d-m-Y') }}</span>@endif</td>@break
                @case('shalarth_id')<td class="code">{{ $t->shalarth_id }}</td>@break
                @case('retirement')<td class="code">{{ $t->retirementDate()?->format('d-m-Y') }}</td>@break
                @case('remaining')<td>{{ $t->isRetired() ? __('Retired') : $t->remainingService() }}</td>@break
                @case('experience')<td class="num">{{ $t->experience_years ?? '' }}</td>@break
                @case('examiner_years')<td class="num">{{ $t->examiner_years ?? '' }}</td>@break
                @case('appointment_type')<td>{{ Codes::label(Codes::APPOINTMENT_TYPES, $t->appointment_type) }}</td>@break
                @case('mobile')<td class="code">{{ $t->mobile }}</td>@break
                @case('email')<td>{{ $t->email }}</td>@break
                @case('college')<td class="col">{{ $t->institute->college_no }}<span class="sub">{{ \Illuminate\Support\Str::limit($t->institute->name, 40) }}</span></td>@break
                @case('status')<td>{{ ['approved' => __('Approved'), 'rejected' => __('Not approved')][$t->board_status] ?? __('Pending') }}</td>@break
                @case('signature')<td class="sig"></td>@break
            @endswitch
        @endforeach
        </tr>
    @endforeach
    </tbody>
</table>
