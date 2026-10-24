@php
    $steps = [
        'paid' => [__('Fee paid'), $application->isPaid()],
        'college' => [__('Verified by college'), in_array($application->status, ['verified', 'approved', 'board_returned'], true)],
        'board' => [__('Approved by board'), $application->status === 'approved'],
    ];
@endphp
<x-layouts.portal :title="$application->application_no">
    <x-page-header :title="$application->exam->name" :subtitle="$application->student->full_name . ' · ' . $application->application_no" :back="route('student.dashboard')">
        <x-slot:actions>
            @if ($application->printable())
                <a href="{{ route('forms.print', $application) }}" class="btn-primary" target="_blank"><x-icon name="printer" />{{ __('Print form') }}</a>
            @endif
            @if ($application->isPaid())
                <a href="{{ route('forms.receipt', $application) }}" class="btn-secondary" target="_blank"><x-icon name="file-text" />{{ __('Fee receipt') }}</a>
            @endif
            @if ($application->editableByStudent())
                <a href="{{ route('student.applications.edit', [$application, 'review']) }}" class="btn-primary"><x-icon name="pencil" />{{ $application->status === 'returned' ? __('Correct and resend') : __('Continue form') }}</a>
            @endif
        </x-slot:actions>
    </x-page-header>

    {{-- Progress strip --}}
    <section class="rise sheet sheet-pad mb-6">
        <div class="flex flex-wrap items-center justify-between gap-4">
            <div><p class="text-sm muted">{{ __('Status') }}</p><p class="mt-1"><x-status :application="$application" /></p></div>
            <ol class="flex flex-wrap items-center gap-3">
                @foreach ($steps as [$label, $done])
                    <li class="flex items-center gap-2 text-sm font-semibold {{ $done ? 'text-ink' : 'text-ink-3' }}">
                        <span class="grid size-7 place-items-center rounded-full border-2 {{ $done ? 'border-leaf bg-leaf text-white' : 'border-rule-strong' }}">@if ($done)<x-icon name="check" class="omr-mark size-4" />@else{{ $loop->iteration }}@endif</span>
                        {{ $label }}
                    </li>
                    @unless ($loop->last)<li class="hidden h-px w-8 bg-rule-strong sm:block" aria-hidden="true"></li>@endunless
                @endforeach
            </ol>
        </div>
        @if (in_array($application->status, ['returned', 'board_returned', 'rejected'], true) && ($application->institute_note || $application->board_note))
            <div class="mt-4 {{ $application->status === 'rejected' ? 'alert-bad' : 'alert-warn' }}"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" />
                <div><p class="font-semibold">{{ $application->status === 'returned' ? __('Message from your college') : __('Message from the board') }}</p><p>{{ $application->status === 'returned' ? $application->institute_note : $application->board_note }}</p></div></div>
        @endif
    </section>

    <div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div class="min-w-0">@include('partials.application-details', ['application' => $application])</div>
        <aside class="grid gap-6 self-start">
            <section class="sheet sheet-pad">
                <h2 class="title mb-4">{{ __('History') }}</h2>
                @include('partials.timeline', ['application' => $application])
            </section>
            @if ($application->payments->isNotEmpty())
                <section class="sheet sheet-pad">
                    <h2 class="title mb-3">{{ __('Payments') }}</h2>
                    <ul class="grid gap-2 text-sm">
                        @foreach ($application->payments as $p)
                            <li class="flex items-center justify-between gap-2">
                                <span class="tabular-nums">{{ $p->order_id }}<br><span class="muted">{{ $p->created_at->format('d M Y, h:i A') }}</span></span>
                                <span class="{{ ['paid' => 'badge-ok', 'failed' => 'badge-bad', 'expired' => 'badge-muted'][$p->status] ?? 'badge-pending' }}">₹{{ $p->amount }}</span>
                            </li>
                        @endforeach
                    </ul>
                </section>
            @endif
        </aside>
    </div>
</x-layouts.portal>
