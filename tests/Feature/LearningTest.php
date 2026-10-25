<?php

namespace Tests\Feature;

use App\Models\Attempt;
use App\Models\Certificate;
use App\Models\MemoryTip;
use App\Models\Question;
use App\Models\Quiz;
use App\Models\StudyMaterial;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Tests\Concerns\PortalData;
use Tests\TestCase;

class LearningTest extends TestCase
{
    use PortalData;

    private function teacherUser(): User
    {
        $inst = $this->instituteUser();
        $teacher = Teacher::create(['institute_id' => $inst->institute_id, 'full_name' => 'DESHMUKH ANITA', 'mobile' => '9822001122', 'is_active' => true]);
        $this->actingAs($inst)->post(route('institute.teachers.login', $teacher))->assertSessionHas('login_card');
        return $teacher->fresh()->user;
    }

    private function physics(): Subject
    {
        return Subject::where('board_id', $this->hsc()->id)->whereHas('questions')->orderByDesc(\DB::raw('(select count(*) from questions where questions.subject_id = subjects.id)'))->firstOrFail();
    }

    public function test_question_bank_is_seeded_with_options_and_tips(): void
    {
        $this->assertGreaterThan(150, Question::approved()->count());
        $q = Question::where('type', 'single')->with('options')->first();
        $this->assertSame(1, $q->options->where('is_correct', true)->count());
        $this->assertGreaterThanOrEqual(3, $q->options->where('is_correct', false)->count());
        $this->assertGreaterThan(100, MemoryTip::count());
    }

    public function test_shown_options_always_include_the_correct_answer_and_three_wrong(): void
    {
        $q = Question::where('type', 'single')->with('options')->get()->first(fn ($q) => $q->options->count() > 4);
        $this->assertNotNull($q);
        $right = $q->options->firstWhere('is_correct', true)->id;
        for ($i = 0; $i < 10; $i++) {
            $shown = $q->pickOptions();
            $this->assertCount(4, $shown);
            $this->assertContains($right, $shown);
        }
    }

    public function test_teacher_login_and_pages_render(): void
    {
        $t = $this->teacherUser();
        $this->assertSame(User::TEACHER, $t->role);
        $this->assertTrue($t->must_change_password);
        $t->forceFill(['must_change_password' => false])->save();
        foreach (['/teacher', '/teacher/questions', '/teacher/questions/create', '/teacher/reviews', '/teacher/reviews?tab=materials', '/teacher/reviews?tab=tips',
                  '/teacher/materials', '/teacher/materials/create', '/teacher/quizzes', '/teacher/quizzes/create', '/teacher/progress'] as $url) {
            $this->actingAs($t)->get($url)->assertOk();
        }
    }

    public function test_teacher_adds_a_question_with_many_wrong_answers(): void
    {
        $t = $this->teacherUser();
        $t->forceFill(['must_change_password' => false])->save();
        $s = $this->physics();
        $this->actingAs($t)->post(route('teacher.questions.store'), [
            'subject_id' => $s->id, 'new_topic' => 'Test topic', 'type' => 'single', 'difficulty' => 'easy', 'text' => 'Capital of Maharashtra?',
            'options' => [['text' => 'Mumbai', 'correct' => 1], ['text' => 'Pune'], ['text' => 'Nagpur'], ['text' => 'Nashik'], ['text' => 'Aurangabad']],
            'explanation' => 'Mumbai is the capital.', 'tip' => 'M for Maharashtra, M for Mumbai',
        ])->assertRedirect();
        $q = Question::where('text', 'Capital of Maharashtra?')->firstOrFail();
        $this->assertSame('approved', $q->status);
        $this->assertCount(5, $q->options);
        $this->assertSame('Test topic', $q->topic->name);

        // Only one wrong answer → refused.
        $this->actingAs($t)->post(route('teacher.questions.store'), [
            'subject_id' => $s->id, 'type' => 'single', 'difficulty' => 'easy', 'text' => 'Bad?', 'options' => [['text' => 'A', 'correct' => 1], ['text' => 'B']],
        ])->assertSessionHasErrors('options');
    }

