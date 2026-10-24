<?php

namespace App\Models;

use App\Models\Concerns\Localized;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Stream extends Model
{
    use Localized;

    protected $fillable = ['board_id', 'code', 'name', 'name_mr', 'name_hi', 'gr_key', 'number', 'sort'];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function subjects(): BelongsToMany
    {
        return $this->belongsToMany(Subject::class);
    }
}
