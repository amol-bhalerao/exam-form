<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttemptAnswer extends Model
{
    public $timestamps = false;
    protected $fillable = ['attempt_id', 'question_id', 'sort', 'shown_options', 'answer', 'is_correct', 'marks', 'seconds'];
    protected $casts = ['shown_options' => 'array', 'answer' => 'array', 'is_correct' => 'boolean', 'marks' => 'float'];

    public function question(): BelongsTo
    {
        return $this->belongsTo(Question::class);
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(Attempt::class);
    }
}
