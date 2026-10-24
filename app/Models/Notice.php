<?php

namespace App\Models;

use App\Support\Codes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Notice extends Model
{
    protected $fillable = [
        'board_id', 'title', 'slug', 'category', 'body', 'attachment_path', 'link_url', 'is_pinned', 'in_ticker',
        'published_at', 'expires_at', 'status', 'created_by',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'in_ticker' => 'boolean',
        'published_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function board(): BelongsTo
    {
        return $this->belongsTo(Board::class);
    }

    public function scopeLive(Builder $q): Builder
    {
        return $q->where('status', 'published')
            ->where(fn ($w) => $w->whereNull('published_at')->orWhere('published_at', '<=', now()))
            ->where(fn ($w) => $w->whereNull('expires_at')->orWhere('expires_at', '>', now()));
    }

    public function getCategoryLabelAttribute(): string
    {
        return Codes::label(Codes::NOTICE_CATEGORIES, $this->category);
    }

    public function attachmentUrl(): ?string
    {
        return $this->attachment_path ? Storage::disk('public')->url($this->attachment_path) : null;
    }
}
