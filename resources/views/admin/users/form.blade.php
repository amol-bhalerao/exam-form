@php use App\Models\User; $editing = $user->exists; @endphp
<x-layouts.portal :title="$editing ? $user->name : __('New login')">
    <x-page-header :title="$editing ? __('Edit login') : __('New login')" :subtitle="$editing ? $user->name : null" :back="route('admin.users.index')" />
    <form method="POST" action="{{ $editing ? route('admin.users.update', $user) : route('admin.users.store') }}" class="grid max-w-4xl gap-6"
          x-data="{ role: @js(old('role', $user->role)), pw: '', show: false }">
        @csrf @if ($editing) @method('PUT') @endif
        <section class="sheet sheet-pad">
            <h2 class="title mb-4">{{ __('Role') }}</h2>
            <div class="grid gap-2 sm:grid-cols-4" role="radiogroup">
                @foreach (User::ROLES as $r => $l)
                    <label class="flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-rule-strong px-3 font-semibold has-[input:checked]:border-board has-[input:checked]:bg-board-soft has-[input:checked]:text-board">
                        <input type="radio" name="role" value="{{ $r }}" x-model="role" class="sr-only" @disabled($editing && $user->is(auth()->user()))> {{ __($l) }}
                    </label>
                @endforeach
            </div>
            @if ($editing && $user->is(auth()->user()))<input type="hidden" name="role" value="{{ $user->role }}">@endif
        </section>
        <section class="sheet sheet-pad">
            <div class="fieldset">
                <x-form.input name="name" :label="__('Name')" :value="$user->name" required span />
                <x-form.input name="username" :label="__('Username')" :value="$user->username" x-bind:required="role !== 'student'" autocomplete="off" :hint="__('Used to sign in at the private staff address.')" />
                <x-form.input name="email" type="email" :label="__('Email')" :value="$user->email" />
                <x-form.input name="mobile" type="tel" :label="__('Mobile')" :value="$user->mobile" inputmode="numeric" maxlength="10" />
                <div class="field" x-show="role === 'board'" x-cloak><label class="label" for="board_id">{{ __('Board') }}</label>
                    <select id="board_id" name="board_id" class="select" :required="role === 'board'"><option value="">{{ __('Select') }}</option>@foreach ($boards as $b)<option value="{{ $b->id }}" @selected(old('board_id', $user->board_id) == $b->id)>{{ $b->short_name }}</option>@endforeach</select></div>
                <div class="field sm:col-span-2" x-show="role === 'institute'" x-cloak @click.outside="open = false"
                     x-data="institutePicker({ url: @js(route('lookup.institutes', ['all' => 1])), initialId: @js(old('institute_id', $user->institute_id)), initialLabel: @js($institute ? $institute->college_no . ' · ' . $institute->name : null) })">
                    <label class="label" for="institute_q">{{ __('Institute') }}</label>
                    <div class="relative">
                        <x-icon name="search" class="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink-3" />
                        <input id="institute_q" type="text" class="input pl-10" autocomplete="off" x-model="query" @input.debounce.250ms="search()" @keydown="key($event)" placeholder="{{ __('Type the name or index number') }}" role="combobox" :aria-expanded="open" aria-controls="institute_list">
                        <input type="hidden" name="institute_id" :value="selectedId">
                        <ul id="institute_list" role="listbox" x-show="open" x-cloak class="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-md border border-rule bg-sheet py-1 shadow-lg">
                            <template x-for="(item, i) in results" :key="item.id">
                                <li role="option" :aria-selected="i === active" @click="choose(item)" @mouseenter="active = i" class="cursor-pointer px-3 py-2" :class="i === active && 'bg-board-soft'"><p class="font-medium" x-text="item.label"></p><p class="text-xs muted" x-text="item.meta"></p></li>
                            </template>
                            <li x-show="!loading && results.length === 0" class="px-3 py-2 muted">{{ __('No match.') }}</li>
                        </ul>
                    </div>
                    @error('institute_id')<p class="error">{{ $message }}</p>@enderror
                </div>
            </div>
        </section>
        <section class="sheet sheet-pad">
            <h2 class="title mb-1">{{ $editing ? __('Reset password') : __('Password') }}</h2>
            <p class="muted mb-4">{{ $editing ? __('Leave empty to keep the current password.') : __('At least 8 characters with letters and numbers.') }}</p>
            <div class="flex flex-wrap items-end gap-3">
                <div class="field min-w-0 flex-1 basis-64">
                    <label class="label" for="password">{{ __('New password') }}</label>
                    <input id="password" name="password" :type="show ? 'text' : 'password'" type="password" class="input" x-model="pw" autocomplete="new-password" @unless($editing) :required="role !== 'student'" @endunless>
                    @error('password')<p class="error">{{ $message }}</p>@enderror
                </div>
                <button type="button" class="btn-secondary" @click="pw = @js($suggested); show = true">{{ __('Suggest one') }}</button>
                <button type="button" class="btn-quiet" @click="show = !show" x-text="show ? @js(__('Hide')) : @js(__('Show'))"></button>
            </div>
            <div class="mt-5 grid gap-3">
                <label class="flex items-center gap-3"><input type="checkbox" name="must_change_password" value="1" class="check" @checked(old('must_change_password', $user->must_change_password))> {{ __('Ask to change the password at next sign-in') }}</label>
                <label class="flex items-center gap-3"><input type="checkbox" name="is_active" value="1" class="check" @checked(old('is_active', $user->is_active)) @disabled($editing && $user->is(auth()->user()))> {{ __('Active (can sign in)') }}</label>
            </div>
        </section>
        @if ($editing && $user->role === 'student' && $user->students->isNotEmpty())
            <section class="sheet sheet-pad"><h2 class="title mb-3">{{ __('Students on this account') }}</h2>
                <ul class="grid gap-1 text-sm">@foreach ($user->students as $s)<li>{{ $s->full_name }} · {{ $s->mobile }}</li>@endforeach</ul></section>
        @endif
        <div class="flex flex-wrap justify-end gap-3">
            @if ($editing && ! $user->is(auth()->user()))<button form="delete-user" class="btn-quiet mr-auto text-omr"><x-icon name="trash-2" />{{ __('Remove') }}</button>@endif
            <a href="{{ route('admin.users.index') }}" class="btn-quiet">{{ __('Cancel') }}</a>
            <button class="btn-primary">{{ __('Save') }}</button>
        </div>
    </form>
    @if ($editing && ! $user->is(auth()->user()))
        <form id="delete-user" method="POST" action="{{ route('admin.users.destroy', $user) }}" onsubmit="return confirm(@js(__('Remove :name?', ['name' => $user->name])))">@csrf @method('DELETE')</form>
    @endif
</x-layouts.portal>
