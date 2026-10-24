<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Institute extends Model
{
    protected $fillable = [
        'board_id', 'college_no', 'udise_no', 'name', 'district', 'taluka', 'address', 'pincode',
        'principal_name', 'contact_email', 'contact_mobile', 'is_active', 'accepting_forms',
    ];

    protected $casts = ['is_active' => 'boolean', 'accepting_forms' => 'boolean'];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function streams(): BelongsToMany
    {
        return $this->belongsToMany(Stream::class);
    }

    public function offeredSubjects(): HasMany
    {
        return $this->hasMany(InstituteSubject::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function teachers(): HasMany
    {
        return $this->hasMany(Teacher::class);
    }

    public function applications(): HasMany
    {
        return $this->hasMany(Application::class);
    }

    public function scopeSearch(Builder $q, ?string $term): Builder
    {
        if (! filled($term)) {
            return $q;
        }
        $term = trim($term);
        return $q->where(fn ($w) => $w->where('name', 'like', "%{$term}%")
            ->orWhere('college_no', 'like', "{$term}%")
            ->orWhere('udise_no', 'like', "{$term}%")
            ->orWhere('district', 'like', "{$term}%"));
    }

    public function getDisplayNameAttribute(): string
    {
        return "{$this->name} ({$this->college_no})";
    }
}
