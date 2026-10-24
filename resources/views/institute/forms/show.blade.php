<x-layouts.portal :title="$application->application_no">
    <x-page-header :title="$application->student->full_name" :subtitle="$application->application_no . ' · ' . $application->exam->name" :back="route('institute.forms.index')">
        <x-slot:actions>
            <a href="{{ route('forms.print', $application) }}" target="_blank" class="btn-secondary"><x-icon name="printer" />{{ __('Print') }}</a>
            @if ($application->editableByInstitute())
                <a href="{{ route('institute.forms.edit', $application) }}" class="btn-secondary"><x-icon name="pencil" />{{ __('Correct details') }}</a>
            @endif
        </x-slot:actions>
    </x-page-header>

    @if ($application->status === 'board_returned' && $application->board_note)
        <div class="alert-warn mb-6"><x-icon name="undo-2" class="mt-0.5 size-5 shrink-0" /><div><p class="font-semibold">{{ __('Returned by the board') }}</p><p>{{ $application->board_note }}</p></div></div>
    @endif

    <div class="grid gap-6 lg:grid-cols-[1fr_21rem]">
        <div class="min-w-0">@include('partials.application-details', ['application' => $application])</div>
        <aside class="grid gap-6 self-start lg:sticky lg:top-24">
            <section class="sheet sheet-pad">
                <p class="text-sm muted">{{ __('Status') }}</p>
                <p class="mt-1"><x-status :application="$application" /></p>
                @if ($workflow->can($application, 'verify', auth()->user()))
                    <form method="POST" action="{{ route('institute.forms.decide', $application) }}" class="mt-5 grid gap-3" x-data="{ mode: 'verify' }">
                        @csrf
                        <div class="grid grid-cols-2 gap-2" role="radiogroup">
                            <label class="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-rule-strong p-2 text-sm font-semibold has-[input:checked]:border-leaf has-[input:checked]:bg-leaf-soft has-[input:checked]:text-leaf"><input type="radio" name="action" value="verify" x-model="mode" class="sr-only">{{ __('Verify') }}</label>
                            <label class="flex cursor-pointer items-center justify-center gap-2 rounded-md border border-rule-strong p-2 text-sm font-semibold has-[input:checked]:border-marigold has-[input:checked]:bg-marigold-soft has-[input:checked]:text-[#8a5d00]"><input type="radio" name="action" value="return" x-model="mode" class="sr-only">{{ __('Send back') }}</label>
                        </div>
                        <div class="field">
                            <label for="note" class="label" x-text="mode === 'return' ? @js(__('What must the student correct?')) : @js(__('Note for the board (optional)'))"></label>
                            <textarea id="note" name="note" class="textarea" rows="3" :required="mode === 'return'" maxlength="500">{{ old('note') }}</textarea>
                            @error('note')<p class="error">{{ $message }}</p>@enderror
                        </div>
                        <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="next" value="1" class="check" checked> {{ __('Open the next waiting form') }}</label>
                        <button class="w-full" :class="mode === 'return' ? 'btn-danger' : 'btn-ok'">
                            <span x-text="mode === 'return' ? @js(__('Send back to student')) : @js(__('Verify and forward to board'))"></span>
                        </button>
                    </form>
                    <p class="mt-3 text-xs muted">{{ __('Small mistakes? Use “Correct details” instead of sending the form back.') }}</p>
                @elseif ($application->status === 'verified')
                    <p class="mt-4 text-sm muted">{{ __('Forwarded to the board on :date.', ['date' => $application->verified_at?->format('d M Y')]) }}</p>
                @endif
            </section>
            <section class="sheet sheet-pad">
                <h2 class="title mb-4">{{ __('History') }}</h2>
                @include('partials.timeline', ['application' => $application])
            </section>
        </aside>
    </div>
</x-layouts.portal>
