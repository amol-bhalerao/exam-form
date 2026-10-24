<?php

namespace Tests\Feature;

use App\Models\Application;
use App\Models\InstituteSubject;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class StudentFlowTest extends TestCase
{
    use PortalData;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
        config(['portal.allow_test_payments' => true]);
    }

    private function studentPayload(array $over = []): array
    {
        $inst = $this->instituteUser()->institute;
        return $over + [
            'board_id' => $inst->board_id, 'institute_id' => $inst->id, 'stream_id' => $inst->streams()->where('code', 'SCI')->value('id'),
            'surname' => 'Jadhav', 'first_name' => 'Sneha', 'middle_name' => 'Ramesh', 'mother_name' => 'Kavita',
            'gender' => 'FEMALE', 'dob' => '2008-06-01', 'mobile' => '9822000000', 'address' => 'Cidco N-5',
            'category' => 'OPEN', 'medium' => 'MAR', 'divyang' => 'NONE', 'aadhaar' => '1234 5678 9012',
            'photo' => UploadedFile::fake()->image('p.jpg', 200, 240)->size(80),
            'signature' => UploadedFile::fake()->image('s.png', 300, 100)->size(30),
            'previous' => ['SSC' => ['seat_no' => 'k123456', 'month' => 'MAR', 'year' => 2024, 'percentage' => 81]],
        ];
    }

    public function test_one_account_can_add_several_students(): void
    {
        $parent = $this->parent();
        $this->actingAs($parent)->post(route('student.students.store'), $this->studentPayload())->assertSessionHasNoErrors();
        $this->actingAs($parent)->post(route('student.students.store'), $this->studentPayload(['first_name' => 'Rahul', 'gender' => 'MALE']))->assertSessionHasNoErrors();
        $this->assertSame(2, $parent->students()->count());
        $s = $parent->students()->first();
        $this->assertSame('JADHAV', $s->surname);
        $this->assertSame('K123456', $s->previousExams()->first()->seat_no);
        $this->assertSame('9012', $s->aadhaar_last4);
        $this->assertNotSame('123456789012', $s->getRawOriginal('aadhaar'), 'Aadhaar must be stored encrypted');
    }

    public function test_names_must_be_in_english_capitals_and_photo_is_required(): void
    {
        $this->actingAs($this->parent())->post(route('student.students.store'), $this->studentPayload(['surname' => 'जाधव', 'photo' => null]))
            ->assertSessionHasErrors(['surname', 'photo']);
    }

    public function test_full_application_flow_from_draft_to_payment(): void
    {
        $parent = $this->parent();
        $student = $this->makeStudent($parent);
        $exam = $this->hscExam();

        $this->actingAs($parent)->post(route('student.applications.store', $student), ['exam_id' => $exam->id, 'candidate_type' => 'regular', 'exemption_status' => 'NON_EXEMPTED'])
            ->assertRedirect();
        $form = $student->applications()->firstOrFail();
        $this->assertSame('draft', $form->status);
        $this->assertSame(3, $form->subjects()->count(), 'Compulsory subjects are preselected');

        $ids = Subject::where('board_id', $student->board_id)->whereIn('code', $this->scienceCodes())->pluck('id')->all();
        $this->actingAs($parent)->postJson(route('student.applications.check', $form), ['subject_ids' => $ids])->assertJson(['ok' => true]);
        $this->actingAs($parent)->put(route('student.applications.update', [$form, 'subjects']), ['subject_ids' => $ids])->assertSessionHasNoErrors();
        $this->assertSame(8, $form->subjects()->count());

        $this->actingAs($parent)->post(route('payments.start', $form), [])->assertSessionHasErrors('declaration');
        $this->actingAs($parent)->post(route('payments.start', $form), ['declaration' => '1'])->assertOk()->assertSee(__('Simulate successful payment'));
        $this->actingAs($parent)->post(route('payments.simulate', $form))->assertRedirect(route('student.applications.show', $form));

        $form->refresh();
        $this->assertSame(Application::SUBMITTED, $form->status);
        $this->assertNotNull($form->paid_at);
        $this->assertSame(1, $form->payments()->where('status', 'paid')->count());
        $this->actingAs($parent)->get(route('forms.print', $form))->assertOk()->assertSee($form->application_no);
        $this->actingAs($parent)->get(route('forms.receipt', $form))->assertOk();
        $this->actingAs($parent)->get(route('student.applications.edit', [$form, 'subjects']))->assertRedirect();
    }

    public function test_invalid_subject_choice_is_refused(): void
    {
        $form = $this->makeForm(Application::DRAFT);
        $ids = Subject::where('board_id', $form->board_id)->whereIn('code', ['1', '31', '30'])->pluck('id')->all();
        $this->actingAs($this->parent())->postJson(route('student.applications.check', $form), ['subject_ids' => $ids])->assertJson(['ok' => false]);
        $this->actingAs($this->parent())->put(route('student.applications.update', [$form, 'subjects']), ['subject_ids' => $ids])->assertSessionHasErrors('subject_ids');
    }

    public function test_students_see_only_subjects_offered_by_their_college_when_listed(): void
    {
        $form = $this->makeForm(Application::DRAFT);
        $all = $this->actingAs($this->parent())->get(route('student.applications.edit', [$form, 'subjects']))->assertOk();
        $all->assertSee('भौतिकशास्त्र')->assertSee('इतिहास');

        foreach (Subject::whereIn('code', $this->scienceCodes())->where('board_id', $form->board_id)->get() as $s) {
            InstituteSubject::create(['institute_id' => $form->institute_id, 'stream_id' => $form->stream_id, 'subject_id' => $s->id]);
        }
        $this->actingAs($this->parent())->get(route('student.applications.edit', [$form, 'subjects']))->assertSee('भौतिकशास्त्र')->assertDontSee('इतिहास');

        $history = Subject::where('code', '38')->where('board_id', $form->board_id)->value('id');
        $this->actingAs($this->parent())->put(route('student.applications.update', [$form, 'subjects']), ['subject_ids' => [$history]])->assertSessionHasErrors();
    }

    public function test_repeater_candidates_can_choose_only_their_backlog_subjects(): void
    {
        $student = $this->makeStudent();
        $this->actingAs($this->parent())->post(route('student.applications.store', $student), [
            'exam_id' => $this->hscExam()->id, 'candidate_type' => 'repeater', 'exemption_status' => 'EXEMPTED',
            'last_exam_month' => 'MAR', 'last_exam_year' => 2026, 'last_exam_seat_no' => 'M123456',
        ])->assertSessionHasNoErrors();
        $form = $student->applications()->first();
        $physics = Subject::where('code', '54')->where('board_id', $form->board_id)->value('id');
        $this->actingAs($this->parent())->postJson(route('student.applications.check', $form), ['subject_ids' => [$physics]])->assertJson(['ok' => true]);
    }

    public function test_other_accounts_cannot_see_or_print_someone_elses_form(): void
    {
        $form = $this->makeForm(Application::SUBMITTED);
        $stranger = User::create(['name' => 'Other', 'email' => 'other@example.com', 'role' => User::STUDENT, 'is_active' => true]);
        $this->actingAs($stranger)->get(route('student.applications.show', $form))->assertNotFound();
        $this->actingAs($stranger)->get(route('forms.print', $form))->assertNotFound();
        $this->actingAs($stranger)->get(route('student.students.edit', $form->student))->assertNotFound();
    }

    public function test_a_student_with_a_submitted_form_cannot_be_removed(): void
    {
        $form = $this->makeForm(Application::SUBMITTED);
        $this->actingAs($this->parent())->delete(route('student.students.destroy', $form->student))->assertSessionHas('warning');
        $this->assertNotNull(Student::find($form->student_id));
    }

    public function test_returned_form_can_be_corrected_and_resent_without_paying_again(): void
    {
        $form = $this->makeForm(Application::RETURNED);
        $this->actingAs($this->parent())->get(route('student.applications.edit', [$form, 'review']))->assertSee('Fix photo');
        $this->actingAs($this->parent())->post(route('payments.start', $form), ['declaration' => '1'])->assertRedirect();
        $this->assertSame(Application::SUBMITTED, $form->refresh()->status);
        $this->assertSame(0, $form->payments()->count());
    }

    public function test_live_site_refuses_sandbox_payment_keys_and_test_payments(): void
    {
        $this->withoutMiddleware(\Illuminate\Foundation\Http\Middleware\ValidateCsrfToken::class);
        $this->app['env'] = 'production';
        config(['portal.cashfree.app_id' => 'TEST123', 'portal.cashfree.secret' => 'cfsk_ma_test_x', 'portal.cashfree.env' => 'sandbox', 'portal.allow_test_payments' => false]);
        $form = $this->makeForm(Application::DRAFT);
        $this->actingAs($this->parent())->post(route('payments.start', $form), ['declaration' => '1'])->assertSessionHasErrors('payment');
        $this->assertSame(0, $form->payments()->count());
        $this->actingAs($this->parent())->post(route('payments.simulate', $form))->assertNotFound();
        $this->assertNull($form->refresh()->paid_at);
    }
}
