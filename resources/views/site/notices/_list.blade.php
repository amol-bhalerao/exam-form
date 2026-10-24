@if ($notices->isEmpty())
    <x-empty :title="__('No notices yet')" icon="megaphone">{{ __('Board notices, circulars and timetables will be listed here.') }}</x-empty>
@else
    <ul class="grid gap-3">
        @foreach ($notices as $n)
            <li class="sheet transition-transform hover:-translate-y-0.5">
                <a href="{{ route('notices.show', $n) }}" class="group grid grid-cols-[4.5rem_1fr] items-center gap-4 p-4 no-underline">
                    <span class="rounded-xl bg-gradient-to-br from-board to-plum py-2 text-center text-white">
                        <span class="block font-display text-3xl font-bold leading-none text-white" style="font-stretch:110%">{{ ($n->published_at ?? $n->created_at)->format('d') }}</span>
                        <span class="block text-xs text-white/80">{{ ($n->published_at ?? $n->created_at)->translatedFormat('M Y') }}</span>
                    </span>
                    <span class="min-w-0">
                        <span class="flex flex-wrap items-center gap-2 text-sm">
                            <span class="badge-pending">{{ $n->category_label }}</span>
                            @if ($n->board)<span class="badge-info">{{ $n->board->short_name }}</span>@endif
                            @if ($n->is_pinned)<span class="badge-rani">{{ __('Important') }}</span>@endif
                        </span>
                        <span class="mt-1 block font-semibold text-ink group-hover:text-board group-hover:underline">{{ $n->title }}</span>
                    </span>
                </a>
            </li>
        @endforeach
    </ul>
@endif
