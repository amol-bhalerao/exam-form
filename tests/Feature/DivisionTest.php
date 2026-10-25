<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Board;
use App\Models\Division;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\User;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class DivisionTest extends TestCase
{
    use PortalData;

    public function test_nine_divisions_exist_and_existing_colleges_are_in_chh_sambhajinagar(): void
    {
        $this->assertSame(9, Division::count());
        $home = Division::where('code', '3')->first();
        $this->assertSame(0, Institute::whereNull('division_id')->count());
        $this->assertSame(Institute::count(), $home->institutes()->count());
        $this->assertSame('पुणे विभागीय मंडळ', Division::where('code', '1')->value('name_mr'));
    }

    public function test_admin_manages_divisions_exam_boards_and_streams(): void
    {
        $admin = $this->superAdmin();
        foreach (['/admin/divisions', '/admin/divisions/create', '/admin/boards', '/admin/boards/create', '/admin/streams'] as $url) {
            $this->actingAs($admin)->get($url)->assertOk();
        }
        $this->actingAs($admin)->post(route('admin.divisions.store'), ['code' => '10', 'name' => 'Test Divisional Board', 'short_name' => 'Test', 'is_active' => 1])->assertRedirect();
        $this->actingAs($admin)->post(route('admin.boards.store'), ['code' => 'DELED', 'name' => 'Diploma in Elementary Education', 'short_name' => 'D.El.Ed', 'has_streams' => 0])->assertRedirect();
        $board = Board::where('code', 'DELED')->firstOrFail();
        $this->actingAs($admin)->post(route('admin.streams.store'), ['board_id' => $board->id, 'code' => 'GEN', 'name' => 'General'])->assertRedirect();
        $this->assertSame(1, $board->streams()->count());
        $this->actingAs($admin)->delete(route('admin.boards.destroy', $this->hsc()))->assertSessionHas('warning');
    }

    public function test_divisional_officer_sees_only_their_division(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $pune = Division::where('code', '1')->first();
        $officer = User::create(['name' => 'Pune officer', 'username' => 'pune.hsc', 'password' => 'Password@123', 'role' => 'board',
            'board_id' => $form->board_id, 'division_id' => $pune->id, 'is_active' => true]);
        $this->actingAs($officer)->get('/board/forms')->assertOk()->assertDontSee($form->application_no);
        $this->actingAs($officer)->get(route('board.forms.show', $form))->assertNotFound();

        $form->institute->update(['division_id' => $pune->id]);
        $this->actingAs($officer)->get('/board/forms')->assertSee($form->application_no);
        $this->actingAs($this->boardUser())->get('/board/forms')->assertDontSee($form->application_no); // board2 is Chh. Sambhajinagar
    }

    public function test_division_exam_is_offered_only_to_that_divisions_students(): void
    {
        $exam = $this->hscExam();
        $student = $this->makeStudent();
        $this->actingAs($this->parent())->get(route('student.applications.create', $student))->assertSee($exam->name);
        $exam->update(['division_id' => Division::where('code', '1')->value('id')]);
        $this->actingAs($this->parent())->get(route('student.applications.create', $student))->assertDontSee($exam->name);
        $exam->update(['division_id' => $student->institute->division_id]);
        $this->actingAs($this->parent())->get(route('student.applications.create', $student))->assertSee($exam->name);
    }
}
