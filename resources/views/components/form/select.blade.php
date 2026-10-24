@props(['name', 'label', 'options' => [], 'value' => null, 'required' => false, 'hint' => null, 'placeholder' => null, 'span' => false])
@php $id = $attributes->get('id', 'f_' . str_replace(['[', ']', '.'], '_', $name)); $current = (string) old($name, $value); $err = $errors->first($name); @endphp
<div @class(['field', 'span-2' => $span])>
    <label for="{{ $id }}" class="label">{{ $label }}@if ($required)<span class="req" aria-hidden="true"> *</span>@endif</label>
    <select id="{{ $id }}" name="{{ $name }}" {{ $attributes->except('id')->class('select') }} @if ($required) required @endif
        @if ($err) aria-invalid="true" aria-describedby="{{ $id }}_err" @endif>
        <option value="">{{ $placeholder ?? __('Select') }}</option>
        @foreach ($options as $key => $text)
            <option value="{{ $key }}" @selected($current === (string) $key)>{{ $text }}</option>
        @endforeach
    </select>
    @if ($hint && ! $err)<p class="hint">{{ $hint }}</p>@endif
    @if ($err)<p id="{{ $id }}_err" class="error">{{ $err }}</p>@endif
</div>
