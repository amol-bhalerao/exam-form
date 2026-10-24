<?php

namespace App\Services;

/**
 * HSC (Std XI–XII) subject scheme — Government of Maharashtra GR
 * संकीर्ण २०१९/प्र.क.(२४३/१९)/एसडी-४ dated 08-08-2019, Annexure A/B/C.
 *
 * Validates a selection of board subject codes for a stream:
 *  - all Group A compulsory subjects (English 1, EVS & Jal Suraksha 31, HPE 30)
 *  - exactly one Group A choice (language / IT / Bifocal Paper I)
 *  - at least 3 Group B subjects and exactly 4 in Group B + C
 *  - 8 subjects (papers) in total; Bifocal counts 2, vocational 3
 *  - Vocational (MCVC): language + foundation course + one vocational subject
 */
class SubjectRules
{
    private array $catalogue;
    private array $scheme;
    private array $compulsory;
    private string $foundation;
    private string $biology;
    public string $reference;

    public function __construct()
    {
        $data = json_decode(file_get_contents(database_path('data/gr_scheme.json')), true);
        $this->catalogue = collect($data['catalogue'])->keyBy('code')->all();
        $this->scheme = $data['scheme'];
        $this->compulsory = $data['compulsory'];
        $this->foundation = $data['foundation'];
        $this->biology = $data['biology'];
        $this->reference = $data['reference'];
    }

    public function covers(?string $grKey): bool
    {
        return $grKey !== null && isset($this->scheme[$grKey]);
    }

    public function compulsoryCodes(): array
    {
        return $this->compulsory;
    }

    public function papers(string $code): int
    {
        return match ($this->catalogue[$code]['kind'] ?? null) {
            'BIFOCAL' => 2,
            'VOCATIONAL' => 3,
            default => 1,
        };
    }

    /** Groups a code can be counted in for a stream. */
    public function groupsFor(string $grKey, string $code): array
    {
        $s = $this->scheme[$grKey] ?? null;
        if (! $s) {
            return [];
        }
        if (in_array($code, $this->compulsory, true)) {
            return ['A'];
        }
        $groups = [];
        foreach (['groupAChoice' => 'A_CHOICE', 'groupB' => 'B', 'groupC' => 'C', 'optional' => 'OPTIONAL'] as $key => $g) {
            if (in_array($code, $s[$key] ?? [], true)) {
                $groups[] = $g;
            }
        }
        if (($s['foundation'] ?? null) === $code) {
            $groups[] = 'FOUNDATION';
        }
        return $groups;
    }

    /**
     * Group layout for the guided subject picker.
     * @return array<int, array{key:string,label:string,min:int,max:int,codes:array}>
     */
    public function layout(string $grKey): array
    {
        $s = $this->scheme[$grKey];
        $groups = [['key' => 'A', 'label' => __('Group A — compulsory'), 'min' => 3, 'max' => 3, 'codes' => $this->compulsory]];
        if ($grKey === 'VOCATIONAL') {
            $groups[] = ['key' => 'A_CHOICE', 'label' => __('Group A — one language'), 'min' => 1, 'max' => 1, 'codes' => $s['groupAChoice']];
            $groups[] = ['key' => 'FOUNDATION', 'label' => __('Foundation course (MCVC)'), 'min' => 1, 'max' => 1, 'codes' => [$s['foundation']]];
            $groups[] = ['key' => 'OPTIONAL', 'label' => __('Vocational subject (3 papers)'), 'min' => 1, 'max' => 1, 'codes' => $s['optional']];
        } else {
            $groups[] = ['key' => 'A_CHOICE', 'label' => __('Group A — one language, IT or Bifocal Paper I'), 'min' => 1, 'max' => 1, 'codes' => $s['groupAChoice']];
            $groups[] = ['key' => 'B', 'label' => __('Group B — at least 3'), 'min' => 3, 'max' => 4, 'codes' => $s['groupB']];
            $groups[] = ['key' => 'C', 'label' => __('Group C — up to 1'), 'min' => 0, 'max' => 1, 'codes' => $s['groupC']];
        }
        return $groups;
    }

