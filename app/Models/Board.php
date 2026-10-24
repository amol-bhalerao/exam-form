<?php

namespace App\Models;

use App\Models\Concerns\Localized;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Board extends Model
{
    use Localized;

    protected $fillable = ['code', 'name', 'name_mr', 'name_hi', 'short_name', 'has_streams', 'sort'];

    protected $casts = ['has_streams' => 'boolean'];

    public function institutes(): HasMany
    {
        return $this->hasMany(Institute::class);
    }

    public function streams(): HasMany
    {
        return $this->hasMany(Stream::class)->orderBy('sort');
    }

    public function subjects(): HasMany
    {
        return $this->hasMany(Subject::class)->orderBy('sort');
    }

    public function exams(): HasMany
    {
        return $this->hasMany(Exam::class);
    }
}
