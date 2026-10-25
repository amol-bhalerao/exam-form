<x-layouts.portal :title="__('Tests and certificates')">
    <x-page-header :title="__('Tests and certificates')" :subtitle="__('Unit tests and class tests for your college. Each student gets their own shuffled set of questions and options.')">
        <x-slot:actions><a href="{{ route('teacher.quizzes.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('Schedule a test') }}</a></x-slot:actions>
    </x-page-header>
    @if ($quizzes->isEmpty())
        <x-empty :title="__('No tests yet')" icon="timer">{{ __('Choose the subject, topics, number of questions, time and marks. Students take it once, in a protected test window.') }}
            <x-slot:action><a href="{{ route('teacher.quizzes.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('Schedule a test') }}</a></x-slot:action></x-empty>
    @else
        <div class="table-wrap"><table class="table">
            <thead><tr><th>{{ __('Test') }}</th><th>{{ __('When') }}</th><th class="num">{{ __('Questions') }}</th><th class="num">{{ __('Taken') }}</th><th>{{ __('Status') }}</th><th></th></tr></thead>
            <tbody>@foreach ($quizzes as $q)
                @php $state = $q->state(); @endphp
                <tr>
                    <td><a href="{{ route('teacher.quizzes.show', $q) }}" class="font-semibold">{{ $q->title }}</a><p class="text-sm muted">{{ $q->subject->label }}@if ($q->stream) · {{ $q->stream->label }}@endif · {{ __('by :name', ['name' => $q->author?->name]) }}</p></td>
                    <td class="text-sm whitespace-nowrap">{{ $q->starts_at->format('d M, h:i A') }}<p class="muted">{{ __('to') }} {{ $q->ends_at->format('d M, h:i A') }}</p></td>
                    <td class="num">{{ $q->question_count }}<p class="text-xs muted">{{ $q->duration_minutes }} {{ __('min') }}</p></td>
                    <td class="num">{{ $q->finished_count }}</td>
                    <td><span class="{{ ['draft' => 'badge-muted', 'upcoming' => 'badge-info', 'live' => 'badge-ok', 'ended' => 'badge-pending'][$state] }}">{{ ['draft' => __('Draft'), 'upcoming' => __('Upcoming'), 'live' => __('Live'), 'ended' => __('Ended')][$state] }}</span></td>
                    <td class="text-right whitespace-nowrap"><a href="{{ route('teacher.quizzes.show', $q) }}" class="btn-secondary btn-sm"><x-icon name="chart-column" />{{ __('Results') }}</a></td>
                </tr>
            @endforeach</tbody>
        </table></div>
        <div class="mt-5">{{ $quizzes->links() }}</div>
    @endif
</x-layouts.portal>