    /**
     * @param array<int,string> $codes selected board subject codes
     * @param array<string,string> $names code => name for subjects outside the catalogue
     */
    public function validate(?string $grKey, array $codes, array $names = []): array
    {
        $errors = [];
        $warnings = [];
        $codes = array_values(array_map('strval', $codes));
        foreach (array_count_values($codes) as $code => $n) {
            if ($n > 1) {
                $errors[] = $this->issue('DUPLICATE_SUBJECT', ['code' => $code]);
            }
        }
        $codes = array_values(array_unique($codes));
        $papers = array_sum(array_map(fn ($c) => $this->papers($c), $codes));

        if (! $this->covers($grKey)) {
            return ['ok' => $errors === [], 'errors' => $errors, 'warnings' => [$this->issue('STREAM_NOT_IN_SCHEME')], 'summary' => ['papers' => $papers]];
        }

        return $grKey === 'VOCATIONAL'
            ? $this->validateVocational($codes, $names, $errors, $warnings)
            : $this->validateGeneral($grKey, $codes, $names, $errors, $warnings);
    }

    private function validateVocational(array $codes, array $names, array $errors, array $warnings): array
    {
        $s = $this->scheme['VOCATIONAL'];
        $summary = ['papers' => 0, 'groupA' => [], 'aChoice' => [], 'foundation' => [], 'optional' => [], 'unlisted' => []];
        foreach ($this->compulsory as $code) {
            in_array($code, $codes, true) ? $summary['groupA'][] = $code : $errors[] = $this->issue('COMPULSORY_MISSING', ['subject' => $this->name($code)]);
        }
        foreach ($codes as $code) {
            if (in_array($code, $this->compulsory, true)) {
                continue;
            }
            if (in_array($code, $s['groupAChoice'], true)) {
                $summary['aChoice'][] = $code;
            } elseif ($code === $s['foundation']) {
                $summary['foundation'][] = $code;
            } elseif (in_array($code, $s['optional'], true)) {
                $summary['optional'][] = $code;
            } elseif (isset($this->catalogue[$code])) {
                $errors[] = $this->issue('NOT_ALLOWED_FOR_STREAM', ['subject' => $this->name($code)]);
            } else {
                $summary['unlisted'][] = $code;
                $warnings[] = $this->issue('UNLISTED_SUBJECT', ['code' => $code, 'name' => $names[$code] ?? '']);
            }
        }
        if (! $summary['aChoice']) {
            $errors[] = $this->issue('GROUP_A_LANGUAGE_REQUIRED');
        }
        if (count($summary['aChoice']) > 1) {
            $errors[] = $this->issue('TOO_MANY_GROUP_A_CHOICES');
        }
        if (! $summary['foundation']) {
            $errors[] = $this->issue('FOUNDATION_REQUIRED');
        }
        if (count($summary['optional']) !== 1) {
            $errors[] = $this->issue('ONE_VOCATIONAL_REQUIRED', ['actual' => count($summary['optional'])]);
        }
        $summary['papers'] = array_sum(array_map(fn ($c) => $this->papers($c), $codes));
        if ($summary['papers'] !== 8 && count($summary['optional']) === 1) {
            $errors[] = $this->issue('TOTAL_SUBJECTS', ['expected' => 8, 'actual' => $summary['papers']]);
        }
        return ['ok' => $errors === [], 'errors' => $errors, 'warnings' => $warnings, 'summary' => $summary];
    }