    public function test_student_practice_check_and_result(): void
    {
        $this->makeStudent();
        $parent = $this->parent();
        $s = $this->physics();
        $this->actingAs($parent)->get('/learn')->assertOk()->assertSee(__('Study zone'));
        $this->actingAs($parent)->get('/learn/practice')->assertOk();
        $this->actingAs($parent)->post(route('learn.practice.store'), ['subject_id' => $s->id, 'difficulty' => 'mixed', 'count' => 5, 'minutes' => 0])->assertRedirect();
        $attempt = Attempt::latest('id')->firstOrFail();
        $this->actingAs($parent)->get(route('learn.attempts.show', $attempt))->assertOk();

        $row = $attempt->answers()->with('question.options')->first();
        $right = $row->question->type === 'fill_blank'
            ? [$row->question->options->first()->text]
            : $row->question->options->where('is_correct', true)->pluck('id')->map(fn ($id) => (string) $id)->all();
        $this->actingAs($parent)->postJson(route('learn.attempts.answer', $attempt), ['question_id' => $row->question_id, 'answer' => $right, 'check' => true])
            ->assertOk()->assertJsonPath('checked.correct', true);

        $this->actingAs($parent)->post(route('learn.attempts.submit', $attempt))->assertRedirect(route('learn.attempts.result', $attempt));
        $attempt->refresh();
        $this->assertSame('submitted', $attempt->status);
        $this->assertSame(1, $attempt->correct);
        $this->actingAs($parent)->get(route('learn.attempts.result', $attempt))->assertOk();
        $this->actingAs($parent)->postJson(route('learn.attempts.feedback', $attempt))->assertOk()->assertJsonStructure(['text']);
        $this->actingAs($parent)->get('/learn/progress')->assertOk();
    }

    public function test_scheduled_test_closing_the_page_ends_it_and_one_attempt_only(): void
    {
        $student = $this->makeStudent();
        $t = $this->teacherUser();
        $t->forceFill(['must_change_password' => false])->save();
        $s = $this->physics();
        $this->actingAs($t)->post(route('teacher.quizzes.store'), [
            'title' => 'Unit Test 1', 'subject_id' => $s->id, 'difficulty' => 'mixed', 'question_count' => 5, 'duration_minutes' => 10,
            'starts_at' => now()->subMinute()->format('Y-m-d H:i'), 'ends_at' => now()->addHour()->format('Y-m-d H:i'),
            'marks_per_question' => 2, 'negative_marks' => 0, 'pass_percent' => 0, 'max_warnings' => 1, 'show_answers_after' => 1,
            'certificate_template' => 'merit', 'publish' => 1,
        ])->assertRedirect();
        $quiz = Quiz::firstOrFail();
        $this->assertSame('live', $quiz->state());

        $parent = $this->parent();
        $this->actingAs($parent)->get('/learn/tests')->assertOk()->assertSee('Unit Test 1');
        $this->actingAs($parent)->post(route('learn.tests.start', $quiz))->assertSessionHasErrors('agree');
        $this->actingAs($parent)->post(route('learn.tests.start', $quiz), ['agree' => 1])->assertRedirect();
        $attempt = Attempt::where('quiz_id', $quiz->id)->firstOrFail();
        $this->assertSame(10.0, $attempt->max_score);

        // First switch away: a warning. Closing the page: the test ends.
        $this->actingAs($parent)->postJson(route('learn.attempts.warn', $attempt), ['what' => 'hidden'])->assertJsonPath('warnings', 1);
        $this->actingAs($parent)->post(route('learn.attempts.warn', $attempt), ['what' => 'closed'])->assertJsonPath('ended', true);
        $this->assertSame('terminated', $attempt->fresh()->status);

        // Cannot start again.
        $this->actingAs($parent)->post(route('learn.tests.start', $quiz), ['agree' => 1])->assertRedirect(route('learn.attempts.result', $attempt));
        $this->assertSame(1, Attempt::where('quiz_id', $quiz->id)->count());

        // Teacher sees the result and prints certificates.
        $this->actingAs($t)->get(route('teacher.quizzes.show', $quiz))->assertOk()->assertSee($student->full_name);
        $this->actingAs($t)->post(route('teacher.quizzes.certificates', $quiz), ['template' => 'paithani', 'who' => 'all'])->assertRedirect(route('teacher.quizzes.print', $quiz));
        $cert = Certificate::firstOrFail();
        $this->actingAs($t)->get(route('teacher.quizzes.print', $quiz))->assertOk()->assertSee($cert->serial);
        $this->get(route('certificate.verify', $cert->serial))->assertOk()->assertSee(__('Genuine certificate'));
        $this->actingAs($t)->get(route('teacher.progress.show', $student))->assertOk();
    }

