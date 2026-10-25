<x-layouts.portal :title="__('Streams')">
    <x-page-header :title="__('Streams')" :subtitle="__('Names shown to students in each language.')" />
    <div class="grid gap-6">
        @foreach ($boards as $b)
            <section class="sheet overflow-hidden">
                <div class="border-b border-rule px-6 py-4"><h2 class="title">{{ $b->short_name }} <span class="text-base font-normal muted">{{ $b->name }}</span></h2></div>
                @forelse ($b->streams as $s)
                    <form method="POST" action="{{ route('admin.streams.update', $s) }}" class="grid items-end gap-3 border-b border-rule px-6 py-4 last:border-0 sm:grid-cols-[5rem_1fr_1fr_1fr_5rem_auto]">
                        @csrf @method('PUT')
                        <div><p class="label">{{ __('Code') }}</p><span class="kbd-code">{{ $s->code }}</span><p class="mt-1 text-xs muted">{{ trans_choice(':count subject|:count subjects', $s->subjects_count, ['count' => $s->subjects_count]) }}</p></div>
                        <div class="field"><label class="label" for="n{{ $s->id }}">English</label><input id="n{{ $s->id }}" name="name" value="{{ $s->name }}" class="input" required></div>
                        <div class="field"><label class="label" for="m{{ $s->id }}">मराठी</label><input id="m{{ $s->id }}" name="name_mr" value="{{ $s->name_mr }}" class="input"></div>
                        <div class="field"><label class="label" for="h{{ $s->id }}">हिंदी</label><input id="h{{ $s->id }}" name="name_hi" value="{{ $s->name_hi }}" class="input"></div>
                        <div class="field"><label class="label" for="o{{ $s->id }}">{{ __('Order') }}</label><input id="o{{ $s->id }}" name="sort" type="number" value="{{ $s->sort }}" class="input"></div>
                        <button class="btn-secondary">{{ __('Save') }}</button>
                    </form>
                @empty
                    <p class="px-6 py-5 muted">{{ __('This board has no streams.') }}</p>
                @endforelse
                <form method="POST" action="{{ route('admin.streams.store') }}" class="grid items-end gap-3 border-t border-dashed border-rule-strong bg-wash/50 px-6 py-4 sm:grid-cols-[5rem_1fr_1fr_1fr_5rem_auto]">
                    @csrf <input type="hidden" name="board_id" value="{{ $b->id }}">
                    <div class="field"><label class="label" for="nc{{ $b->id }}">{{ __('Code') }}</label><input id="nc{{ $b->id }}" name="code" class="input uppercase" required maxlength="10" placeholder="SCI"></div>
                    <div class="field"><label class="label" for="nn{{ $b->id }}">{{ __('New stream') }}</label><input id="nn{{ $b->id }}" name="name" class="input" required placeholder="Science"></div>
                    <div class="field"><label class="label" for="nm{{ $b->id }}">मराठी</label><input id="nm{{ $b->id }}" name="name_mr" class="input"></div>
                    <div class="field"><label class="label" for="nh{{ $b->id }}">हिंदी</label><input id="nh{{ $b->id }}" name="name_hi" class="input"></div>
                    <div class="field"><label class="label" for="nu{{ $b->id }}">{{ __('No.') }}</label><input id="nu{{ $b->id }}" name="number" type="number" class="input" min="0" max="99"></div>
                    <button class="btn-primary"><x-icon name="plus" />{{ __('Add') }}</button>
                </form>
            </section>
        @endforeach
    </div>
</x-layouts.portal>