    private function validateGeneral(string $grKey, array $codes, array $names, array $errors, array $warnings): array
    {
        foreach ($this->compulsory as $code) {
            if (! in_array($code, $codes, true)) {
                $errors[] = $this->issue('COMPULSORY_MISSING', ['subject' => $this->name($code)]);
            }
        }
        $optional = array_values(array_diff($codes, $this->compulsory));
        $flexible = [];
        $unlisted = [];
        foreach ($optional as $code) {
            $groups = $this->groupsFor($grKey, $code);
            if ($groups) {
                $flexible[] = ['code' => $code, 'groups' => $groups];
            } elseif (isset($this->catalogue[$code])) {
                $errors[] = $this->issue('NOT_ALLOWED_FOR_STREAM', ['subject' => $this->name($code)]);
            } else {
                $unlisted[] = $code;
                $warnings[] = $this->issue('UNLISTED_SUBJECT', ['code' => $code, 'name' => $names[$code] ?? '']);
            }
        }

        $bifocals = array_values(array_filter($optional, fn ($c) => ($this->catalogue[$c]['kind'] ?? null) === 'BIFOCAL'));
        if (count($bifocals) > 1) {
            $errors[] = $this->issue('ONE_BIFOCAL_ONLY');
        }
        if ($grKey === 'SCIENCE' && $bifocals && in_array($this->biology, $codes, true)) {
            $errors[] = $this->issue('BIFOCAL_REPLACES_BIOLOGY');
        }

        $best = $this->bestAssignment($flexible, count($unlisted));
        $groupErrors = [];
        if (! $best['aChoice']) {
            $groupErrors[] = $this->issue('GROUP_A_CHOICE_REQUIRED');
        }
        if (count($best['aChoice']) > 1) {
            $groupErrors[] = $this->issue('TOO_MANY_GROUP_A_CHOICES');
        }
        if ($best['b'] < 3) {
            $groupErrors[] = $this->issue('GROUP_B_MIN', ['min' => 3, 'actual' => $best['b']]);
        }
        if ($best['b'] + $best['c'] !== 4) {
            $groupErrors[] = $this->issue('GROUP_BC_TOTAL', ['expected' => 4, 'actual' => $best['b'] + $best['c']]);
        }
        $errors = array_merge($errors, $groupErrors);

        $papers = array_sum(array_map(fn ($c) => $this->papers($c), $codes));
        $bcTotalReported = collect($groupErrors)->contains(fn ($e) => $e['code'] === 'GROUP_BC_TOTAL');
        if ($papers !== 8 && ! $bcTotalReported) {
            $errors[] = $this->issue('TOTAL_SUBJECTS', ['expected' => 8, 'actual' => $papers]);
        }

        $summary = [
            'papers' => $papers,
            'groupA' => array_values(array_intersect($this->compulsory, $codes)),
            'aChoice' => $best['aChoice'],
            'groupB' => $best['groupB'],
            'groupC' => array_merge($best['groupC'], $unlisted),
            'unlisted' => $unlisted,
        ];
        return ['ok' => $errors === [], 'errors' => $errors, 'warnings' => $warnings, 'summary' => $summary];
    }

    /** Try every group assignment of the flexible subjects and keep the one with fewest rule violations. */
    private function bestAssignment(array $flexible, int $unlistedCount): array
    {
        $best = null;
        $n = count($flexible);
        $choice = [];
        $walk = function (int $i) use (&$walk, &$best, &$choice, $flexible, $n, $unlistedCount) {
            if ($best && $best['score'] === 0) {
                return;
            }
            if ($i === $n) {
                $a = $bList = $cList = [];
                $b = 0;
                $c = $unlistedCount;
                foreach ($flexible as $k => $f) {
                    $bifocal = ($this->catalogue[$f['code']]['kind'] ?? null) === 'BIFOCAL';
                    $g = $choice[$k];
                    if ($g === 'A_CHOICE') {
                        $a[] = $f['code'];
                        if ($bifocal) {
                            $bList[] = $f['code'];
                            $b++;
                        }
                    } elseif ($g === 'B') {
                        $bList[] = $f['code'];
                        $b++;
                    } else {
                        $cList[] = $f['code'];
                        $c++;
                    }
                }
                $score = (count($a) !== 1 ? max(1, abs(count($a) - 1)) : 0) + max(0, 3 - $b) + abs($b + $c - 4);
                if (! $best || $score < $best['score']) {
                    $best = ['score' => $score, 'aChoice' => $a, 'groupB' => $bList, 'groupC' => $cList, 'b' => $b, 'c' => $c];
                }
                return;
            }
            foreach ($flexible[$i]['groups'] as $g) {
                $choice[$i] = $g;
                $walk($i + 1);
            }
        };
        $walk(0);
        return $best ?? ['score' => 0, 'aChoice' => [], 'groupB' => [], 'groupC' => [], 'b' => 0, 'c' => $unlistedCount];
    }

    private function name(string $code): string
    {
        $locale = app()->getLocale();
        return $this->catalogue[$code]['name'][$locale] ?? $this->catalogue[$code]['name']['en'] ?? $code;
    }

    private function issue(string $code, array $params = []): array
    {
        return ['code' => $code, 'message' => __('gr.' . $code, $params)];
    }
}
