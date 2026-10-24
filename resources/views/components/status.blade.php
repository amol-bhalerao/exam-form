@props(['application'])
<span class="badge-{{ $application->statusTone() }}">{{ $application->status_label }}</span>
