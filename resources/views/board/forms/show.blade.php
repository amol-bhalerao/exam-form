@php $u = auth()->user(); $canReview = $workflow->can($application, 'approve', $u); @endphp
<x-layouts.portal :title="$application->application_no">
    <x-page-header :title="$application->student->full_name" :subtitle="$application->application_no . ' · ' . $application->institute->display_name" :back="route('board.forms.index', ['status' => 'verified'])">
        <x-slot:actions>
            <a href="{{ route('forms.print', $application) }}" target="_blank" class="btn-secondary"><x-icon name="printer" />{{ __('Print') }}</a>
        </x-slot:actions>
    </x-page-header>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <div class="min-w-0">@include('partials.application-details', ['application' => $application])</div>
        <aside class="grid gap-6 self-start lg:sticky lg:top-24">
            <section class="sheet sheet-pad">
                <p class="text-sm muted">{{ __('Status') }}</p>
                <p class="mt-1"><x-status :application="$application" /></p>
                @if ($application->board_seq)<p class="mt-2 text-sm">{{ __('Board seq.') }} <span class="font-semibold tabular-nums">{{ $application->board_seq }}</span></p>@endif

                @if ($canReview)
                    <form method="POST" action="{{ route('board.forms.decide', $application) }}" class="mt-5 grid gap-3" x-data="{ mode: 'approve' }">
                        @csrf
                        <div class="grid grid-cols-3 gap-2" role="radiogroup" aria-label="{{ __('Decision') }}">
                            @foreach (['approve' => [__('Approve'), 'has-[input:checked]:border-leaf has-[input:checked]:bg-leaf-soft has-[input:checked]:text-leaf'], 'board_return' => [__('Send back'), 'has-[input:checked]:border-marigold has-[input:checked]:bg-marigold-soft has-[input:checked]:text-[#8a5d00]'], 'reject' => [__('Reject'), 'has-[input:checked]:border-omr has-[input:checked]:bg-omr-soft has-[input:checked]:text-omr']] as $k => [$l, $tone])
                                <label class="flex cursor-pointer items-center justify-center rounded-md border border-rule-strong p-2 text-center text-sm font-semibold {{ $tone }}"><input type="radio" name="action" value="{{ $k }}" x-model="mode" class="sr-only">{{ $l }}</label>
                            @endforeach
                        </div>
                        <div class="field">
                            <label for="note" class="label" x-text="mode === 'approve' ? @js(__('Note (optional)')) : mode === 'reject' ? @js(__('Reason for rejection')) : @js(__('What must the college correct?'))"></label>
                            <textarea id="note" name="note" class="textarea" rows="3" :required="mode !== 'approve'" maxlength="500">{{ old('note') }}</textarea>
                            @error('note')<p class="error">{{ $message }}</p>@enderror
                        </div>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="next" value="1" class="check" checked> {{ __('Open the next waiting form') }}</label>
                        <button class="w-full" :class="{ 'btn-ok': mode === 'approve', 'btn-secondary': mode === 'board_return', 'btn-danger': mode === 'reject' }">
                            <span x-text="mode === 'approve' ? @js(__('Approve form')) : mode === 'reject' ? @js(__('Reject form')) : @js(__('Send back to college'))"></span>
                        </button>
                    </form>
                @elseif ($workflow->can($application, 'reopen', $u))
                    <form method="POST" action="{{ route('board.forms.decide', $application) }}" class="mt-5" onsubmit="return confirm(@js(__('Move this form back to review?')))">
                        @csrf <input type="hidden" name="action" value="reopen">
                        <button class="btn-secondary w-full"><x-icon name="undo-2" />{{ __('Reopen for review') }}</button>
                    </form>
                @elseif (in_array($application->status, ['submitted', 'returned', 'board_returned'], true))
                    <p class="mt-4 text-sm muted">{{ __('This form is with the college or student and will come back here once the college verifies it.') }}</p>
                @endif
            </section>
            <section class="sheet sheet-pad">
                <h2 class="title mb-3">{{ __('College') }}</h2>
                <p class="font-semibold">{{ $application->institute->name }}</p>
                <p class="text-sm muted">{{ __('Index no.') }} {{ $application->institute->college_no }} · {{ $application->institute->district }}</p>
                @if ($application->institute->contact_mobile)<p class="mt-2 text-sm"><a href="tel:{{ $application->institute->contact_mobile }}">{{ $application->institute->contact_mobile }}</a></p>@endif
                <a href="{{ route('board.institutes.show', $application->institute) }}" class="mt-3 inline-block text-sm font-semibold">{{ __('College details') }} →</a>
            </section>
            <section class="sheet sheet-pad">
                <h2 class="title mb-4">{{ __('History') }}</h2>
                @include('partials.timeline', ['application' => $application])
            </section>
        </aside>
    </div>
</x-layouts.portal>
