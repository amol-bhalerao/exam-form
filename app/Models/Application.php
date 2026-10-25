<?php

namespace App\Models;

use App\Support\Codes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Application extends Model
{
    public const DRAFT = 'draft';
    public const SUBMITTED = 'submitted';         // paid, waiting for the institute
    public const RETURNED = 'returned';           // institute sent it back to the student for correction
    public const VERIFIED = 'verified';           // institute verified and forwarded to the board
    public const BOARD_RETURNED = 'board_returned'; // board sent it back to the institute
    public const APPROVED = 'approved';
    public const REJECTED = 'rejected';

    protected $fillable = [
        'application_no', 'exam_id', 'student_id', 'institute_id', 'board_id', 'stream_id', 'created_by',
        'candidate_type', 'exemption_status', 'exemptions_claimed', 'subject_group', 'is_foreigner',
        'enrolment_cert_no', 'last_exam_month', 'last_exam_year', 'last_exam_seat_no', 'status', 'fee_amount',
        'late_fee_applied', 'paid_at', 'submitted_at', 'verified_at', 'decided_at', 'institute_note', 'board_note',
        'institute_seq', 'board_seq', 'centre_no', 'index_no', 'snapshot',
    ];

    protected $casts = [
        'is_foreigner' => 'boolean',
        'late_fee_applied' => 'boolean',
        'paid_at' => 'datetime',
        'submitted_at' => 'datetime',
        'verified_at' => 'datetime',
        'decided_at' => 'datetime',
        'snapshot' => 'array',
    ];

    public function exam(): BelongsTo
    {
        return $this->belongsTo(Exam::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(ApplicationSubject::class)->orderBy('sort');
    }

    public function events(): HasMany
    {
        return $this->hasMany(ApplicationEvent::class)->latest('id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class)->latest('id');
    }

    /** Whether a user may open this form (owner, its institute, its board, or super admin). */
    public function isVisibleTo(?User $user): bool
    {
        return match ($user?->role) {
            User::SUPER_ADMIN => true,
            User::BOARD => $user->board_id === $this->board_id,
            User::INSTITUTE => $user->institute_id === $this->institute_id,
            User::STUDENT => $this->student?->owner_id === $user->id,
            default => false,
        };
    }

    /** Forms a staff user may list. */
    public function scopeVisibleTo(Builder $q, User $user): Builder
    {
        return match ($user->role) {
            User::SUPER_ADMIN => $q,
            User::BOARD => $q->where('board_id', $user->board_id),
            User::INSTITUTE => $q->where('institute_id', $user->institute_id),
            default => $q->whereHas('student', fn ($w) => $w->where('owner_id', $user->id)),
        };
    }

    public function scopeForBoard(Builder $q, int $boardId): Builder
    {
        return $q->where('board_id', $boardId);
    }

    public function getStatusLabelAttribute(): string
    {
        return Codes::label(Codes::STATUSES, $this->status);
    }

    public function getCandidateTypeLabelAttribute(): string
    {
        return Codes::label(Codes::CANDIDATE_TYPES, $this->candidate_type);
    }

    public function isPaid(): bool
    {
        return $this->paid_at !== null;
    }

    /** The student (account owner) can change the form. */
    public function editableByStudent(): bool
    {
        return in_array($this->status, [self::DRAFT, self::RETURNED], true);
    }

    /** The institute can correct the form. */
    public function editableByInstitute(): bool
    {
        return in_array($this->status, [self::SUBMITTED, self::RETURNED, self::BOARD_RETURNED], true);
    }

    public function printable(): bool
    {
        return in_array($this->status, [self::SUBMITTED, self::VERIFIED, self::APPROVED, self::BOARD_RETURNED], true);
    }

    /** Tone used for status badges. */
    public function statusTone(): string
    {
        return match ($this->status) {
            self::APPROVED => 'ok',
            self::VERIFIED => 'info',
            self::SUBMITTED => 'pending',
            self::RETURNED, self::BOARD_RETURNED => 'warn',
            self::REJECTED => 'bad',
            default => 'muted',
        };
    }

    public static function nextNumber(Board $board): string
    {
        // e.g. HSC27-000123  (board, exam year, running number)
        $prefix = $board->code . now()->format('y') . '-';
        $last = static::where('application_no', 'like', $prefix . '%')->max('application_no');
        $n = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;
        return $prefix . str_pad((string) $n, 6, '0', STR_PAD_LEFT);
    }

    /** Forms a board officer may see: their exam board and (if set) their division. */
    public function scopeForOfficer($q, User $user)
    {
        return $q->where('applications.board_id', $user->board_id)
            ->when($user->division_id, fn ($w, $d) => $w->whereIn('applications.institute_id', Institute::where('division_id', $d)->select('id')));
    }
}
