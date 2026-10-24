@php use App\Models\User; @endphp
<x-layouts.portal :title="__('Users and logins')">
    <x-page-header :title="__('Users and logins')" :subtitle="__('Staff sign in at private addresses with a username and password. Students sign in with Google.')">
        <x-slot:actions><a href="{{ route('admin.users.create', ['role' => request('role') && request('role') !== 'student' ? request('role') : null]) }}" class="btn-primary"><x-icon name="user-plus" />{{ __('New login') }}</a></x-slot:actions>
    </x-page-header>
    <nav class="mb-5 flex gap-1 overflow-x-auto border-b border-rule">
        <a href="{{ route('admin.users.index', request()->except('role', 'page')) }}" @class(['tab', 'tab-active' => ! request('role')])>{{ __('All') }}</a>
        @foreach (User::ROLES as $r => $l)<a href="{{ route('admin.users.index', array_merge(request()->except('page'), ['role' => $r])) }}" @class(['tab', 'tab-active' => request('role') === $r])>{{ __($l) }} <span class="tab-count">{{ number_format($counts[$r] ?? 0) }}</span></a>@endforeach
    </nav>
    <form method="GET" class="filters">
        @if (request('role'))<input type="hidden" name="role" value="{{ request('role') }}">@endif
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name, username, email, mobile or index no.') }}"></div>
        <div class="field"><label class="label" for="active">{{ __('Status') }}</label><select id="active" name="active" class="select"><option value="">{{ __('All') }}</option><option value="no" @selected(request('active') === 'no')>{{ __('Inactive only') }}</option></select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>
    <div class="table-wrap">
        <table class="table">
            <thead><tr><th>{{ __('Name') }}</th><th>{{ __('Sign-in') }}</th><th>{{ __('Role') }}</th><th>{{ __('Linked to') }}</th><th>{{ __('Last sign-in') }}</th><th></th></tr></thead>
            <tbody>
            @forelse ($users as $u)
                <tr @class(['opacity-60' => ! $u->is_active])>
                    <td class="min-w-48"><p class="font-semibold">{{ $u->name }}</p>@unless ($u->is_active)<span class="badge-muted">{{ __('Inactive') }}</span>@endunless @if ($u->must_change_password)<span class="badge-warn">{{ __('Must change password') }}</span>@endif</td>
                    <td class="text-sm">@if ($u->username)<span class="kbd-code">{{ $u->username }}</span>@endif<p class="muted break-all">{{ $u->email }}</p></td>
                    <td class="text-sm">{{ __(User::ROLES[$u->role] ?? $u->role) }}</td>
                    <td class="max-w-64 text-sm">{{ $u->institute ? $u->institute->college_no . ' · ' . \Illuminate\Support\Str::limit($u->institute->name, 40) : ($u->board?->short_name ?? ($u->role === 'student' ? trans_choice(':count student|:count students', $u->students_count, ['count' => $u->students_count]) : '—')) }}</td>
                    <td class="text-sm whitespace-nowrap">{{ $u->last_login_at?->diffForHumans() ?? '—' }}</td>
                    <td class="text-right"><a href="{{ route('admin.users.edit', $u) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a></td>
                </tr>
            @empty
                <tr><td colspan="6" class="py-8 text-center muted">{{ __('No users match.') }}</td></tr>
            @endforelse
            </tbody>
        </table>
    </div>
    <div class="mt-5">{{ $users->links() }}</div>
</x-layouts.portal>
