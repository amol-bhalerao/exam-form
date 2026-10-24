<?php

namespace App\Models\Concerns;

/**
 * Models with name / name_mr / name_hi columns: `$model->label` picks the current locale.
 */
trait Localized
{
    public function getLabelAttribute(): string
    {
        $locale = app()->getLocale();
        if ($locale !== 'en') {
            $value = $this->getAttribute('name_' . $locale);
            if (filled($value)) {
                return $value;
            }
        }
        return (string) $this->getAttribute('name');
    }
}
