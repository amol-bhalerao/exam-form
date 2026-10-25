<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Attempt extends Model
{
    public const LIVE = 'in_progress';

    protected $fillable = [
        'quiz_id', 'student_id', 'user_id', 'subject_id', 'mode', 'config', 'started_at', 'deadline_at', 'submitted_at',
        'last_seen_at', 'status', 'end_reason', 'warnings', 'score', 'max_score', 'correct', 'wrong', 'skipped', 'ai_feedback', 'ai_source',
    ];

    protected $casts = [
        'config' => 'array', 'started_at' => 'datetime', 'deadline_at' => 'datetime', 'submitted_at' => 'datetime',
        'last_seen_at' => 'datetime', 'score' => 'float', 'max_score' => 'float',
    ];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function answers(): HasMany
    {
        return $this->hasMany(AttemptAnswer::class)->orderBy('sort');
    }

    public function certificate(): HasOne
    {
        return $this->hasOne(Certificate::class);
    }

    public function isLive(): bool
    {
        return $this->status === self::LIVE;
    }

    public function percent(): int
    {
        return $this->max_score > 0 ? (int) round(max(0, $this->score) / $this->max_score * 100) : 0;
    }

    public function passed(): bool
    {
        return $this->percent() >= ($this->quiz?->pass_percent ?? 35);
    }

    public function secondsLeft(): ?int
    {
        return $this->deadline_at ? max(0, now()->diffInSeconds($this->deadline_at, false)) : null;
    }
}
