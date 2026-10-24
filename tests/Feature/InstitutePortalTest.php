<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\Institute;
use App\Models\Subject;
use App\Models\Teacher;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class InstitutePortalTest extends TestCase
{
    use PortalData;

    public function test_dashboard_and_pages_render(): void
    {
        $this->makeForm(Application::SUBMITTED);
        $u = $this->instituteUser();
        foreach (['/institute', '/institute/forms', '/institute/teachers', '/institute/teachers/create', '/institute/subjects', '/institute/profile'] as $url) {
            $this->actingAs($u)->get($url)->assertOk();
        }
    }

    public function test_institute_sees_only_its_own_paid_forms(): void
    {
        $mine = $this->makeForm(Application::SUBMITTED);
        $other = Institute::where('board_id', $mine->board_id)->where('id', '!=', $mine->institute_id)->first();
        $theirs = $this->makeForm(Application::SUBMITTED, $this->makeStudent(institute: $other, attrs: ['first_name' => 'OTHERKID']));
        $draft = $this->makeForm(Application::DRAFT, $this->makeStudent(attrs: ['first_name' => 'DRAFTKID']));

        $this->actingAs($this->instituteUser())->get('/institute/forms')->assertSee($mine->application_no)->assertDontSee('OTHERKID')->assertDontSee('DRAFTKID');
        $this->actingAs($this->instituteUser())->get(route('institute.forms.show', $theirs))->assertNotFound();
        $this->actingAs($this->instituteUser())->get(route('institute.forms.show', $draft))->assertNotFound();
    }

    public function test_verify_forwards_to_board_with_a_college_sequence_number(): void
    {
        $form = $this->makeForm(Application::SUBMITTED);
        $this->actingAs($this->instituteUser())->post(route('institute.forms.decide', $form), ['action' => 'verify'])->assertRedirect();
        $form->refresh();
        $this->assertSame(Application::VERIFIED, $form->status);
        $this->assertStringEndsWith('-0001', $form->institute_seq);
        $this->assertTrue($form->events()->where('action', 'verify')->exists());
    }

    public function test_sending_back_requires_a_reason(): void
    {
        $form = $this->makeForm(Application::SUBMITTED);
        $this->actingAs($this->instituteUser())->post(route('institute.forms.decide', $form), ['action' => 'return'])->assertSessionHasErrors('note');
        $this->actingAs($this->instituteUser())->post(route('institute.forms.decide', $form), ['action' => 'return', 'note' => 'Signature unclear']);
        $this->assertSame(Application::RETURNED, $form->refresh()->status);
        $this->assertSame('Signature unclear', $form->institute_note);
    }

    public function test_corrections_are_saved_and_logged_with_a_diff(): void
    {
        $form = $this->makeForm(Application::SUBMITTED);
        $s = $form->student;
        $ids = $form->subjects()->pluck('subject_id')->all();
        $this->actingAs($this->instituteUser())->put(route('institute.forms.update', $form), [
            'surname' => $s->surname, 'first_name' => $s->first_name, 'middle_name' => $s->middle_name, 'mother_name' => $s->mother_name,
            'gender' => $s->gender, 'dob' => $s->dob->format('Y-m-d'), 'category' => $s->category, 'medium' => $s->medium,
            'divyang' => 'NONE', 'mobile' => '9000000001', 'address' => $s->address, 'exemption_status' => 'NON_EXEMPTED',
            'subject_ids' => $ids, 'note' => 'Mobile as per SLC',
        ])->assertSessionHasNoErrors();
        $this->assertSame('9000000001', $s->refresh()->mobile);
        $event = $form->events()->where('action', 'corrected')->firstOrFail();
        $this->assertSame('9000000001', $event->changes['mobile']['to']);
    }

    public function test_bulk_verify_skips_forms_not_waiting(): void
    {
        $a = $this->makeForm(Application::SUBMITTED);
        $b = $this->makeForm(Application::VERIFIED, $this->makeStudent(attrs: ['first_name' => 'BEE']));
        $this->actingAs($this->instituteUser())->post(route('institute.forms.bulk'), ['ids' => [$a->id, $b->id], 'action' => 'verify'])->assertSessionHas('warning');
        $this->assertSame(Application::VERIFIED, $a->refresh()->status);
    }

    public function test_teachers_are_added_and_changes_send_them_back_for_board_review(): void
    {
        $u = $this->instituteUser();
        $subject = Subject::where('board_id', $u->institute->board_id)->where('code', '54')->first();
        $this->actingAs($u)->post(route('institute.teachers.store'), [
            'full_name' => 'Kulkarni Anil', 'mobile' => '9822012345', 'subject_id' => $subject->id, 'duty_roles' => ['examiner', 'moderator'], 'available_for_duty' => '1',
        ])->assertSessionHasNoErrors();
        $t = Teacher::firstOrFail();
        $this->assertSame('KULKARNI ANIL', $t->full_name);
        $this->assertSame('pending', $t->board_status);
        $t->update(['board_status' => 'approved']);
        $this->actingAs($u)->put(route('institute.teachers.update', $t), ['full_name' => $t->full_name, 'mobile' => $t->mobile, 'subject_id' => $subject->id, 'duty_roles' => ['examiner'], 'is_active' => '1'])->assertSessionHasNoErrors();
        $this->assertSame('pending', $t->refresh()->board_status);
    }

    public function test_institute_lists_its_subjects_per_stream(): void
    {
        $u = $this->instituteUser();
        $stream = $u->institute->streams()->first();
        $ids = Subject::where('board_id', $u->institute->board_id)->whereIn('code', $this->scienceCodes())->pluck('id')->all();
        $this->actingAs($u)->put(route('institute.subjects.update', $stream), ['subjects' => $ids])->assertRedirect();
        $this->assertSame(8, $u->institute->offeredSubjects()->where('stream_id', $stream->id)->count());
        $this->actingAs($u)->put(route('institute.subjects.update', $stream), ['subjects' => array_slice($ids, 0, 3)]);
        $this->assertSame(3, $u->institute->offeredSubjects()->where('stream_id', $stream->id)->count());
    }

    public function test_csv_export_downloads(): void
    {
        $this->makeForm(Application::SUBMITTED);
        $res = $this->actingAs($this->instituteUser())->get(route('institute.forms.export'));
        $res->assertOk();
        $this->assertStringContainsString('Application no', $res->streamedContent());
    }
}
