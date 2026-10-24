@component('errors.layout', ['code' => 419, 'heading' => __('This page has expired'), 'text' => __('For your safety the form expired. Go back, refresh the page and try again.')])
@slot('action')<a href="{{ url()->previous() }}" class="btn-secondary">{{ __('Go back') }}</a>@endslot
@endcomponent
