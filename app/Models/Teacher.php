<?php

namespace App\Models;

use App\Support\Codes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Teacher extends Model
{
    protected $fillable = [
        'institute_id', 'full_name', 'gender', 'dob', 'mobile', 'email', 'qualification', 'subject_id', 'designation',
        'appointment_type', 'joined_on', 'experience_years', 'duty_roles', 'examiner_years', 'last_appointment_no',
        'available_for_duty', 'board_status', 'board_note', 'reviewed_by', 'reviewed_at', 'is_active',
    ];

    protected $casts = [
        'dob' => 'date',
        'joined_on' => 'date',
        'duty_roles' => 'array',
        'available_for_duty' => 'boolean',
        'is_active' => 'boolean',
        'reviewed_at' => 'datetime',
    ];

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
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
