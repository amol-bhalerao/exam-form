<x-layouts.portal :title="__('Add a question')">
    <x-page-header :title="__('Add a question for everyone')" :subtitle="__('Your question goes to your teachers. Once approved, all students can practise it — and your name is shown with it.')" :back="route('learn.contribute.index')" />
    <form method="POST" action="{{ route('learn.contribute.store') }}" class="grid max-w-4xl gap-6">
        @csrf
        @include('partials.question-fields')
        <div><button class="btn-primary"><x-icon name="send" />{{ __('Send for review') }}</button></div>
    </form>
</x-layouts.portal>
