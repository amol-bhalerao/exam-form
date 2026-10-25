<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MemoryTip extends Model
{
    protected $fillable = ['question_id', 'topic_id', 'text', 'user_id', 'student_id', 'institute_id', 'status', 'likes', 'reviewed_by'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function scopeApproved(Builder $q): Builder
    {
        return $q->where('status', 'approved');
    }

    public function authorName(): string
    {
        return $this->student?->first_name ? ucfirst(mb_strtolower($this->student->first_name)) : ($this->user?->name ?? __('Teacher'));
    }
}
