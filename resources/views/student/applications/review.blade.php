<x-layouts.portal :title="__('Review and pay')">
    <x-page-header :title="__('Review and pay')" :subtitle="$student->full_name . ' · ' . $application->exam->name" :back="route('student.dashboard')" />
    @include('student.applications._steps', ['current' => 'review', 'application' => $application])

    @if ($application->status === 'returned' && $application->institute_note)
        <div class="alert-warn mb-6"><x-icon name="undo-2" class="mt-0.5 size-5 shrink-0" />
            <div><p class="font-semibold">{{ __('Your college sent this form back for correction') }}</p><p>{{ $application->institute_note }}</p></div></div>
    @endif

    <div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div class="min-w-0 rise">
            <div class="mb-4 flex flex-wrap gap-2">
                <a href="{{ route('student.students.edit', $student) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit student details') }}</a>
                @if ($application->editableByStudent())
                    <a href="{{ route('student.applications.edit', [$application, 'exam']) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit exam details') }}</a>
                    <a href="{{ route('student.applications.edit', [$application, 'subjects']) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit subjects') }}</a>
                @endif
            </div>
            @include('partials.application-details', ['application' => $application])
        </div>

        <aside class="lg:sticky lg:top-24 lg:self-start">
            <div class="sheet sheet-pad rise rise-2">
                @if ($application->editableByStudent())
                    <p class="text-sm font-semibold text-ink-3">{{ $application->isPaid() ? __('Fee paid') : __('Exam fee') }}</p>
                    <p class="tile-num mt-1">₹{{ number_format($application->isPaid() ? $application->fee_amount : $fee['total']) }}</p>
                    @if (! $application->isPaid() && $fee['late'] > 0)<p class="text-sm muted">{{ __('Includes late fee of ₹:amount', ['amount' => $fee['late']]) }}</p>@endif

                    @if ($problems)
                        <div class="mt-4 alert-bad"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" />
                            <div class="text-sm"><p class="font-semibold">{{ __('Fix these before paying') }}</p><ul class="mt-1 list-disc pl-4">@foreach ($problems as $p)<li>{{ $p }}</li>@endforeach</ul></div></div>
                    @endif

                    <form method="POST" action="{{ $application->isPaid() ? route('student.applications.submit', $application) : route('payments.start', $application) }}" class="mt-5" x-data="{ ok: false, busy: false }" @submit="busy = true">
                        @csrf
                        <label class="flex items-start gap-3 rounded-md bg-wash p-3 text-sm">
                            <input type="checkbox" name="declaration" value="1" class="check mt-0.5" x-model="ok" required>
                            <span>{{ __('I declare that the information in this form is true and correct. I understand the form will be checked by my college and the board.') }}</span>
                        </label>
                        @error('declaration')<p class="error mt-1">{{ $message }}</p>@enderror
                        <button class="btn-primary mt-4 w-full" :disabled="!ok || busy || @js((bool) $problems)">
                            <x-icon :name="$application->isPaid() ? 'send' : 'indian-rupee'" />
                            {{ $application->isPaid() ? __('Send to college again') : __('Pay ₹:amount and send to college', ['amount' => number_format($fee['total'])]) }}
                        </button>
                    </form>
                    <p class="mt-3 text-xs muted">{{ __('After payment the form goes to :college for verification. You can print it and the fee receipt from this page.', ['college' => $application->institute->name]) }}</p>
                    @if ($application->status === 'draft' && ! $application->isPaid())
                        <form method="POST" action="{{ route('student.applications.destroy', $application) }}" class="mt-4 border-t border-rule pt-4" onsubmit="return confirm(@js(__('Delete this draft form?')))">
                            @csrf @method('DELETE')
                            <button class="btn-quiet btn-sm w-full text-omr"><x-icon name="trash-2" />{{ __('Delete draft') }}</button>
                        </form>
                    @endif
                @else
                    <p class="font-semibold">{{ __('This form is with your college.') }}</p>
                    <a href="{{ route('student.applications.show', $application) }}" class="btn-secondary mt-4 w-full">{{ __('View status') }}</a>
                @endif
            </div>
        </aside>
    </div>
</x-layouts.portal>
