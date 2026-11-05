<?php

namespace App\Support;

use App\Models\Setting;
use Illuminate\Support\Carbon;

/**
 * Retirement on superannuation for teachers of private aided schools / junior colleges in Maharashtra:
 * age 58 (MEPS Rules, 1981, rule 17; Maharashtra Civil Services (Pension) Rules, 1982, rule 10).
 * The teacher retires on the afternoon of the LAST DAY OF THE MONTH in which they reach that age;
 * a teacher born on the 1st of a month retires on the last day of the PREVIOUS month.
 * The age can be changed in Site settings (and per teacher, e.g. 60 where a different rule applies).
 */
final class Retirement
{
    public const DEFAULT_AGE = 58;

    public static function age(): int
    {
        $age = (int) Setting::get('teacher_retirement_age', self::DEFAULT_AGE);
        return $age >= 50 && $age <= 70 ? $age : self::DEFAULT_AGE;
    }

    public static function date(?Carbon $dob, ?int $age = null): ?Carbon
    {
        if (! $dob) {
            return null;
        }
        $reached = $dob->copy()->startOfDay()->addYearsNoOverflow($age ?: self::age());
        return $dob->day === 1 ? $reached->subMonthNoOverflow()->endOfMonth()->startOfDay() : $reached->endOfMonth()->startOfDay();
    }

    /** "3 y 7 m" style text of the time between two dates (or null when already past). */
    public static function span(Carbon $from, Carbon $to): ?string
    {
        if ($to->lt($from)) {
            return null;
        }
        $d = $from->copy()->startOfDay()->diff($to->copy()->startOfDay());
        $parts = [];
        if ($d->y) {
            $parts[] = trans_choice(':count year|:count years', $d->y, ['count' => $d->y]);
        }
        if ($d->m) {
            $parts[] = trans_choice(':count month|:count months', $d->m, ['count' => $d->m]);
        }
        if (! $d->y && ! $d->m) {
            $parts[] = trans_choice(':count day|:count days', $d->d, ['count' => $d->d]);
        }
        return implode(' ', $parts);
    }
}
