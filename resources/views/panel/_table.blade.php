@php
    use App\Support\Codes;
    $cols = $f['cols'];
    // On a page for one college, the college column would repeat the page heading.
    if (! empty($perPage)) { $cols = array_values(array_diff($cols, ['college'])); }
    $labels = \App\Http\Controllers\PanelController::COLUMNS;
@endphp
<table class="{{ ! empty($screen) ? 'table' : 'pl-table' }}">
    <thead><tr>@foreach ($cols as $c)<th @class(['sig' => $c === 'signature', 'num' => in_array($c, ['sr', 'experience', 'examiner_years'], true)])>{{ __($labels[$c][0]) }}</th>@endforeach</tr></thead>
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
