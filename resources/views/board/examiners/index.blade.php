@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Teachers and examiners')">
    <x-page-header :title="__('Teachers and examiners')" :subtitle="__('Teachers sent by colleges for board duties. Approve them for appointment, or mark them not approved with a reason.')">
        <x-slot:actions><a href="{{ route('board.examiners.export', request()->query()) }}" class="btn-secondary"><x-icon name="file-spreadsheet" />{{ __('Download Excel (CSV)') }}</a></x-slot:actions>
    </x-page-header>

    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <x-stat :label="__('Teachers')" :value="$stats['total']" :href="route('board.examiners.index')" />
        <x-stat :label="__('Pending review')" :value="$stats['pending']" tone="marigold" :href="route('board.examiners.index', ['status' => 'pending'])" />
        <x-stat :label="__('Approved')" :value="$stats['approved']" tone="leaf" :href="route('board.examiners.index', ['status' => 'approved'])" />
        <x-stat :label="__('Not approved')" :value="$stats['rejected']" tone="omr" :href="route('board.examiners.index', ['status' => 'rejected'])" />
        <x-stat :label="__('Available this year')" :value="$stats['available']" tone="board" :href="route('board.examiners.index', ['available' => 'yes'])" />
    </div>

    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name or mobile') }}"></div>
        <div class="field"><label class="label" for="role">{{ __('Duty') }}</label><select id="role" name="role" class="select"><option value="">{{ __('All') }}</option>@foreach (Codes::options(Codes::DUTY_ROLES) as $k => $l)<option value="{{ $k }}" @selected(request('role') === $k)>{{ $l }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="subject">{{ __('Subject') }}</label><select id="subject" name="subject" class="select"><option value="">{{ __('All') }}</option>@foreach ($subjects as $s)<option value="{{ $s->id }}" @selected(request('subject') == $s->id)>{{ $s->code }} · {{ $s->label }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="district">{{ __('District') }}</label><select id="district" name="district" class="select"><option value="">{{ __('All') }}</option>@foreach ($districts as $d)<option value="{{ $d }}" @selected(request('district') === $d)>{{ $d }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="status">{{ __('Board review') }}</label><select id="status" name="status" class="select"><option value="">{{ __('All') }}</option>@foreach (['pending' => __('Pending'), 'approved' => __('Approved'), 'rejected' => __('Not approved')] as $k => $l)<option value="{{ $k }}" @selected(request('status') === $k)>{{ $l }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>

    @if ($teachers->isEmpty())
        <x-empty :title="__('No teachers match')" icon="users">{{ __('Colleges add their teachers and duties from their own portal.') }}</x-empty>
    @else
    <div class="grid gap-3">
        @foreach ($teachers as $t)
            <article class="sheet p-4 sm:p-5" x-data="{ open: false }">
                <div class="flex flex-wrap items-start gap-4">
                    <div class="min-w-0 flex-1 basis-64">
                        <div class="flex flex-wrap items-center gap-2">
                            <h2 class="font-semibold">{{ $t->full_name }}</h2>
                            <span class="{{ ['approved' => 'badge-ok', 'rejected' => 'badge-bad'][$t->board_status] ?? 'badge-pending' }}">{{ ['approved' => __('Approved'), 'rejected' => __('Not approved')][$t->board_status] ?? __('Pending') }}</span>
                            @unless ($t->available_for_duty)<span class="badge-muted">{{ __('Not available') }}</span>@endunless
                        </div>
                        <p class="mt-1 text-sm muted">{{ $t->institute->college_no }} · {{ \Illuminate\Support\Str::limit($t->institute->name, 60) }} · {{ $t->institute->district }}</p>
                        <dl class="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                            <div><dt class="inline muted">{{ __('Subject') }}:</dt> <dd class="inline font-medium">{{ $t->subject ? $t->subject->code . ' · ' . $t->subject->label : '—' }}</dd></div>
                            <div><dt class="inline muted">{{ __('Duties') }}:</dt> <dd class="inline font-medium">{{ $t->rolesLabel() ?: '—' }}</dd></div>
                            <div><dt class="inline muted">{{ __('Experience') }}:</dt> <dd class="inline font-medium">{{ $t->experience_years !== null ? __(':n yrs', ['n' => $t->experience_years]) : '—' }} @if ($t->examiner_years)({{ __(':n as examiner', ['n' => $t->examiner_years]) }})@endif</dd></div>
                            <div><dt class="inline muted">{{ __('Qualification') }}:</dt> <dd class="inline font-medium">{{ $t->qualification ?: '—' }}</dd></div>
                            <div><dt class="inline muted">{{ __('Mobile') }}:</dt> <dd class="inline font-medium tabular-nums">{{ $t->mobile }}</dd></div>
                        </dl>
                        @if ($t->board_note)<p class="mt-2 text-sm"><span class="muted">{{ __('Board note') }}:</span> {{ $t->board_note }}</p>@endif
                    </div>
                    <div class="flex flex-wrap gap-2">
                        @if ($t->board_status !== 'approved')
                            <form method="POST" action="{{ route('board.examiners.decide', $t) }}">@csrf<input type="hidden" name="decision" value="approved"><button class="btn-ok btn-sm"><x-icon name="check" />{{ __('Approve') }}</button></form>
                        @endif
                        @if ($t->board_status !== 'rejected')
                            <button type="button" class="btn-secondary btn-sm" @click="open = !open" :aria-expanded="open">{{ __('Not approve') }}</button>
                        @endif
                        @if ($t->board_status !== 'pending')
                            <form method="POST" action="{{ route('board.examiners.decide', $t) }}">@csrf<input type="hidden" name="decision" value="pending"><button class="btn-quiet btn-sm">{{ __('Undo') }}</button></form>
                        @endif
                    </div>
                </div>
                <form method="POST" action="{{ route('board.examiners.decide', $t) }}" class="mt-4 flex flex-wrap items-end gap-3 border-t border-rule pt-4" x-show="open" x-collapse x-cloak>
                    @csrf<input type="hidden" name="decision" value="rejected">
                    <div class="field min-w-0 flex-1 basis-64"><label class="label" for="note-{{ $t->id }}">{{ __('Reason (sent to the college)') }}</label><input id="note-{{ $t->id }}" name="note" class="input" required maxlength="300"></div>
                    <button class="btn-danger btn-sm">{{ __('Mark not approved') }}</button>
                </form>
            </article>
        @endforeach
    </div>
    <div class="mt-5">{{ $teachers->links() }}</div>
    @endif
</x-layouts.portal>
