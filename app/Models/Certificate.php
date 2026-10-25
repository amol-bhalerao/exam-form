<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Certificate extends Model
{
    public const TEMPLATES = [
        'paithani' => 'Paithani — peacock and gold border',
        'classic' => 'Classic — formal double border',
        'merit' => 'Merit — gold seal and ribbon',
        'modern' => 'Modern — clean with colour band',
    ];

    protected $fillable = ['serial', 'quiz_id', 'attempt_id', 'student_id', 'template', 'issued_by'];

    public function quiz(): BelongsTo
    {
        return $this->belongsTo(Quiz::class);
    }

    public function attempt(): BelongsTo
    {
        return $this->belongsTo(Attempt::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }
}
