<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A test scheduled by a teacher for the students of their college. */
class Quiz extends Model
{
    protected $fillable = [
        'title', 'instructions', 'subject_id', 'institute_id', 'stream_id', 'created_by', 'topic_ids', 'types', 'difficulty',
        'question_count', 'fixed_questions', 'duration_minutes', 'starts_at', 'ends_at', 'marks_per_question', 'negative_marks',
        'pass_percent', 'max_warnings', 'show_answers_after', 'certificate_template', 'status',
    ];

    protected $casts = [
        'topic_ids' => 'array', 'types' => 'array', 'fixed_questions' => 'boolean', 'show_answers_after' => 'boolean',
        'starts_at' => 'datetime', 'ends_at' => 'datetime', 'marks_per_question' => 'float', 'negative_marks' => 'float',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }

    public function institute(): BelongsTo
    {
        return $this->belongsTo(Institute::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function questions(): BelongsToMany
    {
        return $this->belongsToMany(Question::class, 'quiz_questions')->withPivot('sort')->orderByPivot('sort');
    }

    public function attempts(): HasMany
    {
        return $this->hasMany(Attempt::class);
    }

    public function certificates(): HasMany
    {
        return $this->hasMany(Certificate::class);
    }

    public function state(): string
    {
        if ($this->status !== 'published') {
            return 'draft';
        }
        if (now()->lt($this->starts_at)) {
            return 'upcoming';
        }
        return now()->lte($this->ends_at) ? 'live' : 'ended';
    }

    public function isFor(Student $student): bool
    {
        return $this->status === 'published' && $student->institute_id === $this->institute_id
            && ($this->stream_id === null || $this->stream_id === $student->stream_id);
    }
}
