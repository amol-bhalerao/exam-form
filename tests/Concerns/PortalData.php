<?php

namespace Tests\Concerns;

use App\Models\Application;
use App\Models\Board;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\Student;
use App\Models\Subject;
use App\Models\User;
use App\Services\ApplicationWorkflow;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

/** Seeds the real master data (5 institutes per board in tests) and builds forms in any state. */
trait PortalData
{
    use RefreshDatabase;

    protected bool $seed = true;
    protected string $seeder = DatabaseSeeder::class;

    protected function hsc(): Board
    {
        return Board::where('code', 'HSC')->firstOrFail();
    }

    protected function user(string $username): User
    {
        return User::where('username', $username)->firstOrFail();
    }

    protected function superAdmin(): User
    {
        return $this->user('superadmin');
    }

    protected function boardUser(): User
    {
        return $this->user('board2');
    }

    protected function instituteUser(): User
    {
        return $this->user('INSTITUTE1');
    }

    protected function parent(): User
    {
        return User::where('email', 'student.demo@example.com')->firstOrFail();
    }

    protected function hscExam(): Exam
    {
        return Exam::where('code', 'HSC27FEB')->firstOrFail();
    }

    /** The eight subjects of a valid science (2019 GR) choice. */
    protected function scienceCodes(): array
    {
        return ['1', '31', '30', '2', '40', '54', '55', '56'];
    }

    protected function makeStudent(?User $owner = null, ?Institute $institute = null, array $attrs = []): Student
    {
        $institute ??= $this->instituteUser()->institute;
        $stream = $institute->streams()->where('code', 'SCI')->first() ?? $institute->streams()->first();
        return Student::create($attrs + [
            'owner_id' => ($owner ?? $this->parent())->id,
            'board_id' => $institute->board_id,
            'institute_id' => $institute->id,
            'stream_id' => $stream->id,
            'surname' => 'PATIL', 'first_name' => 'AARAV', 'middle_name' => 'SURESH', 'mother_name' => 'SUNITA',
            'gender' => 'MALE', 'dob' => '2008-04-12', 'mobile' => '9876543210', 'email' => 'student.demo@example.com',
            'address' => 'Plot 12, Garkheda', 'category' => 'OBC', 'medium' => 'MAR', 'divyang' => 'NONE',
            'photo_path' => 'students/photos/x.jpg', 'signature_path' => 'students/signatures/x.png',
        ]);
    }

    /** A form moved through the workflow to $status (draft, submitted, verified, approved …). */
    protected function makeForm(string $status = Application::SUBMITTED, ?Student $student = null): Application
    {
        $student ??= $this->makeStudent();
        $exam = $this->hscExam();
        $form = Application::create([
            'application_no' => Application::nextNumber($student->board),
            'exam_id' => $exam->id, 'student_id' => $student->id, 'institute_id' => $student->institute_id,
            'board_id' => $student->board_id, 'stream_id' => $student->stream_id, 'created_by' => $student->owner_id,
            'status' => Application::DRAFT, 'candidate_type' => 'regular', 'exemption_status' => 'NON_EXEMPTED',
            'fee_amount' => $exam->feeFor('regular')['total'],
        ]);
        foreach (Subject::where('board_id', $student->board_id)->whereIn('code', $this->scienceCodes())->get() as $i => $s) {
            $form->subjects()->create(['subject_id' => $s->id, 'answer_language' => 'MAR', 'sort' => $i]);
        }
        $wf = app(ApplicationWorkflow::class);
        $path = [
            Application::DRAFT => [],
            Application::SUBMITTED => [['submit', $this->parent()]],
            Application::RETURNED => [['submit', $this->parent()], ['return', $this->instituteUser(), 'Fix photo']],
            Application::VERIFIED => [['submit', $this->parent()], ['verify', $this->instituteUser()]],
            Application::APPROVED => [['submit', $this->parent()], ['verify', $this->instituteUser()], ['approve', $this->boardUser()]],
        ][$status];
        if ($path) {
            $form->forceFill(['paid_at' => now()])->save();
        }
        foreach ($path as $step) {
            $wf->apply($form->refresh(), $step[0], $step[1], $step[2] ?? null);
        }
        return $form->refresh();
    }
}
