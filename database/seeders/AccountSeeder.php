<?php

namespace Database\Seeders;

use App\Models\Board;
use App\Models\Exam;
use App\Models\Institute;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

/**
 * Creates the first super admin. In local/testing environments it also creates
 * demo board, institute and student accounts and an open exam to try the flows.
 */
class AccountSeeder extends Seeder
{
    public function run(): void
    {
        $local = app()->environment('local', 'testing');
        // Local/testing logins match the ones used on the old portal so the same test steps work.
        $testPassword = env('SEED_TEST_PASSWORD', 'Password@123');
        $password = env('SEED_ADMIN_PASSWORD') ?: ($local ? $testPassword : Str::password(14));
        $admin = User::firstOrCreate(['username' => 'superadmin'], [
            'name' => 'Super Admin', 'role' => User::SUPER_ADMIN, 'password' => $password, 'is_active' => true,
            'must_change_password' => ! app()->environment('local', 'testing'),
        ]);
        if ($admin->wasRecentlyCreated && $this->command) {
            $this->command->warn("Super admin created: username 'superadmin', password '{$password}'. Change it after first sign-in.");
        }

        if (! $local) {
            return;
        }

        $hsc = Board::where('code', 'HSC')->first();
        $ssc = Board::where('code', 'SSC')->first();
        foreach ([[$hsc, 'board2', 'HSC Board Office'], [$ssc, 'board_ssc', 'SSC Board Office']] as [$board, $username, $name]) {
            User::firstOrCreate(['username' => $username], [
                'name' => $name, 'role' => User::BOARD, 'board_id' => $board->id, 'password' => $testPassword,
            ]);
        }

        $college = Institute::where('board_id', $hsc->id)->orderBy('college_no')->first();
        User::firstOrCreate(['username' => 'INSTITUTE1'], [
            'name' => 'Principal, ' . $college->name, 'role' => User::INSTITUTE, 'institute_id' => $college->id,
            'board_id' => $hsc->id, 'password' => $testPassword,
        ]);
        $school = Institute::where('board_id', $ssc->id)->orderBy('college_no')->first();
        User::firstOrCreate(['username' => 'SCHOOL1'], [
            'name' => 'Headmaster, ' . $school->name, 'role' => User::INSTITUTE, 'institute_id' => $school->id,
            'board_id' => $ssc->id, 'password' => $testPassword,
        ]);
        User::firstOrCreate(['email' => 'student.demo@example.com'], [
            'name' => 'Demo Parent', 'role' => User::STUDENT,
        ]);

        foreach ([[$hsc, 'HSC27FEB', 'HSC Examination February–March 2027'], [$ssc, 'SSC27FEB', 'SSC Examination February–March 2027']] as [$board, $code, $name]) {
            $exam = Exam::firstOrCreate(['code' => $code], [
                'board_id' => $board->id, 'name' => $name, 'session' => 'FEB-MAR', 'year' => 2027, 'academic_year' => '2026-27',
                'candidate_types' => ['regular', 'repeater', 'improvement', 'isolated', 'private'],
                'opens_at' => now()->subDays(5), 'closes_at' => now()->addDays(25), 'late_closes_at' => now()->addDays(40),
                'exam_starts_on' => '2027-02-18', 'exam_ends_on' => '2027-03-20', 'is_published' => true,
                'instructions' => 'Check every detail before paying the fee. Your college will verify the form.',
            ]);
            foreach (['regular' => [520, 100], 'repeater' => [520, 100], 'improvement' => [620, 100], 'isolated' => [520, 100], 'private' => [1050, 200]] as $type => [$fee, $late]) {
                $exam->fees()->updateOrCreate(['candidate_type' => $type], ['fee' => $fee, 'late_fee' => $late]);
            }
        }
    }
}
