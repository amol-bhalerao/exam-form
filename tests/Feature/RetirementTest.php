<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Teacher;
use App\Support\Retirement;
use Illuminate\Support\Carbon;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class RetirementTest extends TestCase
{
    use PortalData;

    public function test_retirement_is_on_the_last_day_of_the_month_of_reaching_58(): void
    {
        $this->assertSame('2028-06-30', Retirement::date(Carbon::parse('1970-06-15'))->toDateString());
        $this->assertSame('2026-03-31', Retirement::date(Carbon::parse('1968-03-31'))->toDateString());
        // Born on the 1st: last day of the previous month (Bombay High Court, MCS Pension Rules note).
        $this->assertSame('2015-12-31', Retirement::date(Carbon::parse('1958-01-01'))->toDateString());
        $this->assertSame('2026-02-28', Retirement::date(Carbon::parse('1968-03-01'))->toDateString());
        $this->assertSame('2038-02-28', Retirement::date(Carbon::parse('1980-02-29'))->toDateString());
        // Teacher-specific age and the site setting.
        $this->assertSame('2030-06-30', Retirement::date(Carbon::parse('1970-06-15'), 60)->toDateString());
        Setting::put(['teacher_retirement_age' => 60]);
        $this->assertSame('2030-06-30', Retirement::date(Carbon::parse('1970-06-15'))->toDateString());
    }

    public function test_college_saves_service_details_and_sees_retirement(): void
    {
        $u = $this->instituteUser();
        $dob = now()->subYears(58)->addMonths(5)->day(15)->toDateString();
        $this->actingAs($u)->post(route('institute.teachers.store'), [
            'full_name' => 'Kale N A', 'mobile' => '9822001133', 'dob' => $dob, 'joined_on' => '2005-07-01', 'shalarth_id' => 'MH-12345',
            'approval_no' => 'EO/2005/77', 'approval_date' => '2005-09-10', 'medium' => 'ENG', 'category' => 'OBC', 'teaches_classes' => 'XI, XII',
            'experience_years' => 20, 'available_for_duty' => 1,
        ])->assertRedirect();
        $t = Teacher::where('full_name', 'KALE N A')->firstOrFail();
        $this->assertSame('MH-12345', $t->shalarth_id);
        $this->assertTrue($t->retiresWithin(12));
        $this->actingAs($u)->get(route('institute.teachers.index', ['retiring' => 12]))->assertOk()->assertSee('KALE N A')->assertSee($t->retirementDate()->format('d-m-Y'));
        $this->actingAs($u)->get(route('institute.teachers.edit', $t))->assertOk()->assertSee(__('Date of retirement'));

        $html = $this->actingAs($u)->get(route('institute.panel', ['print' => 1, 'retiring' => 12, 'cols' => ['name', 'dob', 'retirement', 'remaining', 'shalarth_id']]))->assertOk()->getContent();
        $this->assertStringContainsString('MH-12345', $html);
        $this->assertStringContainsString($t->retirementDate()->format('d-m-Y'), $html);
    }

    public function test_retired_teachers_are_left_out_of_the_panel(): void
    {
        $u = $this->instituteUser();
        Teacher::create(['institute_id' => $u->institute_id, 'full_name' => 'OLD TEACHER', 'mobile' => '9000000011', 'dob' => now()->subYears(59), 'is_active' => true, 'board_status' => 'approved']);
        $this->actingAs($u)->get(route('institute.panel', ['print' => 1]))->assertDontSee('OLD TEACHER');
        $this->actingAs($u)->get(route('institute.panel', ['print' => 1, 'serving' => 0]))->assertSee('OLD TEACHER');
    }
}
