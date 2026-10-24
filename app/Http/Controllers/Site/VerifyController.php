<?php

namespace App\Http\Controllers\Site;

use App\Http\Controllers\Controller;
use App\Models\Application;
use Illuminate\Http\Request;

/** Public check for the QR code printed on every exam form. Shows only non-sensitive details. */
class VerifyController extends Controller
{
    public function form(Request $request)
    {
        if ($number = trim((string) $request->query('number'))) {
            return redirect()->route('verify.show', strtoupper($number));
        }
        return view('site.verify', ['application' => null, 'number' => null]);
    }

    public function show(string $number)
    {
        $application = Application::with(['student', 'institute', 'exam', 'board'])
            ->where('application_no', strtoupper($number))
            ->whereNotIn('status', [Application::DRAFT])
            ->first();

        return view('site.verify', ['application' => $application, 'number' => strtoupper($number)]);
    }
}
