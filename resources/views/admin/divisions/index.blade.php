<x-layouts.portal :title="__('Divisional boards')">
    <x-page-header :title="__('Divisional boards')" :subtitle="__('Each college or school belongs to a division. A board officer linked to a division sees only that division’s colleges, forms and exams.')">
        <x-slot:actions><a href="{{ route('admin.divisions.create') }}" class="btn-primary"><x-icon name="plus" />{{ __('Add division') }}</a></x-slot:actions>
    </x-page-header>
    <div class="table-wrap"><table class="table">
        <thead><tr><th>{{ __('Code') }}</th><th>{{ __('Division') }}</th><th>{{ __('Contact') }}</th><th class="num">{{ __('Colleges / schools') }}</th><th class="num">{{ __('Board officers') }}</th><th>{{ __('Status') }}</th><th></th></tr></thead>
        <tbody>@foreach ($divisions as $d)
            <tr @class(['opacity-60' => ! $d->is_active])>
                <td><span class="kbd-code">{{ $d->code }}</span></td>
                <td><p class="font-semibold">{{ $d->name }}</p><p class="text-sm muted">{{ $d->name_mr }}@if ($d->name_hi) · {{ $d->name_hi }}@endif</p></td>
                <td class="text-sm">{{ $d->email ?: '—' }}@if ($d->phone)<p class="muted">{{ $d->phone }}</p>@endif</td>
                <td class="num">@if ($d->institutes_count)<a href="{{ route('admin.institutes.index', ['division' => $d->id]) }}">{{ number_format($d->institutes_count) }}</a>@else 0 @endif</td>
                <td class="num">{{ $d->users_count }}</td>
                <td><span class="{{ $d->is_active ? 'badge-ok' : 'badge-muted' }}">{{ $d->is_active ? __('Active') : __('Inactive') }}</span></td>
                <td class="text-right whitespace-nowrap"><a href="{{ route('admin.divisions.edit', $d) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a></td>
            </tr>
        @endforeach</tbody>
    </table></div>
    <p class="mt-4 text-sm muted">{{ __('To give a divisional board its own login, go to Users and logins → Add login → role Board, and choose the division.') }}</p>
</x-layouts.portal>
