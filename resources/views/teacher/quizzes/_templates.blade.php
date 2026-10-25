<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    @foreach ([
        'paithani' => ['background:radial-gradient(circle at 50% 40%,#fffaf0,#fff4dc);border:6px solid;border-image:repeating-linear-gradient(45deg,#c8175d 0 6px,#e7a10b 6px 9px,#5b2a86 9px 15px) 10', 'linear-gradient(90deg,#c8175d,#5b2a86)'],
        'classic' => ['background:#fdfcf8;outline:3px double #1d1846;outline-offset:-8px', '#1d1846'],
        'merit' => ['background:linear-gradient(135deg,#fffdf6,#fff3d3);border:2px solid #b8860b', '#7a1236'],
        'modern' => ['background:#fff;border-left:14px solid #0b5cad;border-image:linear-gradient(180deg,#0b5cad,#0f8c87,#e7a10b,#c8175d) 1', '#0b5cad'],
    ] as $key => [$style, $ink])
        <label class="cursor-pointer rounded-xl border-2 border-rule p-2 transition has-[input:checked]:border-rani has-[input:checked]:shadow-lg">
            <input type="radio" name="{{ $name ?? 'certificate_template' }}" value="{{ $key }}" class="sr-only" @checked($current === $key)>
            <span class="relative grid aspect-[297/210] place-items-center rounded-md text-center shadow-inner" style="{{ $style }}">
                <span>
                    <span class="block text-[0.55rem] font-bold uppercase tracking-widest text-ink-2">{{ __('Certificate') }}</span>
                    <span class="mx-auto mt-1 block h-1.5 w-16 rounded" style="background: {{ $ink }}"></span>
                    <span class="mx-auto mt-2 block h-1 w-20 rounded bg-ink/30"></span>
                    <span class="mx-auto mt-1 block h-1 w-14 rounded bg-ink/20"></span>
                    @if ($key === 'merit')<span class="absolute right-3 top-3 size-6 rounded-full" style="background:radial-gradient(circle,#f3c94b 0 55%,#d79c12 56%)"></span>@endif
                </span>
            </span>
            <span class="mt-2 block text-sm font-semibold">{{ __(\App\Models\Certificate::TEMPLATES[$key]) }}</span>
        </label>
    @endforeach
</div>
