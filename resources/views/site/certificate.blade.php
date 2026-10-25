<x-layouts.public :title="__('Verify a certificate')" :noindex="true">
    <x-page-hero :title="__('Verify a certificate')" :lede="__('Certificates issued for tests taken on this portal carry a QR code that opens this page.')" width="max-w-2xl" />
    <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        @if ($certificate)
            <div class="sheet sheet-pad">
                <p class="flex items-center gap-2 font-semibold text-leaf"><x-icon name="badge-check" class="size-6" />{{ __('Genuine certificate') }}</p>
                <dl class="mt-5 grid gap-3 text-[0.95rem] sm:grid-cols-2">
                    <div><dt class="text-ink-3">{{ __('Certificate number') }}</dt><dd class="font-mono font-semibold">{{ $certificate->serial }}</dd></div>
                    <div><dt class="text-ink-3">{{ __('Student') }}</dt><dd class="font-semibold">{{ $certificate->student->full_name }}</dd></div>
                    <div><dt class="text-ink-3">{{ __('Test') }}</dt><dd class="font-semibold">{{ $certificate->quiz->title }}</dd></div>
                    <div><dt class="text-ink-3">{{ __('Subject') }}</dt><dd class="font-semibold">{{ $certificate->quiz->subject->label }}</dd></div>
                    <div><dt class="text-ink-3">{{ __('Score') }}</dt><dd class="font-semibold">{{ $certificate->attempt->percent() }}%</dd></div>
                    <div><dt class="text-ink-3">{{ __('Issued on') }}</dt><dd class="font-semibold">{{ $certificate->created_at->format('d/m/Y') }}</dd></div>
                    <div class="sm:col-span-2"><dt class="text-ink-3">{{ __('College / school') }}</dt><dd class="font-semibold">{{ $certificate->quiz->institute->display_name }}</dd></div>
                </dl>
            </div>
        @else
            <div class="alert-bad"><x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" /><div>{{ __('No certificate has the number :number.', ['number' => $serial]) }}</div></div>
        @endif
    </div>
</x-layouts.public>
