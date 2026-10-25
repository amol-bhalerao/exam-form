<?php

namespace App\Http\Controllers\Board;

use App\Http\Controllers\Controller;
use App\Models\Application;
use App\Models\Exam;
use App\Services\ApplicationWorkflow;
use App\Support\FormQuery;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use InvalidArgumentException;

/** The board reviews forms that colleges have verified: approve, send back to the college, or reject. */
class FormController extends Controller
{
    /** Statuses the board works with. Forms still with the student or college are counted, not listed. */
    public const STATUSES = [Application::VERIFIED, Application::BOARD_RETURNED, Application::APPROVED, Application::REJECTED];

    public function __construct(private ApplicationWorkflow $workflow) {}

    private function base(Request $request)
    {
        return Application::forOfficer($request->user());
    }

    public function index(Request $request)
    {
        $query = FormQuery::apply($this->base($request)->whereIn('status', self::STATUSES), $request);
        if (! $request->filled('status') && ! $request->filled('q')) {
            $query->orderByRaw("CASE status WHEN 'verified' THEN 0 WHEN 'board_returned' THEN 1 ELSE 2 END");
        }
        $board = $request->user()->board;

        return view('board.forms.index', [
            'forms' => $query->with('student', 'exam', 'stream', 'institute')->latest('verified_at')->paginate(30)->withQueryString(),
            'counts' => FormQuery::statusCounts($this->base($request)),
            'exams' => Exam::where('board_id', $board->id)->forDivision($request->user()->division_id)->latest('opens_at')->get(['id', 'name']),
            'streams' => $board->streams()->orderBy('sort')->get(),
            'districts' => \App\Models\Institute::forOfficer($request->user())->whereNotNull('district')->distinct()->orderBy('district')->pluck('district'),
            'institute' => $request->filled('institute') ? \App\Models\Institute::forOfficer($request->user())->find($request->integer('institute')) : null,
        ]);
    }

    public function export(Request $request)
    {
        $q = FormQuery::apply($this->base($request)->whereIn('status', self::STATUSES), $request);
        return FormQuery::export($q, 'board-exam-forms-' . now()->format('Ymd-His') . '.csv');
    }

    public function show(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        $application->load('exam', 'student.previousExams', 'institute', 'stream', 'subjects.subject', 'events.user', 'payments');
        return view('board.forms.show', ['application' => $application, 'workflow' => $this->workflow]);
    }

    public function decide(Request $request, Application $application)
    {
        $this->authorizeForm($request, $application);
        $data = $request->validate([
            'action' => ['required', Rule::in(['approve', 'board_return', 'reject', 'reopen'])],
            'note' => [in_array($request->input('action'), ['board_return', 'reject'], true) ? 'required' : 'nullable', 'string', 'max:500'],
        ], ['note.required' => __('Write the reason so the college knows what to do.')]);

        try {
            $this->workflow->apply($application, $data['action'], $request->user(), $data['note'] ?? null);
        } catch (InvalidArgumentException $e) {
            return back()->with('warning', $e->getMessage());
        }
        $msg = [
            'approve' => __('Form :no approved.', ['no' => $application->application_no]),
            'board_return' => __('Form :no sent back to the college.', ['no' => $application->application_no]),
            'reject' => __('Form :no rejected.', ['no' => $application->application_no]),
            'reopen' => __('Form :no is open for review again.', ['no' => $application->application_no]),
        ][$data['action']];

        $next = $request->boolean('next') && $data['action'] !== 'reopen'
            ? $this->base($request)->where('status', Application::VERIFIED)->where('id', '!=', $application->id)->oldest('verified_at')->first()
            : null;
        return ($next ? redirect()->route('board.forms.show', $next) : redirect()->route('board.forms.show', $application))->with('status', $msg);
    }

    public function bulk(Request $request)
    {
        $data = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer'],
            'action' => ['required', Rule::in(['approve', 'print'])],
        ], ['ids.required' => __('Select at least one form.')]);

        $forms = $this->base($request)->whereIn('id', $data['ids'])->get();
        if ($data['action'] === 'print') {
            return redirect()->route('forms.print.bulk', ['ids' => $forms->pluck('id')->implode(',')]);
        }
        $done = 0;
        $skipped = 0;
        foreach ($forms as $form) {
            if ($this->workflow->can($form, 'approve', $request->user())) {
                $this->workflow->apply($form, 'approve', $request->user());
                $done++;
            } else {
                $skipped++;
            }
        }
        return back()->with('status', trans_choice(':count form approved.|:count forms approved.', $done, ['count' => $done]))
            ->with('warning', $skipped ? trans_choice(':count selected form was not waiting for approval and was skipped.|:count selected forms were not waiting for approval and were skipped.', $skipped, ['count' => $skipped]) : null);
    }

    private function authorizeForm(Request $request, Application $application): void
    {
        abort_unless(Application::forOfficer($request->user())->whereKey($application->id)->exists() && $application->status !== Application::DRAFT, 404);
    }
}
