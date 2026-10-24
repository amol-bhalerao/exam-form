@if (session('status'))
    <div class="alert-ok mb-6" role="status"><x-icon name="circle-check" class="mt-0.5 size-5 shrink-0" /><div>{{ session('status') }}</div></div>
@endif
@if (session('warning'))
    <div class="alert-warn mb-6" role="status"><x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" /><div>{{ session('warning') }}</div></div>
@endif
@if ($errors->any())
    <div class="alert-bad mb-6" role="alert">
        <x-icon name="circle-alert" class="mt-0.5 size-5 shrink-0" />
        <div>
            <p class="font-semibold">{{ __('Please correct the highlighted fields.') }}</p>
            @if ($errors->count() > 1)
                <ul class="mt-1 list-disc pl-5">@foreach ($errors->all() as $e)<li>{{ $e }}</li>@endforeach</ul>
            @else
                <p>{{ $errors->first() }}</p>
            @endif
        </div>
    </div>
@endif
