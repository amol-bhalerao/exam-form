@props(['name', 'label', 'value' => null, 'required' => false, 'hint' => null, 'span' => true])
@php $id = $attributes->get('id', 'f_' . $name); $err = $errors->first($name); @endphp
<div @class(['field', 'span-2' => $span])>
    <label for="{{ $id }}" class="label">{{ $label }}@if ($required)<span class="req" aria-hidden="true"> *</span>@endif</label>
    <textarea id="{{ $id }}" name="{{ $name }}" {{ $attributes->except('id')->class('textarea') }} @if ($required) required @endif
        @if ($err) aria-invalid="true" @endif>{{ old($name, $value) }}</textarea>
    @if ($hint && ! $err)<p class="hint">{{ $hint }}</p>@endif
    @if ($err)<p class="error">{{ $err }}</p>@endif
</div>
