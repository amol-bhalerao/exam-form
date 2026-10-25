<x-layouts.portal :title="$quiz->title">
    <x-page-header :title="$quiz->title" :subtitle="$quiz->subject->label . ' · ' . __('set by :name', ['name' => $quiz->author?->name ?? __('your teacher')])" :back="route('learn.tests.index')" />
    <div class="grid max-w-4xl gap-6">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <x-stat :label="__('Questions')" :value="$quiz->question_count" tone="board" />
            <x-stat :label="__('Time')" :value="$quiz->duration_minutes . ' ' . __('min')" tone="marigold" />
            <x-stat :label="__('Marks each')" :value="rtrim(rtrim(number_format($quiz->marks_per_question, 2), '0'), '.') . ($quiz->negative_marks > 0 ? ' / −' . rtrim(rtrim(number_format($quiz->negative_marks, 2), '0'), '.') : '')" tone="leaf" />
            <x-stat :label="__('Pass mark')" :value="$quiz->pass_percent . '%'" tone="rani" />
        </div>
        @if ($quiz->instructions)
            <section class="sheet sheet-pad"><h2 class="title mb-2">{{ __('Teacher’s instructions') }}</h2><p class="whitespace-pre-line text-ink-2">{{ $quiz->instructions }}</p></section>
        @endif
        <section class="overflow-hidden rounded-2xl border-2 border-omr/30 bg-sheet">
            <div class="flex items-center gap-3 p-5" style="background: linear-gradient(120deg, var(--color-omr-soft), #fff)">
                <span class="grid size-11 place-items-center rounded-full bg-omr text-white"><x-icon name="shield-alert" class="size-6" /></span>
                <h2 class="title">{{ __('Read carefully before you start') }}</h2>
            </div>
            <ol class="grid gap-3 p-5 text-[1.02rem]">
                <li class="flex gap-3"><b class="text-omr">1.</b>{{ __('You can take this test only once. When you press Start, the timer begins and keeps running.') }}</li>
                <li class="flex gap-3"><b class="text-omr">2.</b><span><b>{{ __('Do not close, reload or go back from the test page.') }}</b> {{ __('If the page is closed, your test ends immediately and is submitted with the answers saved so far. You cannot take it again.') }}</span></li>
                <li class="flex gap-3"><b class="text-omr">3.</b>{{ trans_choice('Switching to another app, tab or window gives a warning. After :count warning, leaving again ends the test.|Switching to another app, tab or window gives a warning. After :count warnings, leaving again ends the test.', $quiz->max_warnings, ['count' => $quiz->max_warnings]) }}</li>
                <li class="flex gap-3"><b class="text-omr">4.</b>{{ __('Keep your phone charged and the internet on. Turn off calls and notifications if you can — a phone call can count as leaving the page.') }}</li>
                <li class="flex gap-3"><b class="text-omr">5.</b>{{ __('Answers save automatically. When time is up, the test submits itself.') }}</li>
                @if ($quiz->negative_marks > 0)<li class="flex gap-3"><b class="text-omr">6.</b>{{ __('Wrong answers lose :n mark(s). Leave a question blank if you are unsure.', ['n' => rtrim(rtrim(number_format($quiz->negative_marks, 2), '0'), '.')]) }}</li>@endif
            </ol>
            <form method="POST" action="{{ route('learn.tests.start', $quiz) }}" class="border-t border-rule p-5" x-data="{ ok: false }">
                @csrf
                <label class="flex items-start gap-3 font-semibold"><input type="checkbox" name="agree" value="1" class="check mt-1" x-model="ok">{{ __('I have read the rules. I am :name and I will stay on the test page until I submit.', ['name' => $student->full_name]) }}</label>
                @error('agree')<p class="error mt-2">{{ $message }}</p>@enderror
                <div class="mt-4 flex flex-wrap items-center gap-3">
                    @if ($quiz->state() === 'live')
                        <button class="btn-rani text-lg" :disabled="!ok"><x-icon name="play" />{{ __('Start the test') }}</button>
                        <span class="text-sm muted">{{ __('Closes :date', ['date' => $quiz->ends_at->format('d M, h:i A')]) }}</span>
                    @elseif ($quiz->state() === 'upcoming')
                        <span class="badge-info">{{ __('Opens :date', ['date' => $quiz->starts_at->format('d M, h:i A')]) }}</span>
                    @else
                        <span class="badge-muted">{{ __('This test has closed.') }}</span>
                    @endif
                </div>
            </form>
        </section>
    </div>
</x-layouts.portal>
