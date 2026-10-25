<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([MasterDataSeeder::class, SiteContentSeeder::class, AccountSeeder::class, QuestionBankSeeder::class]);
        // The seeded colleges, schools and board offices are in the Chh. Sambhajinagar division.
        if ($home = \App\Models\Division::where('code', '3')->value('id')) {
            \App\Models\Institute::whereNull('division_id')->update(['division_id' => $home]);
            \App\Models\User::where('role', 'board')->whereNull('division_id')->update(['division_id' => $home]);
            \App\Models\Exam::whereNull('division_id')->update(['division_id' => $home]);
        }
        $this->call(DemoAccountsSeeder::class);
    }
}
