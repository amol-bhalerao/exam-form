@if (isset($learners) && $learners->count() > 1)
    <form method="POST" action="{{ route('learn.switch') }}" class="flex items-center gap-2">
        @csrf
        <label for="learner" class="text-sm font-semibold text-ink-2">{{ __('Practising as') }}</label>
        <select id="learner" name="student" class="select !min-h-10 !w-auto" onchange="this.form.submit()">
            @foreach ($learners as $l)<option value="{{ $l->id }}" @selected($l->id === $learner->id)>{{ $l->full_name }}</option>@endforeach
        </select>
    </form>
@endif
