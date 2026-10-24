<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Setting;
use Illuminate\Http\Request;

/** Site name, tagline, contact details, SEO defaults, home page text and switches. */
class SettingController extends Controller
{
    public const FIELDS = [
        'site_name' => ['string', 150], 'site_name_mr' => ['string', 150], 'site_name_hi' => ['string', 150],
        'tagline' => ['string', 255], 'tagline_mr' => ['string', 255], 'tagline_hi' => ['string', 255],
        'division' => ['string', 150], 'footer_note' => ['string', 500],
        'helpline_email' => ['email', 150], 'helpline_phone' => ['string', 30], 'helpline_hours' => ['string', 120],
        'seo_description' => ['string', 300], 'seo_keywords' => ['string', 255],
        'google_site_verification' => ['string', 120], 'analytics_id' => ['string', 40],
        'ticker_enabled' => ['bool'], 'registration_open' => ['bool'],
        'maintenance_message' => ['string', 300],
    ];

    public function edit()
    {
        $values = collect(self::FIELDS)->mapWithKeys(fn ($rule, $key) => [$key => Setting::get($key)]);
        return view('admin.settings', ['values' => $values]);
    }

    public function update(Request $request)
    {
        $rules = collect(self::FIELDS)->map(fn ($r) => $r[0] === 'bool' ? ['nullable', 'boolean'] : ['nullable', $r[0] === 'email' ? 'email' : 'string', 'max:' . $r[1]])->all();
        $rules['analytics_id'][] = 'regex:/^(G|UA)-[A-Z0-9-]+$/';
        $v = $request->validate($rules + ['site_name' => ['required', 'string', 'max:150']]);
        foreach (self::FIELDS as $key => $rule) {
            if ($rule[0] === 'bool') {
                $v[$key] = $request->boolean($key) ? '1' : '0';
            }
        }
        Setting::put(collect(self::FIELDS)->keys()->mapWithKeys(fn ($k) => [$k => $v[$k] ?? null])->all());
        AuditLog::record('settings.updated');
        return back()->with('status', __('Settings saved.'));
    }

    /** After uploading new files on shared hosting (no SSH): rebuild compiled pages and caches. */
    public function refresh()
    {
        \Illuminate\Support\Facades\Artisan::call('optimize:clear');
        AuditLog::record('settings.refresh');
        return back()->with('status', __('Website refreshed. New files are now in use.'));
    }
}
