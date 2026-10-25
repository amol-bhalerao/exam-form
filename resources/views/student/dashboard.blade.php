<x-layouts.portal :title="__('My students and forms')">
    <x-page-header :title="__('My students and forms')" :subtitle="__('Add every student you fill forms for. Each student’s details are saved for all future exams.')">
        <x-slot:actions>
            <a href="{{ route('student.students.create') }}" class="btn-primary"><x-icon name="user-plus" />{{ __('Add a student') }}</a>
        </x-slot:actions>
    </x-page-header>

    <a href="{{ route('learn.hub') }}" class="peacock rise mb-6 flex flex-wrap items-center gap-4 overflow-hidden rounded-2xl p-5 text-white no-underline sm:p-6">
        <span class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-marigold to-rani shadow-lg"><x-icon name="sparkles" class="size-6" /></span>
        <span class="min-w-0 flex-1"><span class="block font-display text-xl font-bold" style="font-stretch:110%">{{ __('New: Study zone') }}</span><span class="block text-white/85">{{ __('Practise topic-wise questions, take your teachers’ tests, read notes and get an AI study plan.') }}</span></span>
        <span class="btn-gold">{{ __('Open study zone') }}<x-icon name="arrow-right" /></span>
    </a>

    @if ($openExams->isNotEmpty())
        <section class="rise mb-8 overflow-hidden rounded-lg border border-board/20 bg-board-soft">
            <div class="flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4">
                <p class="flex items-center gap-2 font-semibold text-board-deep"><span class="relative flex size-2.5"><span class="absolute inline-flex size-full animate-ping rounded-full bg-leaf opacity-60"></span><span class="relative inline-flex size-2.5 rounded-full bg-leaf"></span></span>{{ __('Accepting forms now') }}</p>
                @foreach ($openExams as $exam)
                    <p class="text-sm text-ink-2">
                        <span class="font-semibold text-ink">{{ $exam->board->short_name }}</span> · {{ $exam->name }}
                        · {{ __('Last date') }} {{ $exam->closes_at->format('d M') }}
                        @if ($exam->inLateWindow())<span class="badge-warn ml-1">{{ __('Late fee period') }}</span>@endif
                    </p>
                @endforeach
            </div>
        </section>
    @endif

    @if ($students->isEmpty())
        <div class="rise sheet sheet-pad">
            <div class="grid items-center gap-8 lg:grid-cols-[1fr_22rem]">
                <div>
                    <h2 class="display-lg">{{ __('Start by adding the student') }}</h2>
                    <p class="lede mt-3">{{ __('Enter the student’s details once — name as on the leaving certificate, college, stream, photo and signature. You can add more students later.') }}</p>
                    <ol class="mt-6 grid gap-3 sm:grid-cols-3">
                        @foreach ([__('Add the student'), __('Fill the exam form'), __('Pay the fee — the form goes to the college')] as $step)
                            <li class="flex items-start gap-3"><span class="grid size-8 shrink-0 place-items-center rounded-full border-2 border-ink font-bold tabular-nums">{{ $loop->iteration }}</span><span class="pt-1 font-medium">{{ $step }}</span></li>
                        @endforeach
                    </ol>
                    <a href="{{ route('student.students.create') }}" class="btn-primary mt-7"><x-icon name="user-plus" />{{ __('Add a student') }}</a>
                </div>
                <div class="hidden rounded-lg border-2 border-dashed border-rule-strong p-6 lg:block" aria-hidden="true">
                    <div class="mx-auto h-28 w-22 rounded border-2 border-ink-3/50 bg-wash"></div>
                    <div class="mx-auto mt-4 h-3 w-40 rounded bg-wash"></div>
                    <div class="mx-auto mt-2 h-3 w-28 rounded bg-wash"></div>
                    <div class="mt-6 grid grid-cols-7 gap-1">@for ($i = 0; $i < 7; $i++)<span class="h-9 border-2 border-ink-3/50"></span>@endfor</div>
                </div>
            </div>
        </div>
    @else
        <div class="grid gap-5 lg:grid-cols-2">
            @foreach ($students as $student)
                <article class="rise sheet flex flex-col overflow-hidden" style="animation-delay: {{ $loop->index * 50 }}ms">
                    <div class="zari-thin" aria-hidden="true"></div>
                    <header class="flex items-start gap-4 p-5">
                        @if ($student->photoUrl())
                            <img src="{{ $student->photoUrl() }}" alt="" class="h-18 w-15 shrink-0 rounded border border-rule object-cover">
                        @else
                            <span class="grid h-18 w-15 shrink-0 place-items-center rounded border border-dashed border-rule-strong text-ink-3"><x-icon name="user" /></span>
                        @endif
                        <div class="min-w-0 flex-1">
                            <h2 class="title truncate">{{ $student->full_name }}</h2>
                            <p class="muted truncate text-sm">{{ $student->board->short_name }}@if ($student->stream && $student->board->has_streams) · {{ $student->stream->label }}@endif</p>
                            <p class="truncate text-sm text-ink-2" title="{{ $student->institute?->name }}">{{ $student->institute?->display_name ?? __('No college chosen') }}</p>
                        </div>
                        <div x-data="{ open: false }" class="relative">
                            <button type="button" class="btn-quiet btn-sm" @click="open = !open" :aria-expanded="open" aria-label="{{ __('More actions for :name', ['name' => $student->full_name]) }}"><x-icon name="settings" /></button>
                            <div x-show="open" x-transition x-cloak @click.outside="open = false" class="absolute right-0 z-20 mt-1 w-52 rounded-md border border-rule bg-sheet p-1 shadow-lg">
                                <a href="{{ route('student.students.edit', $student) }}" class="nav-link"><x-icon name="pencil" />{{ __('Edit details') }}</a>
                                @if ($student->applications->every(fn ($a) => $a->status === 'draft'))
                                    <form method="POST" action="{{ route('student.students.destroy', $student) }}" onsubmit="return confirm(@js(__('Remove :name and any draft forms?', ['name' => $student->full_name])))">
                                        @csrf @method('DELETE')
                                        <button class="nav-link w-full text-omr"><x-icon name="trash-2" />{{ __('Remove student') }}</button>
                                    </form>
                                @endif
                            </div>
                        </div>
                    </header>

                    @if ($missing = $student->missingFields())
                        <div class="mx-5 mb-4 alert-warn">
                            <x-icon name="triangle-alert" class="mt-0.5 size-5 shrink-0" />
                            <div class="text-sm"><p class="font-semibold">{{ __('Details needed before the exam form') }}</p><p>{{ implode(', ', $missing) }}</p>
                            <a href="{{ route('student.students.edit', $student) }}" class="mt-1 inline-block font-semibold">{{ __('Complete details') }} →</a></div>
                        </div>
                    @endif

                    <div class="flex-1 border-t border-rule">
                        @forelse ($student->applications as $app)
                            <div class="flex flex-wrap items-center gap-3 border-b border-rule px-5 py-3 last:border-b-0">
                                <div class="min-w-0 flex-1">
                                    <p class="truncate font-semibold">{{ $app->exam->name }}</p>
                                    <p class="text-sm muted tabular-nums">{{ $app->application_no }} · {{ $app->candidate_type_label }}</p>
                                </div>
                                <x-status :application="$app" />
                                @if ($app->editableByStudent())
                                    <a href="{{ route('student.applications.edit', [$app, $app->subjects()->exists() ? 'review' : 'subjects']) }}" class="btn-primary btn-sm">{{ $app->status === 'returned' ? __('Correct form') : __('Continue') }}</a>
                                @else
                                    <a href="{{ route('student.applications.show', $app) }}" class="btn-secondary btn-sm">{{ __('View') }}</a>
                                @endif
                            </div>
                        @empty
                            <p class="px-5 py-4 text-sm muted">{{ __('No exam forms yet.') }}</p>
                        @endforelse
                    </div>

                    @if (! $student->missingFields())
                        <footer class="border-t border-rule p-4">
                            <a href="{{ route('student.applications.create', $student) }}" class="btn-secondary w-full"><x-icon name="plus" />{{ __('Fill a new exam form') }}</a>
                        </footer>
                    @endif
                </article>
            @endforeach
        </div>
    @endif

    @if ($notices->isNotEmpty())
        <section class="mt-10">
            <div class="section-head"><h2 class="title">{{ __('Latest from the board') }}</h2><a href="{{ route('notices.index') }}" class="font-semibold">{{ __('All notices') }}</a></div>
            <div class="grid gap-3 sm:grid-cols-2">
                @foreach ($notices as $n)
                    <a href="{{ route('notices.show', $n) }}" class="card-link">
                        <p class="text-sm font-semibold text-marigold">{{ $n->category_label }} · {{ $n->published_at?->format('d M Y') }}</p>
                        <p class="mt-1 font-semibold">{{ $n->title }}</p>
                    </a>
                @endforeach
            </div>
        </section>
    @endif
</x-layouts.portal>
