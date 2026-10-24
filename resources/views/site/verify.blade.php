<x-layouts.public :title="__('Verify an exam form')" :noindex="(bool) $number">
    <div class="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 class="display-xl">{{ __('Verify an exam form') }}</h1>
        <p class="lede mt-3">{{ __('Enter the application number printed on the form, or scan its QR code.') }}</p>
        <form method="GET" action="{{ route('verify.form') }}" class="mt-8 flex gap-2">
            <label for="number" class="sr-only">{{ __('Application number') }}</label>
            <input id="number" name="number" value="{{ $number }}" class="input uppercase" placeholder="HSC27-000123" required autocomplete="off">
            <button class="btn-primary"><x-icon name="search" />{{ __('Check') }}</button>
        </form>
        @if ($number)
            @if ($application)
                <div class="sheet sheet-pad mt-8">
                    <div class="flex flex-wrap items-center justify-between gap-3">
                        <p class="font-display text-xl font-bold tabular-nums">{{ $application->application_no }}</p>
                        <x-status :application="$application" />
                    </div>
                    <dl class="mt-5 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                        <div><dt class="text-ink-3">{{ __('Candidate') }}</dt><dd class="font-semibold">{{ $application->snapshot['student']['full_name'] ?? $application->student->full_name }}</dd></div>
                        <div><dt class="text-ink-3">{{ __('Exam') }}</dt><dd class="font-semibold">{{ $application->exam->name }}</dd></div>
                        <div class="sm:col-span-2"><dt class="text-ink-3">{{ __('College / school') }}</dt><dd class="font-semibold">{{ $application->institute->display_name }}</dd></div>
                        <div><dt class="text-ink-3">{{ __('Fee') }}</dt><dd class="font-semibold">{{ $application->isPaid() ? __('Paid on :date', ['date' => $application->paid_at->format('d/m/Y')]) : __('Not paid') }}</dd></div>
                    </dl>
                </div>
            @else
                <div class="alert-bad mt-8"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" /><div>{{ __('No submitted form has the number :number. Check the number and try again.', ['number' => $number]) }}</div></div>
            @endif
        @endif
    </div>
</x-layouts.public>
