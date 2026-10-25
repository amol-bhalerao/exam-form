<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Divisional boards (Pune, Mumbai, Chh. Sambhajinagar …). Colleges/schools belong to a division;
 * board officers and exams can be limited to one division. Existing data is Chh. Sambhajinagar.
 */
return new class extends Migration
{
    public const DIVISIONS = [
        ['1', 'Pune Divisional Board', 'पुणे विभागीय मंडळ', 'पुणे विभागीय बोर्ड', 'Pune'],
        ['2', 'Mumbai Divisional Board', 'मुंबई विभागीय मंडळ', 'मुंबई विभागीय बोर्ड', 'Mumbai'],
        ['3', 'Chhatrapati Sambhajinagar Divisional Board', 'छत्रपती संभाजीनगर विभागीय मंडळ', 'छत्रपति संभाजीनगर विभागीय बोर्ड', 'Chh. Sambhajinagar'],
        ['4', 'Nashik Divisional Board', 'नाशिक विभागीय मंडळ', 'नासिक विभागीय बोर्ड', 'Nashik'],
        ['5', 'Kolhapur Divisional Board', 'कोल्हापूर विभागीय मंडळ', 'कोल्हापुर विभागीय बोर्ड', 'Kolhapur'],
        ['6', 'Amravati Divisional Board', 'अमरावती विभागीय मंडळ', 'अमरावती विभागीय बोर्ड', 'Amravati'],
        ['7', 'Latur Divisional Board', 'लातूर विभागीय मंडळ', 'लातूर विभागीय बोर्ड', 'Latur'],
        ['8', 'Nagpur Divisional Board', 'नागपूर विभागीय मंडळ', 'नागपुर विभागीय बोर्ड', 'Nagpur'],
        ['9', 'Konkan Divisional Board', 'कोकण विभागीय मंडळ', 'कोंकण विभागीय बोर्ड', 'Konkan'],
    ];

    public function up(): void
    {
        Schema::create('divisions', function (Blueprint $t) {
            $t->id();
            $t->string('code', 10)->unique();
            $t->string('name');
            $t->string('name_mr')->nullable();
            $t->string('name_hi')->nullable();
            $t->string('short_name', 60);
            $t->text('address')->nullable();
            $t->string('email', 150)->nullable();
            $t->string('phone', 40)->nullable();
            $t->string('website', 200)->nullable();
            $t->boolean('is_active')->default(true);
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });
        $now = now();
        foreach (self::DIVISIONS as $i => [$code, $name, $mr, $hi, $short]) {
            DB::table('divisions')->insert(['code' => $code, 'name' => $name, 'name_mr' => $mr, 'name_hi' => $hi, 'short_name' => $short,
                'is_active' => true, 'sort' => $i + 1, 'created_at' => $now, 'updated_at' => $now]);
        }
        $home = DB::table('divisions')->where('code', '3')->value('id');

        Schema::table('institutes', function (Blueprint $t) {
            $t->foreignId('division_id')->nullable()->after('board_id')->constrained()->nullOnDelete();
        });
        DB::table('institutes')->whereNull('division_id')->update(['division_id' => $home]);

        // A board officer with a division sees only that division; without one, the whole state.
        Schema::table('users', function (Blueprint $t) {
            $t->foreignId('division_id')->nullable()->after('board_id')->constrained()->nullOnDelete();
        });
        DB::table('users')->where('role', 'board')->whereNull('division_id')->where('is_demo', false)->update(['division_id' => $home]);

        // An exam can be for one division or (division_id null) for all.
        Schema::table('exams', function (Blueprint $t) {
            $t->foreignId('division_id')->nullable()->after('board_id')->constrained()->nullOnDelete();
        });
        // Exams created so far were made by this division's office.
        DB::table('exams')->whereNull('division_id')->update(['division_id' => $home]);
    }

    public function down(): void
    {
        foreach (['exams', 'users', 'institutes'] as $table) {
            Schema::table($table, fn (Blueprint $t) => $t->dropConstrainedForeignId('division_id'));
        }
        Schema::dropIfExists('divisions');
    }
};
