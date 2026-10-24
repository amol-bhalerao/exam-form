<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Page extends Model
{
    protected $fillable = [
        'title', 'slug', 'summary', 'body', 'layout', 'hero_image', 'seo_title', 'seo_description', 'seo_keywords',
        'noindex', 'status', 'in_header', 'in_footer', 'menu_order', 'parent_id', 'published_at', 'updated_by',
    ];

    protected $casts = [
        'noindex' => 'boolean',
        'in_header' => 'boolean',
        'in_footer' => 'boolean',
        'published_at' => 'datetime',
    ];

    public function parent(): BelongsTo
    {
        return $this->belongsTo(Page::class, 'parent_id');
    }

    public function children(): HasMany
    {
        return $this->hasMany(Page::class, 'parent_id')->orderBy('menu_order');
    }

    public function scopePublished(Builder $q): Builder
    {
        return $q->where('status', 'published')->where(fn ($w) => $w->whereNull('published_at')->orWhere('published_at', '<=', now()));
    }

    public function url(): string
    {
        return route('page.show', $this->slug);
    }
}
