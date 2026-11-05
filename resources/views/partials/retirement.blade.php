{{-- Retirement date with remaining service; $t is a Teacher. --}}
@php $rd = $t->retirementDate(); @endphp
@if (! $rd)
    <span class="muted">{{ __('Add date of birth') }}</span>
@elseif ($t->isRetired())
    <span class="badge-bad">{{ __('Retired :date', ['date' => $rd->format('d-m-Y')]) }}</span>
@else
    <span class="whitespace-nowrap font-semibold">{{ $rd->format('d-m-Y') }}</span>
    <span @class(['block text-xs', 'font-semibold text-omr' => $t->retiresWithin(12), 'muted' => ! $t->retiresWithin(12)])>{{ __(':time left', ['time' => $t->remainingService()]) }}</span>
@endif
