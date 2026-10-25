<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Institute;
use App\Models\Quiz;
use App\Models\Student;
use App\Models\Subject;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Database\Seeder;

/**
 * Testing mode (DEMO_LOGINS=true): one account per role, all marked is_demo, with a demo
 * student at the demo college and an open demo test. With DEMO_LOGINS off, demo accounts
 * are switched off. Safe to run any number of times ("Apply update" runs it).
 */
class DemoAccountsSeeder extends Seeder
{
    public const ACCOUNTS = [
        'super_admin' => ['demo.admin', 'Demo Super Admin'],
        'board' => ['demo.board', 'Demo Board Officer'],
        'institute' => ['demo.college', 'Demo College Clerk'],
        'teacher' => ['demo.teacher', 'Demo Teacher'],
    ];
    public const STUDENT_EMAIL = 'student.demo@example.com';

    public function run(): void
    {
        if (! config('portal.demo_logins')) {
            User::where('is_demo', true)->update(['is_active' => false]);
            return;
        }
        $hsc = Board::where('code', 'HSC')->first() ?? Board::orderBy('id')->first();
        // Prefer a college that offers streams, so the demo student can fill a form.
        $college = Institute::where('board_id', $hsc?->id)->whereHas('streams')->orderBy('id')->first()
            ?? Institute::where('board_id', $hsc?->id)->orderBy('id')->first();
        $password = config('portal.demo_password');
        $users = [];
        foreach (self::ACCOUNTS as $role => [$username, $name]) {
            if ((in_array($role, ['institute', 'teacher'], true) && ! $college) || ($role === 'board' && ! $hsc)) {
                continue;
            }
            $u = User::firstOrNew(['username' => $username]);
            $u->forceFill([
                'name' => $name, 'role' => $role, 'password' => $password, 'is_active' => true, 'is_demo' => true, 'must_change_password' => false,
                'board_id' => $role === 'super_admin' ? null : $hsc?->id,
                'institute_id' => in_array($role, ['institute', 'teacher'], true) ? $college->id : null,
            ])->save();
            $users[$role] = $u;
        }
        $parent = User::firstOrNew(['email' => self::STUDENT_EMAIL]);
        $parent->forceFill(['name' => 'Demo Student', 'role' => User::STUDENT, 'is_active' => true, 'is_demo' => true])->save();
        if (! $college) {
            return;
        }

        $teacher = Teacher::firstOrNew(['user_id' => $users['teacher']->id]);
        $subject = Subject::where('board_id', $hsc->id)->withCount(['questions' => fn ($q) => $q->where('status', 'approved')])->orderByDesc('questions_count')->first();
        $teacher->forceFill([
            'institute_id' => $college->id, 'full_name' => 'DEMO TEACHER', 'mobile' => '9000000001', 'is_active' => true,
            'subject_id' => $teacher->subject_id ?? $subject?->id, 'designation' => 'Lecturer',
        ])->save();

        if (! $parent->students()->exists()) {
            $stream = $college->streams()->where('code', 'SCI')->first() ?? $college->streams()->first();
            Student::create([
                'owner_id' => $parent->id, 'board_id' => $hsc->id, 'institute_id' => $college->id, 'stream_id' => $stream?->id,
                'surname' => 'DEMO', 'first_name' => 'STUDENT', 'middle_name' => 'TEST', 'mother_name' => 'DEMO',
                'gender' => 'MALE', 'dob' => '2008-06-15', 'mobile' => '9000000002', 'email' => self::STUDENT_EMAIL,
                'address' => 'Demo address', 'category' => 'OPEN', 'medium' => 'ENG', 'divyang' => 'NONE',
            ]);
        }

        // An open test from the demo teacher, so the test flow and certificates can be tried.
        if ($subject && $subject->questions_count > 0) {
            Quiz::updateOrCreate(['title' => 'Demo Unit Test', 'institute_id' => $college->id], [
                'subject_id' => $subject->id, 'created_by' => $users['teacher']->id, 'difficulty' => 'mixed',
                'question_count' => min(10, $subject->questions_count), 'duration_minutes' => 15,
                'starts_at' => now()->subDay()->startOfDay(), 'ends_at' => now()->addDays(60)->endOfDay(),
                'marks_per_question' => 1, 'negative_marks' => 0, 'pass_percent' => 35, 'max_warnings' => 1,
                'show_answers_after' => true, 'certificate_template' => 'paithani', 'status' => 'published',
                'instructions' => 'This is a demo test. Try leaving the page once to see the warning.',
            ]);
        }
    }

    /**
     * Called before a demo sign-in: if "Apply update" was not run after enabling testing mode,
     * apply pending database changes and create the demo accounts now. Returns an error text or null.
     */
    public static function ensure(): ?string
    {
        if (! config('portal.demo_logins')) {
            return null;
        }
        try {
            if (! \Illuminate\Support\Facades\Schema::hasColumn('users', 'is_demo') || ! \Illuminate\Support\Facades\Schema::hasTable('quizzes')) {
                \Illuminate\Support\Facades\Artisan::call('migrate', ['--force' => true]);
            }
            if (! \App\Models\Question::exists()) {
                (new QuestionBankSeeder())->run();
            }
            $have = User::where('is_demo', true)->where('is_active', true)->whereIn('username', array_column(self::ACCOUNTS, 0))->count();
            if ($have < count(self::ACCOUNTS) || ! User::where('email', self::STUDENT_EMAIL)->where('is_active', true)->exists()) {
                (new self())->run();
            }
        } catch (\Throwable $e) {
            report($e);
            return __('Demo accounts could not be prepared: :error', ['error' => mb_substr($e->getMessage(), 0, 250)]);
        }
        return null;
    }

    /** What the website shows in testing mode. */
    public static function cards(): array
    {
        if (! config('portal.demo_logins')) {
            return [];
        }
        $college = User::where('username', self::ACCOUNTS['institute'][0])->first()?->institute;
        $cards = [];
        foreach (self::ACCOUNTS as $role => [$username]) {
            $cards[$role] = ['username' => $username, 'password' => config('portal.demo_password'), 'url' => route("staff.login.$role")];
        }
        return ['cards' => $cards, 'college' => $college];
    }
}
