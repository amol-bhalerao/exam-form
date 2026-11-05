<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Service details colleges and the board need: Shalarth ID, approval, second subject, medium, retirement. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teachers', function (Blueprint $t) {
            $t->string('shalarth_id', 30)->nullable()->after('mobile');            // Maharashtra payroll ID
            $t->string('category', 10)->nullable()->after('gender');
            $t->foreignId('second_subject_id')->nullable()->after('subject_id')->constrained('subjects')->nullOnDelete();
            $t->string('medium', 5)->nullable()->after('second_subject_id');       // medium the teacher teaches in
            $t->string('teaches_classes', 30)->nullable()->after('medium');        // e.g. XI, XII
            $t->string('approval_no', 60)->nullable()->after('joined_on');         // education officer's approval (मान्यता)
            $t->date('approval_date')->nullable()->after('approval_no');
            $t->unsignedTinyInteger('retirement_age')->nullable()->after('approval_date'); // only if different from the rule
        });
    }

    public function down(): void
    {
        Schema::table('teachers', function (Blueprint $t) {
            $t->dropConstrainedForeignId('second_subject_id');
            $t->dropColumn(['shalarth_id', 'category', 'medium', 'teaches_classes', 'approval_no', 'approval_date', 'retirement_age']);
        });
    }
};