    public function test_heartbeat_timeout_terminates_a_test(): void
    {
        $this->makeStudent();
        $t = $this->teacherUser();
        $quiz = Quiz::create(['title' => 'T', 'subject_id' => $this->physics()->id, 'institute_id' => $t->institute_id, 'created_by' => $t->id,
            'question_count' => 3, 'duration_minutes' => 30, 'starts_at' => now()->subMinute(), 'ends_at' => now()->addHour(), 'status' => 'published']);
        $this->actingAs($this->parent())->post(route('learn.tests.start', $quiz), ['agree' => 1]);
        $attempt = Attempt::firstOrFail();
        $attempt->forceFill(['last_seen_at' => now()->subMinutes(5)])->save();
        $this->actingAs($this->parent())->postJson(route('learn.attempts.heartbeat', $attempt))->assertJsonPath('ended', true);
        $this->assertSame('terminated', $attempt->fresh()->status);
    }

    public function test_student_contributions_wait_for_teacher_review(): void
    {
        $this->makeStudent();
        $parent = $this->parent();
        $s = $this->physics();
        $this->actingAs($parent)->post(route('learn.contribute.store'), [
            'subject_id' => $s->id, 'type' => 'true_false', 'difficulty' => 'easy', 'text' => 'Light travels faster than sound.', 'tf_answer' => 'True', 'tip' => 'You see lightning before thunder',
        ])->assertRedirect();
        $q = Question::where('text', 'Light travels faster than sound.')->firstOrFail();
        $this->assertSame('pending', $q->status);
        $this->actingAs($parent)->post(route('learn.materials.store'), ['subject_id' => $s->id, 'title' => 'My notes', 'body' => '<p>Newton</p><script>x</script>'])->assertRedirect();
        $m = StudyMaterial::where('title', 'My notes')->firstOrFail();
        $this->assertSame('pending', $m->status);
        $this->assertStringNotContainsString('script', $m->body);

        $t = $this->teacherUser();
        $t->forceFill(['must_change_password' => false])->save();
        $this->actingAs($t)->get('/teacher/reviews')->assertSee('Light travels faster than sound.');
        $this->actingAs($t)->post(route('teacher.reviews.decide', ['questions', $q->id]), ['decision' => 'approved'])->assertRedirect();
        $this->assertSame('approved', $q->fresh()->status);
        $this->assertSame('approved', MemoryTip::where('question_id', $q->id)->value('status'));
        $this->actingAs($t)->post(route('teacher.reviews.decide', ['materials', $m->id]), ['decision' => 'rejected', 'note' => 'Add diagrams'])->assertRedirect();
        $this->assertSame('rejected', $m->fresh()->status);
        $this->actingAs($parent)->get('/learn/contribute')->assertOk()->assertSee('Add diagrams', false);
    }

    public function test_other_accounts_cannot_open_an_attempt(): void
    {
        $this->makeStudent();
        $this->actingAs($this->parent())->post(route('learn.practice.store'), ['subject_id' => $this->physics()->id, 'difficulty' => 'mixed', 'count' => 5, 'minutes' => 0]);
        $attempt = Attempt::firstOrFail();
        $other = User::create(['name' => 'X', 'email' => 'x@example.com', 'role' => 'student', 'is_active' => true]);
        $this->actingAs($other)->get(route('learn.attempts.show', $attempt))->assertNotFound();
    }
}
