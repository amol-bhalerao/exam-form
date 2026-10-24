@props(['name', 'label', 'value' => null])
@php $current = old($name, is_null($value) ? '' : ($value ? '1' : '0')); @endphp
<fieldset class="field">
    <legend class="label">{{ $label }}</legend>
    <div class="flex gap-2">
        @foreach (['1' => __('Yes'), '0' => __('No')] as $v => $text)
            <label class="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-md border border-rule-strong bg-sheet px-3 has-[input:checked]:border-board has-[input:checked]:bg-board-soft">
                <input type="radio" name="{{ $name }}" value="{{ $v }}" class="check" @checked((string) $current === $v)> {{ $text }}
            </label>
        @endforeach
    </div>
</fieldset>
