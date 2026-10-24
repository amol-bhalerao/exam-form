@php use App\Models\User; @endphp
<x-layouts.portal :title="__('Super admin')">
    <x-page-header :title="__('Overview')" :subtitle="__('Everything on the portal at a glance.')">
        <x-slot:actions>
            <a href="{{ route('admin.pages.create') }}" class="btn-secondary"><x-icon name="plus" />{{ __('New page') }}</a>
            <a href="{{ route('admin.users.create') }}" class="btn-primary"><x-icon name="user-plus" />{{ __('New login') }}</a>
        </x-slot:actions>
    </x-page-header>

    @if ($failedLogins >= 10)
        <div class="alert-warn mb-6"><x-icon name="shield-alert" class="mt-0.5 size-5 shrink-0" /><p>{{ __(':n failed staff sign-in attempts in the last 24 hours.', ['n' => $failedLogins]) }} <a href="{{ route('admin.audit.index', ['action' => 'login']) }}">{{ __('See activity') }}</a></p></div>
    @endif

    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <x-stat :label="__('Fees collected')" :value="'₹' . number_format($collected)" tone="ink" :href="route('admin.payments.index', ['status' => 'paid'])" :hint="__(':n payments today', ['n' => $paymentsToday])" />
        <x-stat :label="__('Paid exam forms')" :value="array_sum($counts) - $counts['draft']" tone="board" />
        <x-stat :label="__('Student accounts')" :value="$users[User::STUDENT] ?? 0" tone="leaf" :href="route('admin.users.index', ['role' => 'student'])" />
        <x-stat :label="__('Live notices')" :value="$notices" tone="marigold" :href="route('admin.notices.index')" :hint="__(':p pages published, :d drafts', ['p' => $pages['published'], 'd' => $pages['draft']])" />
    </div>

    <div class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
        <div class="grid gap-6 self-start">
            <section class="sheet overflow-hidden rise">
                <div class="border-b border-rule px-6 py-4"><h2 class="title">{{ __('Boards') }}</h2></div>
                <div class="overflow-x-auto"><table class="table">
                    <thead><tr><th>{{ __('Board') }}</th><th class="num">{{ __('Institutes') }}</th><th class="num">{{ __('Exams') }}</th><th class="num">{{ __('Paid forms') }}</th><th></th></tr></thead>
                    <tbody>@foreach ($boards as $b)
                        <tr><td><p class="font-semibold">{{ $b->short_name }}</p><p class="text-sm muted">{{ $b->name }}</p></td>
                            <td class="num"><a href="{{ route('admin.institutes.index', ['board' => $b->id]) }}">{{ number_format($b->institutes_count) }}</a></td>
                            <td class="num">{{ $b->exams_count }}</td><td class="num">{{ number_format($b->forms) }}</td>
                            <td class="text-right"><a href="{{ route('admin.subjects.index', ['board' => $b->id]) }}" class="btn-quiet btn-sm">{{ __('Subjects') }}</a></td></tr>
                    @endforeach</tbody>
                </table></div>
            </section>
            <section class="sheet sheet-pad rise">
                <h2 class="title mb-4">{{ __('Logins') }}</h2>
                <div class="grid gap-3 sm:grid-cols-4">
                    @foreach (User::ROLES as $role => $label)
                        <a href="{{ route('admin.users.index', ['role' => $role]) }}" class="card-link rounded-md border border-rule p-4 text-ink no-underline"><p class="text-sm muted">{{ __($label) }}</p><p class="tile-num mt-1 text-2xl">{{ number_format($users[$role] ?? 0) }}</p></a>
                    @endforeach
                </div>
            </section>
            <section class="sheet overflow-hidden rise">
                <div class="flex items-center justify-between border-b border-rule px-6 py-4"><h2 class="title">{{ __('Latest payments') }}</h2><a href="{{ route('admin.payments.index') }}" class="text-sm font-semibold">{{ __('See all') }}</a></div>
                @forelse ($recentPayments as $p)
                    <div class="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-6 py-3 last:border-0">
                        <span class="min-w-0"><span class="font-semibold">{{ $p->application?->student?->full_name ?? '—' }}</span><span class="block text-sm muted tabular-nums">{{ $p->order_id }} · {{ $p->application?->application_no }}</span></span>
                        <span class="text-right"><span class="font-semibold tabular-nums">₹{{ number_format($p->amount) }}</span><span class="block text-xs muted">{{ $p->paid_at?->diffForHumans() }}</span></span>
                    </div>
                @empty
                    <p class="px-6 py-6 muted">{{ __('No payments yet.') }}</p>
                @endforelse
            </section>
        </div>
        <section class="sheet sheet-pad self-start rise rise-2">
            <div class="mb-4 flex items-center justify-between"><h2 class="title">{{ __('Recent activity') }}</h2><a href="{{ route('admin.audit.index') }}" class="text-sm font-semibold">{{ __('See all') }}</a></div>
            <ol class="grid gap-3 text-sm">
                @foreach ($activity as $log)
                    <li class="border-b border-rule pb-3 last:border-0"><p class="font-semibold">{{ \Illuminate\Support\Str::headline(str_replace('.', ' ', $log->action)) }}</p><p class="muted">{{ $log->user?->name ?? __('System') }} · {{ $log->created_at?->diffForHumans() }}</p></li>
                @endforeach
            </ol>
        </section>
    </div>
</x-layouts.portal>
