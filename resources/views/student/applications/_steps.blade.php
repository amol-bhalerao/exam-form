@php
    $stepKeys = array_keys(\App\Http\Controllers\Student\ApplicationController::STEPS);
    $doneUpTo = array_search($current, $stepKeys, true);
    $done = array_slice($stepKeys, 0, $doneUpTo === false ? 0 : $doneUpTo);
    $labels = array_map(fn ($l) => __($l), \App\Http\Controllers\Student\ApplicationController::STEPS);
@endphp
<div class="mb-7 flex flex-wrap items-center justify-between gap-4">
    <x-bubbles :steps="$labels" :current="$current" :done="$done"
        :link-for="$application && $application->editableByStudent() ? fn ($k) => route('student.applications.edit', [$application, $k]) : null" />
    @if ($application)<p class="text-sm muted tabular-nums">{{ __('Application no.') }} <span class="font-semibold text-ink">{{ $application->application_no }}</span></p>@endif
</div>
