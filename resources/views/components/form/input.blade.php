@props(['name', 'label', 'value' => null, 'type' => 'text', 'required' => false, 'hint' => null, 'span' => false])
@php $id = $attributes->get('id', 'f_' . str_replace(['[', ']', '.'], '_', $name)); $err = $errors->first(str_replace(['[', ']'], ['.', ''], $name)); @endphp
<div @class(['field', 'span-2' => $span])>
    <label for="{{ $id }}" class="label">{{ $label }}@if ($required)<span class="req" aria-hidden="true"> *</span>@endif</label>
    <input id="{{ $id }}" name="{{ $name }}" type="{{ $type }}" value="{{ old(str_replace(['[', ']'], ['.', ''], $name), $value) }}"
        {{ $attributes->except('id')->class('input') }} @if ($required) required @endif
        @if ($err) aria-invalid="true" aria-describedby="{{ $id }}_err" @elseif ($hint) aria-describedby="{{ $id }}_hint" @endif>
    @if ($hint && ! $err)<p id="{{ $id }}_hint" class="hint">{{ $hint }}</p>@endif
    @if ($err)<p id="{{ $id }}_err" class="error">{{ $err }}</p>@endif
</div>
