<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Exam extends Model
{
    protected $fillable = [
        'board_id', 'code', 'name', 'session', 'year', 'academic_year', 'stream_id', 'candidate_types',
        'opens_at', 'closes_at', 'late_closes_at', 'exam_starts_on', 'exam_ends_on', 'instructions',
        'is_published', 'created_by',
    ];

    protected $casts = [
        'candidate_types' => 'array',
        'opens_at' => 'datetime',
        'closes_at' => 'datetime',
        'late_closes_at' => 'datetime',
        'exam_starts_on' => 'date',
        'exam_ends_on' => 'date',
        'is_published' => 'boolean',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function fees(): HasMany
    {
        return $this->hasMany(ExamFee::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    /** Exams accepting forms right now (including the late-fee window). */
    public function scopeOpen(Builder $q, ?Carbon $now = null): Builder
    {
        $now ??= now();
        return $q->where('is_published', true)
            ->where('opens_at', '<=', $now)
            ->where(fn ($w) => $w->where('closes_at', '>=', $now)->orWhere('late_closes_at', '>=', $now));
    }

    public function isOpen(?Carbon $now = null): bool
    {
        $now ??= now();
        if (! $this->is_published || $this->opens_at->gt($now)) {
            return false;
        }
        return $this->closes_at->gte($now) || ($this->late_closes_at && $this->late_closes_at->gte($now));
    }

    public function inLateWindow(?Carbon $now = null): bool
    {
        $now ??= now();
        return $this->closes_at->lt($now) && $this->late_closes_at && $this->late_closes_at->gte($now);
    }

    public function allowsCandidateType(string $type): bool
    {
        return in_array($type, $this->candidate_types ?? [], true);
    }

    /** Fee in rupees for a candidate type at a moment (adds late fee in the late window). */
    public function feeFor(string $candidateType, ?Carbon $now = null): array
    {
        $fee = $this->fees->firstWhere('candidate_type', $candidateType);
        $base = $fee?->fee ?? 0;
        $late = $this->inLateWindow($now) ? ($fee?->late_fee ?? 0) : 0;
        return ['base' => $base, 'late' => $late, 'total' => $base + $late];
    }

    public function appliesToStream(?int $streamId): bool
    {
        return $this->stream_id === null || $this->stream_id === $streamId;
    }
}
