<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\User;
use Illuminate\Http\Request;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

/** Printable A4 exam form, fee receipt and bulk printing for institutes / board. */
class PrintController extends Controller
{
    private const RELATIONS = ['exam', 'student.previousExams', 'institute', 'stream', 'board', 'subjects.subject', 'payments'];

    public function form(Request $request, Application $application)
    {
        abort_unless($application->isVisibleTo($request->user()), 404);
        abort_unless($application->printable() || $request->user()->role !== User::STUDENT, 403, __('The form can be printed after the fee is paid.'));
        $application->load(self::RELATIONS);
        return view('print.forms', ['applications' => collect([$application]), 'qr' => [$application->id => $this->qr($application)]]);
    }

    public function receipt(Request $request, Application $application)
    {
        abort_unless($application->isVisibleTo($request->user()), 404);
        abort_unless($application->isPaid(), 403, __('No fee has been paid for this form yet.'));
        $application->load(self::RELATIONS);
        $payment = $application->payments->firstWhere('status', 'paid');
        return view('print.receipt', ['application' => $application, 'payment' => $payment]);
    }

    public function bulk(Request $request)
    {
        $user = $request->user();
        abort_unless($user->isRole(User::INSTITUTE, User::BOARD, User::SUPER_ADMIN), 403);
        $ids = collect(explode(',', (string) $request->query('ids')))->map(fn ($v) => (int) $v)->filter()->take(200);
        abort_if($ids->isEmpty(), 404);

        $applications = Application::visibleTo($user)->whereIn('id', $ids)->with(self::RELATIONS)->orderBy('application_no')->get();
        abort_if($applications->isEmpty(), 404);

        return view('print.forms', [
            'applications' => $applications,
            'qr' => $applications->mapWithKeys(fn ($a) => [$a->id => $this->qr($a)])->all(),
        ]);
    }

    private function qr(Application $application): string
    {
        return (string) QrCode::format('svg')->size(110)->margin(0)->errorCorrection('M')
            ->generate(route('verify.show', $application->application_no));
    }
}
