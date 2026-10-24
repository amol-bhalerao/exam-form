@php use App\Support\Codes; @endphp
<x-layouts.portal :title="__('Teachers and examiners')">
    <x-page-header :title="__('Teachers and examiners')" :subtitle="__('Keep the list of teachers and their board duties up to date. The board reviews examiners and moderators.')">
        <x-slot:actions><a href="{{ route('institute.teachers.create') }}" class="btn-primary"><x-icon name="user-plus" />{{ __('Add a teacher') }}</a></x-slot:actions>
    </x-page-header>

    <div class="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-5">
        <x-stat :label="__('Teachers')" :value="$stats['total']" />
        <x-stat :label="__('Examiners / moderators')" :value="$stats['examiners']" tone="board" />
        <x-stat :label="__('Approved by board')" :value="$stats['approved']" tone="leaf" />
        <x-stat :label="__('Pending review')" :value="$stats['pending']" tone="marigold" />
        <x-stat :label="__('Not approved')" :value="$stats['rejected']" tone="omr" />
    </div>

    <form method="GET" class="filters">
        <div class="field"><label class="label" for="q">{{ __('Search') }}</label><input id="q" name="q" value="{{ request('q') }}" class="input" placeholder="{{ __('Name or mobile') }}"></div>
        <div class="field"><label class="label" for="role">{{ __('Duty') }}</label><select id="role" name="role" class="select"><option value="">{{ __('All') }}</option>@foreach (Codes::options(Codes::DUTY_ROLES) as $k => $l)<option value="{{ $k }}" @selected(request('role') === $k)>{{ $l }}</option>@endforeach</select></div>
        <div class="field"><label class="label" for="status">{{ __('Board review') }}</label><select id="status" name="status" class="select"><option value="">{{ __('All') }}</option>@foreach (['pending' => __('Pending'), 'approved' => __('Approved'), 'rejected' => __('Not approved')] as $k => $l)<option value="{{ $k }}" @selected(request('status') === $k)>{{ $l }}</option>@endforeach</select></div>
        <button class="btn-secondary"><x-icon name="filter" />{{ __('Apply') }}</button>
    </form>

    @if ($teachers->isEmpty())
        <x-empty :title="__('No teachers added yet')" icon="users">{{ __('Add teachers with their subject and the board duties they can take — examiner, moderator, paper setter and others.') }}
            <x-slot:action><a href="{{ route('institute.teachers.create') }}" class="btn-primary"><x-icon name="user-plus" />{{ __('Add a teacher') }}</a></x-slot:action></x-empty>
    @else
        <div class="table-wrap">
            <table class="table">
                <thead><tr><th>{{ __('Name') }}</th><th>{{ __('Subject') }}</th><th>{{ __('Duties') }}</th><th class="num">{{ __('Experience') }}</th><th>{{ __('Board review') }}</th><th></th></tr></thead>
                <tbody>
                @foreach ($teachers as $t)
                    <tr @class(['opacity-60' => ! $t->is_active])>
                        <td><p class="font-semibold">{{ $t->full_name }}</p><p class="text-sm muted">{{ $t->designation ?: '—' }} · {{ $t->mobile }}</p></td>
                        <td class="text-sm">{{ $t->subject?->label ?? '—' }}</td>
                        <td class="text-sm">{{ $t->rolesLabel() }}@unless ($t->available_for_duty)<span class="badge-muted ml-1">{{ __('Not available') }}</span>@endunless</td>
                        <td class="num">{{ $t->experience_years ?? '—' }}@if ($t->examiner_years)<p class="text-xs muted">{{ __(':n as examiner', ['n' => $t->examiner_years]) }}</p>@endif</td>
                        <td>
                            <span class="{{ ['approved' => 'badge-ok', 'rejected' => 'badge-bad'][$t->board_status] ?? 'badge-pending' }}">{{ ['approved' => __('Approved'), 'rejected' => __('Not approved')][$t->board_status] ?? __('Pending') }}</span>
                            @if ($t->board_note)<p class="mt-1 max-w-56 text-xs muted">{{ $t->board_note }}</p>@endif
                        </td>
                        <td class="text-right whitespace-nowrap">
                            <a href="{{ route('institute.teachers.edit', $t) }}" class="btn-secondary btn-sm"><x-icon name="pencil" />{{ __('Edit') }}</a>
                        </td>
                    </tr>
                @endforeach
                </tbody>
            </table>
        </div>
        <div class="mt-5">{{ $teachers->links() }}</div>
    @endif
</x-layouts.portal>
