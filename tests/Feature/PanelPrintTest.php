<?php

namespace Tests\Feature;

use App\Models\Division;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class PanelPrintTest extends TestCase
{
    use PortalData;

    private function teachers(): void
    {
        $inst = $this->instituteUser()->institute;
        $phy = Subject::where('board_id', $inst->board_id)->where('name', 'like', '%Physics%')->first();
        Teacher::create(['institute_id' => $inst->id, 'full_name' => 'INGLE A M', 'mobile' => '9527798521', 'subject_id' => $phy->id, 'experience_years' => 10,
            'last_appointment_no' => 'H02698', 'duty_roles' => ['examiner'], 'board_status' => 'approved', 'is_active' => true, 'available_for_duty' => true]);
        Teacher::create(['institute_id' => $inst->id, 'full_name' => 'PATIL R K', 'mobile' => '9000000009', 'subject_id' => $phy->id, 'experience_years' => 4,
            'duty_roles' => ['supervisor'], 'board_status' => 'pending', 'is_active' => true, 'available_for_duty' => true]);
    }

    public function test_college_prints_panel_filtered_by_duty_with_signature_column(): void
    {
        $this->teachers();
        $u = $this->instituteUser();
        $this->actingAs($u)->get(route('institute.panel'))->assertOk()->assertSee('INGLE A M')->assertSee('PATIL R K');
        $html = $this->actingAs($u)->get(route('institute.panel', ['duties' => ['examiner'], 'print' => 1, 'cols' => ['sr', 'name', 'subject_code', 'subject', 'experience', 'signature'], 'c_due' => '2026-11-16']))
            ->assertOk()->assertSee('INGLE A M')->assertDontSee('PATIL R K')->assertSee('PHYSICS')->assertSee(__('Signature'))->getContent();
        $this->assertStringNotContainsString('9527798521', $html); // mobile column not chosen
        $this->assertStringContainsString(mb_strtoupper(__('Examiner')), $html);
    }

    public function test_board_prints_one_page_per_college_only_for_its_division(): void
    {
        $this->teachers();
        $board = $this->boardUser();
        $this->actingAs($board)->get(route('board.panel', ['print' => 1, 'status' => 'all', 'c_due' => '2026-11-16']))
            ->assertOk()->assertSee('INGLE A M')->assertSee($this->instituteUser()->institute->college_no)->assertSee('16-11-2026');
        $pune = User::create(['name' => 'Pune', 'username' => 'pune.x', 'password' => 'Password@123', 'role' => 'board', 'board_id' => $board->board_id,
            'division_id' => Division::where('code', '1')->value('id'), 'is_active' => true]);
        $this->actingAs($pune)->get(route('board.panel', ['print' => 1, 'status' => 'all']))->assertOk()->assertDontSee('INGLE A M');
    }
}
