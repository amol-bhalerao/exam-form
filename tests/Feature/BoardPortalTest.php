<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Board;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\Notice;
use App\Models\Teacher;
use App\Models\User;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class BoardPortalTest extends TestCase
{
    use PortalData;

    public function test_board_pages_render(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $u = $this->boardUser();
        foreach (['/board', '/board/forms', '/board/forms/' . $form->id, '/board/exams', '/board/exams/create', '/board/examiners', '/board/institutes', '/board/institutes/' . $form->institute_id, '/board/notices', '/board/notices/create'] as $url) {
            $this->actingAs($u)->get($url)->assertOk();
        }
    }

    public function test_board_lists_verified_forms_but_not_those_still_with_colleges(): void
    {
        $verified = $this->makeForm(Application::VERIFIED);
        $this->makeForm(Application::SUBMITTED, $this->makeStudent(attrs: ['first_name' => 'WITHCOLLEGE']));
        $this->actingAs($this->boardUser())->get('/board/forms')->assertSee($verified->application_no)->assertDontSee('WITHCOLLEGE');
    }

    public function test_approve_assigns_a_board_number(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $this->actingAs($this->boardUser())->post(route('board.forms.decide', $form), ['action' => 'approve'])->assertRedirect();
        $form->refresh();
        $this->assertSame(Application::APPROVED, $form->status);
        $this->assertStringEndsWith('-000001', $form->board_seq);
    }

    public function test_reject_and_return_need_a_reason_and_reopen_works(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $this->actingAs($this->boardUser())->post(route('board.forms.decide', $form), ['action' => 'reject'])->assertSessionHasErrors('note');
        $this->actingAs($this->boardUser())->post(route('board.forms.decide', $form), ['action' => 'reject', 'note' => 'Not eligible']);
        $this->assertSame(Application::REJECTED, $form->refresh()->status);
        $this->actingAs($this->boardUser())->post(route('board.forms.decide', $form), ['action' => 'reopen']);
        $this->assertSame(Application::VERIFIED, $form->refresh()->status);
        $this->actingAs($this->boardUser())->post(route('board.forms.decide', $form), ['action' => 'board_return', 'note' => 'Wrong stream']);
        $this->assertSame(Application::BOARD_RETURNED, $form->refresh()->status);
        // The college can now verify it again.
        $this->actingAs($this->instituteUser())->post(route('institute.forms.decide', $form), ['action' => 'verify']);
        $this->assertSame(Application::VERIFIED, $form->refresh()->status);
    }

    public function test_board_cannot_open_another_boards_forms(): void
    {
        $form = $this->makeForm(Application::VERIFIED);
        $ssc = User::where('username', 'board_ssc')->firstOrFail();
        $this->actingAs($ssc)->get(route('board.forms.show', $form))->assertNotFound();
        $this->actingAs($ssc)->post(route('board.forms.decide', $form), ['action' => 'approve'])->assertNotFound();
        $this->assertSame(Application::VERIFIED, $form->refresh()->status);
    }

    public function test_bulk_approve(): void
    {
        $a = $this->makeForm(Application::VERIFIED);
        $b = $this->makeForm(Application::VERIFIED, $this->makeStudent(attrs: ['first_name' => 'BEE']));
        $this->actingAs($this->boardUser())->post(route('board.forms.bulk'), ['ids' => [$a->id, $b->id], 'action' => 'approve']);
        $this->assertSame(2, Application::where('status', Application::APPROVED)->count());
        $this->assertNotSame($a->refresh()->board_seq, $b->refresh()->board_seq);
    }

    public function test_create_exam_with_fees_per_candidate_type(): void
    {
        $this->actingAs($this->boardUser())->post(route('board.exams.store'), [
            'name' => 'HSC Supplementary July 2027', 'code' => 'HSC27JUL', 'session' => 'JUL-AUG', 'year' => 2027, 'academic_year' => '2026-27',
            'candidate_types' => ['repeater', 'improvement'], 'fee' => ['repeater' => 470, 'improvement' => 620], 'late_fee' => ['repeater' => 100],
            'opens_at' => now()->toDateString(), 'closes_at' => now()->addMonth()->toDateString(), 'is_published' => '1',
        ])->assertSessionHasNoErrors();
        $exam = Exam::where('code', 'HSC27JUL')->with('fees')->firstOrFail();
        $this->assertSame($this->boardUser()->board_id, $exam->board_id);
        $this->assertSame(['repeater', 'improvement'], $exam->candidate_types);
        $this->assertSame(470, $exam->feeFor('repeater')['total']);
        $this->assertTrue($exam->isOpen());
    }

    public function test_fee_is_required_for_each_allowed_type(): void
    {
        $this->actingAs($this->boardUser())->post(route('board.exams.store'), [
            'name' => 'X', 'code' => 'X1', 'session' => 'FEB-MAR', 'year' => 2027, 'academic_year' => '2026-27',
            'candidate_types' => ['regular'], 'fee' => [], 'opens_at' => '2026-11-01', 'closes_at' => '2026-12-01',
        ])->assertSessionHasErrors('fee.regular');
    }

    public function test_exam_with_forms_cannot_be_deleted(): void
    {
        $form = $this->makeForm(Application::DRAFT);
        $this->actingAs($this->boardUser())->delete(route('board.exams.destroy', $form->exam))->assertSessionHas('warning');
        $this->assertNotNull(Exam::find($form->exam_id));
    }

    public function test_examiner_review(): void
    {
        $t = Teacher::create(['institute_id' => $this->instituteUser()->institute_id, 'full_name' => 'DESHMUKH RAJ', 'mobile' => '9822000001', 'duty_roles' => ['examiner'], 'board_status' => 'pending']);
        $this->actingAs($this->boardUser())->post(route('board.examiners.decide', $t), ['decision' => 'rejected'])->assertSessionHasErrors('note');
        $this->actingAs($this->boardUser())->post(route('board.examiners.decide', $t), ['decision' => 'approved']);
        $this->assertSame('approved', $t->refresh()->board_status);
        $this->assertSame($this->boardUser()->id, $t->reviewed_by);

        $sscTeacher = Teacher::create(['institute_id' => Institute::where('board_id', Board::where('code', 'SSC')->value('id'))->value('id'), 'full_name' => 'X', 'duty_roles' => ['examiner']]);
        $this->actingAs($this->boardUser())->post(route('board.examiners.decide', $sscTeacher), ['decision' => 'approved'])->assertNotFound();
    }

    public function test_notice_body_is_sanitized(): void
    {
        $this->actingAs($this->boardUser())->post(route('board.notices.store'), [
            'title' => 'Timetable', 'category' => 'timetable', 'status' => 'published',
            'body' => '<p onclick="steal()">Hello <a href="javascript:alert(1)">x</a></p><script>alert(1)</script>',
        ])->assertSessionHasNoErrors();
        $n = Notice::where('title', 'Timetable')->firstOrFail();
        $this->assertStringNotContainsString('<script', $n->body);
        $this->assertStringNotContainsString('onclick', $n->body);
        $this->assertStringNotContainsString('javascript:', $n->body);
        $this->assertSame($this->boardUser()->board_id, $n->board_id);
    }
}
