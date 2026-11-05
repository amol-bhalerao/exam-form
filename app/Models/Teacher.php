<?php

namespace App\Models;

use App\Support\Codes;
use App\Support\Retirement;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Teacher extends Model
{
    protected $fillable = [
        'institute_id', 'user_id', 'full_name', 'gender', 'category', 'dob', 'mobile', 'shalarth_id', 'email', 'qualification', 'subject_id',
        'second_subject_id', 'medium', 'teaches_classes', 'designation', 'approval_no', 'approval_date', 'retirement_age',
        'appointment_type', 'joined_on', 'experience_years', 'duty_roles', 'examiner_years', 'last_appointment_no',
        'available_for_duty', 'board_status', 'board_note', 'reviewed_by', 'reviewed_at', 'is_active',
    ];

    protected $casts = [
        'dob' => 'date',
        'joined_on' => 'date',
        'approval_date' => 'date',
        'duty_roles' => 'array',
        'available_for_duty' => 'boolean',
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function secondSubject(): BelongsTo
    {
        return $this->belongsTo(Subject::class, 'second_subject_id');
    }

    /** Date of retirement on superannuation (see App\Support\Retirement). */
    public function retirementDate(): ?\Illuminate\Support\Carbon
    {
        return Retirement::date($this->dob, $this->retirement_age);
    }

    public function age(): ?int
    {
        return $this->dob?->age;
    }

    /** Remaining service until retirement as text, or null when retired / unknown. */
    public function remainingService(): ?string
    {
        $date = $this->retirementDate();
        return $date ? Retirement::span(now(), $date) : null;
    }

    public function monthsToRetirement(): ?int
    {
        $date = $this->retirementDate();
        return $date ? (int) floor(now()->startOfDay()->diffInMonths($date, false)) : null;
    }

    public function isRetired(): bool
    {
        return (bool) $this->retirementDate()?->lt(now()->startOfDay());
    }

    /** Retires within the given number of months (and has not retired yet). */
    public function retiresWithin(int $months): bool
    {
        $date = $this->retirementDate();
        return $date && ! $this->isRetired() && $date->lte(now()->addMonths($months));
    }

    /** Years of service at this college (from the joining date). */
    public function serviceHere(): ?string
    {
        return $this->joined_on ? (Retirement::span($this->joined_on, now()) ?? '0') : null;
    }

    public function rolesLabel(): string
    {
        $roles = $this->duty_roles ?? [];
        return $roles ? implode(', ', array_map(fn ($r) => Codes::label(Codes::DUTY_ROLES, $r), $roles)) : '—';
    }

    public function isExaminer(): bool
    {
        return in_array('examiner', $this->duty_roles ?? [], true) || in_array('moderator', $this->duty_roles ?? [], true);
    }
}
