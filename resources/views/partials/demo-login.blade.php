{{-- Staff sign-in page: demo credentials for this role and links to the others (testing mode only). --}}
@php $demo = \Database\Seeders\DemoAccountsSeeder::cards(); @endphp
@if ($demo && isset($demo['cards'][$role]))
    @php $c = $demo['cards'][$role]; @endphp
    <div class="mt-6 rounded-xl border-2 border-dashed border-marigold/60 bg-marigold-soft p-4" x-data
         x-init="if (new URLSearchParams(location.search).has('demo')) { $root.closest('.sheet').querySelector('#f_username').value = @js($c['username']); $root.closest('.sheet').querySelector('#password').value = @js($c['password']); }">
        <p class="flex items-center gap-2 font-semibold text-ink"><x-icon name="info" class="size-5 text-gold-deep" />{{ __('Demo account for testing') }}</p>
        <p class="mt-2 text-sm text-ink-2">{{ __('Username') }}: <b class="font-mono text-ink">{{ $c['username'] }}</b> · {{ __('Password') }}: <b class="font-mono text-ink">{{ $c['password'] }}</b></p>
        <button type="button" class="btn-gold btn-sm mt-3" @click="const s = $root.closest('.sheet'); s.querySelector('#f_username').value = @js($c['username']); s.querySelector('#password').value = @js($c['password']); s.querySelector('form').submit()"><x-icon name="arrow-right" />{{ __('Sign in with the demo account') }}</button>
        <p class="mt-3 text-xs text-ink-2">{{ __('Other roles:') }}
            @foreach ($demo['cards'] as $r => $o)@if ($r !== $role)<a href="{{ $o['url'] }}?demo=1" class="font-semibold">{{ __(\App\Models\User::ROLES[$r]) }}</a> · @endif @endforeach
            <a href="{{ route('demo') }}" class="font-semibold">{{ __('All demo logins') }}</a></p>
    </div>
@endif
