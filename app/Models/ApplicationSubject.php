<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationSubject extends Model
{
    public $timestamps = false;

    protected $fillable = ['application_id', 'subject_id', 'answer_language', 'is_exempted', 'sort'];

    protected $casts = ['is_exempted' => 'boolean'];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }
}
