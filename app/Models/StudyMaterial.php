<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class StudyMaterial extends Model
{
    protected $fillable = [
        'subject_id', 'topic_id', 'title', 'description', 'body', 'file_path', 'file_name', 'link_url',
        'uploaded_by', 'student_id', 'institute_id', 'status', 'reviewed_by', 'review_note', 'views',
    ];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function scopeApproved(Builder $q): Builder
    {
        return $q->where('status', 'approved');
    }

    public function fileUrl(): ?string
    {
        return $this->file_path ? Storage::disk('public')->url($this->file_path) : null;
    }

    public function authorName(): string
    {
        return $this->student ? $this->student->full_name : ($this->uploader?->name ?? '');
    }
}
