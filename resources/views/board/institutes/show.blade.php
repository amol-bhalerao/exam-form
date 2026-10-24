<x-layouts.portal :title="$institute->name">
    <x-page-header :title="$institute->name" :subtitle="__('Index no.') . ' ' . $institute->college_no . ($institute->udise_no ? ' · UDISE ' . $institute->udise_no : '')" :back="route('board.institutes.index')">
        <x-slot:actions><a href="{{ route('board.forms.index', ['institute' => $institute->id]) }}" class="btn-primary"><x-icon name="file-check" />{{ __('Exam forms') }}</a></x-slot:actions>
    </x-page-header>
    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <x-stat :label="__('With college')" :value="$counts['submitted'] + $counts['board_returned']" tone="marigold" />
        <x-stat :label="__('Waiting for board')" :value="$counts['verified']" tone="board" :href="route('board.forms.index', ['institute' => $institute->id, 'status' => 'verified'])" />
        <x-stat :label="__('Approved')" :value="$counts['approved']" tone="leaf" />
        <x-stat :label="__('Fees collected')" :value="'₹' . number_format($fees)" tone="ink" />
    </div>
    <div class="grid gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <section class="sheet sheet-pad self-start">
            <h2 class="title mb-4">{{ __('Contact') }}</h2>
            <dl class="dl">
                <dt>{{ __('Principal') }}</dt><dd>{{ $institute->principal_name ?: '—' }}</dd>
                <dt>{{ __('Mobile') }}</dt><dd>@if ($institute->contact_mobile)<a href="tel:{{ $institute->contact_mobile }}">{{ $institute->contact_mobile }}</a>@else — @endif</dd>
                <dt>{{ __('Email') }}</dt><dd class="break-all">{{ $institute->contact_email ?: '—' }}</dd>
                <dt>{{ __('Address') }}</dt><dd>{{ $institute->address ?: '—' }}</dd>
                <dt>{{ __('District') }}</dt><dd>{{ $institute->district ?: '—' }}</dd>
                <dt>{{ __('Streams') }}</dt><dd>{{ $institute->streams->map->label->implode(', ') ?: '—' }}</dd>
                <dt>{{ __('Subjects listed') }}</dt><dd>{{ $offered ?: __('None (students see all)') }}</dd>
                <dt>{{ __('Portal logins') }}</dt><dd>{{ $institute->users->count() }}</dd>
            </dl>
        </section>
        <section class="sheet overflow-hidden">
            <div class="flex items-center justify-between border-b border-rule px-6 py-4"><h2 class="title">{{ __('Teachers and examiners') }}</h2><a href="{{ route('board.examiners.index', ['institute' => $institute->id]) }}" class="text-sm font-semibold">{{ __('Review') }}</a></div>
            @if ($teachers->isEmpty())
                <p class="px-6 py-6 muted">{{ __('This college has not added teachers yet.') }}</p>
            @else
            <div class="overflow-x-auto"><table class="table">
                <thead><tr><th>{{ __('Name') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Duties') }}</th><th>{{ __('Board review') }}</th></tr></thead>
                <tbody>@foreach ($teachers as $t)<tr><td class="font-semibold">{{ $t->full_name }}</td><td class="text-sm">{{ $t->subject?->label ?? '—' }}</td><td class="text-sm">{{ $t->rolesLabel() ?: '—' }}</td><td><span class="{{ ['approved' => 'badge-ok', 'rejected' => 'badge-bad'][$t->board_status] ?? 'badge-pending' }}">{{ ['approved' => __('Approved'), 'rejected' => __('Not approved')][$t->board_status] ?? __('Pending') }}</span></td></tr>@endforeach</tbody>
            </table></div>
            @endif
        </section>
    </div>
</x-layouts.portal>
