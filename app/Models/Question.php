<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Question extends Model
{
    public const TYPES = [
        'single' => 'Multiple choice (one answer)',
        'multi' => 'Multiple select (more than one answer)',
        'true_false' => 'True or false',
        'fill_blank' => 'Fill in the blank',
    ];
    public const LEVELS = ['easy' => 'Easy', 'medium' => 'Moderate', 'hard' => 'Hard'];

    /** How many wrong choices are shown with the correct one (extra wrong choices rotate each time). */
    public const SHOWN_WRONG = 3;

    protected $fillable = [
        'subject_id', 'topic_id', 'type', 'text', 'explanation', 'difficulty', 'status', 'source',
        'created_by', 'institute_id', 'reviewed_by', 'reviewed_at', 'review_note',
    ];

    protected $casts = ['reviewed_at' => 'datetime'];

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function topic(): BelongsTo
    {
        return $this->belongsTo(Topic::class);
    }

    public function options(): HasMany
    {
        return $this->hasMany(QuestionOption::class)->orderBy('sort');
    }

    public function tips(): HasMany
    {
        return $this->hasMany(MemoryTip::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function scopeApproved(Builder $q): Builder
    {
        return $q->where('status', 'approved');
    }

    public function getTypeLabelAttribute(): string
    {
        return __(self::TYPES[$this->type] ?? $this->type);
    }

    /**
     * Option ids to show for one sitting: every correct option plus a fresh random set of wrong
     * ones, shuffled. True/false keeps its fixed order; fill-in-the-blank shows no options.
     */
    public function pickOptions(): array
    {
        $options = $this->options;
        if ($this->type === 'fill_blank') {
            return [];
        }
        if ($this->type === 'true_false') {
            return $options->pluck('id')->all();
        }
        $correct = $options->where('is_correct', true);
        $wrong = $options->where('is_correct', false)->shuffle();
        $take = $this->type === 'multi' ? max(2, 5 - $correct->count()) : self::SHOWN_WRONG;
        return $correct->concat($wrong->take($take))->shuffle()->pluck('id')->values()->all();
    }

    /** Is the given answer right? $answer holds option ids, or one typed string for fill-in-the-blank. */
    public function check(array $answer): ?bool
    {
        $answer = array_values(array_filter($answer, fn ($v) => $v !== null && $v !== ''));
        if ($answer === []) {
            return null;
        }
        if ($this->type === 'fill_blank') {
            $typed = self::normalise((string) $answer[0]);
            return $this->options->where('is_correct', true)->contains(fn ($o) => self::normalise($o->text) === $typed);
        }
        $correct = $this->options->where('is_correct', true)->pluck('id')->map(fn ($i) => (int) $i)->sort()->values()->all();
        $given = collect($answer)->map(fn ($i) => (int) $i)->unique()->sort()->values()->all();
        return $correct === $given;
    }

    public static function normalise(string $text): string
    {
        $text = mb_strtolower(trim(preg_replace('/\s+/u', ' ', $text)));
        return trim($text, " .,'\"");
    }

    /** The correct answer as text, for review screens. */
    public function answerText(): string
    {
        return $this->options->where('is_correct', true)->pluck('text')->implode($this->type === 'fill_blank' ? ' / ' : ', ');
    }
}
