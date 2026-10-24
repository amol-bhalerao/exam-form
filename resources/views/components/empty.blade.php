@props(['title', 'icon' => 'inbox'])
<div {{ $attributes->class('rounded-2xl border-2 border-dashed border-board/25 bg-gradient-to-br from-board-soft/60 via-white to-rani-soft/50 px-6 py-12 text-center') }}>
    <span class="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-board to-rani text-white shadow-lg"><x-icon :name="$icon" class="size-8" /></span>
    <p class="title mt-3">{{ $title }}</p>
    @if (trim($slot))<div class="muted mx-auto mt-2 max-w-md">{{ $slot }}</div>@endif
    @isset($action)<div class="mt-5">{{ $action }}</div>@endisset
</div>
