<?php

namespace App\Services;

use App\Models\Application;
use App\Models\ApplicationEvent;
use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

/**
 * Exam form life cycle:
 *
 *   draft ──pay──▶ submitted ──institute verifies──▶ verified ──board approves──▶ approved
 *     ▲               │  ▲                              │
 *     └── returned ◀──┘  └──── board_returned ◀─────────┘ (board sends back to institute)
 *                                   verified ──board rejects──▶ rejected
 *
 * Every change is written to application_events (shown as the form's timeline).
 */
class ApplicationWorkflow
{
    /** action => [allowed from statuses, to status, roles] */
    public const ACTIONS = [
        'submit'          => [[Application::DRAFT, Application::RETURNED], Application::SUBMITTED, [User::STUDENT]],
        'return'          => [[Application::SUBMITTED, Application::BOARD_RETURNED], Application::RETURNED, [User::INSTITUTE]],
        'verify'          => [[Application::SUBMITTED, Application::BOARD_RETURNED], Application::VERIFIED, [User::INSTITUTE]],
        'board_return'    => [[Application::VERIFIED], Application::BOARD_RETURNED, [User::BOARD]],
        'approve'         => [[Application::VERIFIED], Application::APPROVED, [User::BOARD]],
        'reject'          => [[Application::VERIFIED], Application::REJECTED, [User::BOARD]],
        'reopen'          => [[Application::APPROVED, Application::REJECTED], Application::VERIFIED, [User::BOARD]],
    ];

    public function can(Application $application, string $action, ?User $user = null): bool
    {
        [$from, , $roles] = self::ACTIONS[$action] ?? [[], null, []];
        return in_array($application->status, $from, true) && (! $user || in_array($user->role, $roles, true));
    }

    public function apply(Application $application, string $action, ?User $user = null, ?string $note = null): Application
    {
        if (! isset(self::ACTIONS[$action])) {
            throw new InvalidArgumentException("Unknown action {$action}");
        }
        if (! $this->can($application, $action, $user)) {
            throw new InvalidArgumentException(__('This form cannot be changed that way in its current state.'));
        }
        [, $to] = self::ACTIONS[$action];

        return DB::transaction(function () use ($application, $action, $user, $note, $to) {
            $from = $application->status;
            $application->status = $to;

            match ($action) {
                'submit' => $this->onSubmit($application),
                'verify' => $this->onVerify($application, $note),
                'return' => $application->institute_note = $note,
                'board_return', 'reject' => [$application->board_note = $note, $application->decided_at = now()],
                'approve' => $this->onApprove($application, $note),
                'reopen' => $application->decided_at = null,
            };

            $application->save();

            ApplicationEvent::create([
                'application_id' => $application->id,
                'user_id' => $user?->id,
                'action' => $action,
                'from_status' => $from,
                'to_status' => $to,
                'note' => $note,
            ]);
            AuditLog::record("application.$action", $application, array_filter(['note' => $note]));

            return $application;
        });
    }

    /** Record a change made by the institute or board to the form's contents. */
    public function logEdit(Application $application, ?User $user, array $changes, ?string $note = null): void
    {
        if ($changes === []) {
            return;
        }
        ApplicationEvent::create([
            'application_id' => $application->id,
            'user_id' => $user?->id,
            'action' => 'corrected',
            'from_status' => $application->status,
            'to_status' => $application->status,
            'note' => $note,
            'changes' => $changes,
        ]);
    }

    private function onSubmit(Application $application): void
    {
        $application->submitted_at = now();
        $application->institute_note = null;
        $application->snapshot = $this->snapshot($application);
    }

    private function onVerify(Application $application, ?string $note): void
    {
        $application->verified_at = now();
        $application->institute_note = $note;
        $application->board_note = null;
        $application->snapshot = $this->snapshot($application);
        if (! $application->institute_seq) {
            $institute = $application->institute;
            $count = Application::where('institute_id', $institute->id)->where('exam_id', $application->exam_id)
                ->whereNotNull('institute_seq')->count() + 1;
            $application->institute_seq = sprintf('%s-%s-%04d', $institute->college_no, $application->exam->code, $count);
        }
    }

    private function onApprove(Application $application, ?string $note): void
    {
        $application->decided_at = now();
        $application->board_note = $note;
        if (! $application->board_seq) {
            $stream = $application->stream?->code ?? $application->board->code;
            $count = Application::where('exam_id', $application->exam_id)->whereNotNull('board_seq')->count() + 1;
            $application->board_seq = sprintf('%s-%s-%06d', $stream, $application->exam->code, $count);
        }
    }

    /** Freeze the student and institute details as they were when the form moved on. */
    public function snapshot(Application $application): array
    {
        $application->loadMissing('student.previousExams', 'institute', 'stream', 'subjects.subject');
        $s = $application->student;
        return [
            'student' => collect($s->toArray())->except(['aadhaar', 'owner_id', 'created_at', 'updated_at', 'previous_exams'])->all()
                + ['full_name' => $s->full_name, 'masked_aadhaar' => $s->masked_aadhaar],
            'previous_exams' => $s->previousExams->map->only(['exam', 'seat_no', 'month', 'year', 'percentage', 'board_or_college'])->all(),
            'institute' => $application->institute->only(['id', 'college_no', 'udise_no', 'name', 'district', 'address']),
            'subjects' => $application->subjects->map(fn ($row) => [
                'code' => $row->subject->code, 'name' => $row->subject->name, 'kind' => $row->subject->kind,
                'answer_language' => $row->answer_language, 'is_exempted' => $row->is_exempted,
            ])->all(),
            'taken_at' => now()->toIso8601String(),
        ];
    }
}
