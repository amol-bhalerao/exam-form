<?php

namespace App\Http\Controllers\Institute;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;

/** College contact details. Index number, UDISE and name are managed by the board / super admin. */
class ProfileController extends Controller
{
    public function edit(Request $request)
    {
        return view('institute.profile', ['institute' => $request->user()->institute->load('board', 'streams')]);
    }

    public function update(Request $request)
    {
        $institute = $request->user()->institute;
        $data = $request->validate([
            'principal_name' => ['required', 'string', 'max:120'],
            'contact_email' => ['required', 'email', 'max:150'],
            'contact_mobile' => ['required', 'regex:/^[6-9]\d{9}$/'],
            'address' => ['required', 'string', 'max:500'],
            'taluka' => ['nullable', 'string', 'max:80'],
            'district' => ['nullable', 'string', 'max:80'],
            'pincode' => ['nullable', 'regex:/^\d{6}$/'],
            'accepting_forms' => ['nullable', 'boolean'],
        ]);
        $data['accepting_forms'] = $request->boolean('accepting_forms');
        $institute->update($data);
        AuditLog::record('institute.profile', $institute);
        return back()->with('status', __('College details saved.'));
    }
}
