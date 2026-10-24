<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InstituteSubject extends Model
{
    protected $fillable = ['institute_id', 'stream_id', 'subject_id', 'answer_language'];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function stream(): BelongsTo
    {
        return $this->belongsTo(Stream::class);
    }
}
