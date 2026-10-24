<?php

namespace Tests\Unit;

use App\Services\SubjectRules;
use Tests\TestCase;

class SubjectRulesTest extends TestCase
{
    public function test_standard_science_choice_passes(): void
    {
        $r = app(SubjectRules::class)->validate('SCIENCE', ['1', '31', '30', '2', '40', '54', '55', '56']);
        $this->assertTrue($r['ok'], json_encode($r['errors']));
    }

    public function test_missing_compulsory_english_fails(): void
    {
        $r = app(SubjectRules::class)->validate('SCIENCE', ['31', '30', '2', '40', '54', '55', '56']);
        $this->assertFalse($r['ok']);
    }

    public function test_too_few_electives_fails(): void
    {
        $r = app(SubjectRules::class)->validate('ARTS', ['1', '31', '30', '2', '38']);
        $this->assertFalse($r['ok']);
    }
}
