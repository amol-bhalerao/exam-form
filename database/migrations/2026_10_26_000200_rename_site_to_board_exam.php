<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;

/** The portal is now called "Board Exam" (exam forms + study zone). Can be changed later in Site settings. */
return new class extends Migration
{
    public function up(): void
    {
        Setting::put([
            'site_name' => 'Board Exam',
            'site_name_mr' => 'बोर्ड परीक्षा',
            'site_name_hi' => 'बोर्ड परीक्षा',
        ]);
    }

    public function down(): void
    {
        Setting::put(['site_name' => 'HSC & SSC Exam Forms', 'site_name_mr' => 'एचएससी व एसएससी परीक्षा अर्ज', 'site_name_hi' => null]);
    }
};
