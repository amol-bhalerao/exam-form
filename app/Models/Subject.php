<?php

namespace App\Models;

use App\Models\Concerns\Localized;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Subject extends Model
{
    use Localized;

    public const KINDS = [
        'COMPULSORY' => 'Compulsory', 'MIL' => 'Modern Indian language', 'MFL' => 'Modern foreign language',
        'CLASSICAL' => 'Classical language', 'IT' => 'Information technology', 'ELECTIVE' => 'Elective',
        'BIFOCAL' => 'Bifocal', 'VOCATIONAL' => 'Vocational (MCVC)', 'FOUNDATION' => 'Foundation course',
        'LANGUAGE' => 'Language', 'CORE' => 'Core subject',
    ];

    protected $fillable = [
        'board_id', 'code', 'name', 'name_mr', 'name_hi', 'kind', 'theory_marks', 'internal_marks',
        'papers', 'graded', 'is_active', 'sort',
    ];

    protected $casts = ['graded' => 'boolean', 'is_active' => 'boolean'];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function streams(): BelongsToMany
    {
        return $this->belongsToMany(Stream::class);
    }

    public function topics(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Topic::class)->orderBy('sort');
    }

    public function questions(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Question::class);
    }

    public function isCompulsory(): bool
    {
        return $this->kind === 'COMPULSORY';
    }

    public function getKindLabelAttribute(): string
    {
        return __(self::KINDS[$this->kind] ?? $this->kind);
    }
}
