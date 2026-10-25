<?php

namespace App\Models;

use App\Models\Concerns\Localized;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** A divisional board office (Pune, Mumbai, Chh. Sambhajinagar …) that colleges and schools report to. */
class Division extends Model
{
    use Localized;

    protected $fillable = ['code', 'name', 'name_mr', 'name_hi', 'short_name', 'address', 'email', 'phone', 'website', 'is_active', 'sort'];

    protected $casts = ['is_active' => 'boolean'];

    public function institutes(): HasMany
    {
        return $this->hasMany(Institute::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public static function options(): array
    {
        return static::orderBy('sort')->orderBy('code')->get()->mapWithKeys(fn ($d) => [$d->id => $d->code . ' · ' . $d->label])->all();
    }
}
