<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Learning module: question bank, memory tips, study material, practice and
 * scheduled tests (with proctoring), and certificates.
 */
return new class extends Migration
{
    public function up(): void
    {
        // A teacher record can have a portal login (role "teacher").
        Schema::table('teachers', function (Blueprint $t) {
            $t->foreignId('user_id')->nullable()->after('institute_id')->constrained()->nullOnDelete();
        });

        Schema::create('topics', function (Blueprint $t) {
            $t->id();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->string('name', 150);
            $t->string('name_mr', 150)->nullable();
            $t->string('name_hi', 150)->nullable();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
            $t->index(['subject_id', 'sort']);
        });

        Schema::create('questions', function (Blueprint $t) {
            $t->id();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
            $t->string('type', 12); // single | multi | true_false | fill_blank
            $t->text('text');
            $t->text('explanation')->nullable();
            $t->string('difficulty', 8)->default('medium'); // easy | medium | hard
            $t->string('status', 10)->default('approved'); // pending | approved | rejected
            $t->string('source', 10)->default('teacher'); // seed | teacher | student | ai
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('institute_id')->nullable()->constrained()->nullOnDelete(); // who should review a student's submission
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->string('review_note', 300)->nullable();
            $t->timestamps();
            $t->index(['subject_id', 'status', 'difficulty']);
        });

        Schema::create('question_options', function (Blueprint $t) {
            $t->id();
            $t->foreignId('question_id')->constrained()->cascadeOnDelete();
            $t->string('text', 500);
            $t->boolean('is_correct')->default(false);
            $t->unsignedTinyInteger('sort')->default(0);
        });

        // Short ways to remember an answer — from teachers or students (students' need review).
        Schema::create('memory_tips', function (Blueprint $t) {
            $t->id();
            $t->foreignId('question_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('topic_id')->nullable()->constrained()->cascadeOnDelete();
            $t->text('text');
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('institute_id')->nullable()->constrained()->nullOnDelete();
            $t->string('status', 10)->default('approved');
            $t->unsignedInteger('likes')->default(0);
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('memory_tip_likes', function (Blueprint $t) {
            $t->foreignId('memory_tip_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->primary(['memory_tip_id', 'user_id']);
        });

        Schema::create('study_materials', function (Blueprint $t) {
            $t->id();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->foreignId('topic_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title', 200);
            $t->text('description')->nullable();
            $t->longText('body')->nullable();
            $t->string('file_path')->nullable();
            $t->string('file_name')->nullable();
            $t->string('link_url')->nullable();
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('student_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('institute_id')->nullable()->constrained()->nullOnDelete();
            $t->string('status', 10)->default('approved');
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->string('review_note', 300)->nullable();
            $t->unsignedInteger('views')->default(0);
            $t->timestamps();
            $t->index(['subject_id', 'status']);
        });

        // A test scheduled by a teacher (unit test / class test).
        Schema::create('quizzes', function (Blueprint $t) {
            $t->id();
            $t->string('title', 200);
            $t->text('instructions')->nullable();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->foreignId('institute_id')->constrained()->cascadeOnDelete();
            $t->foreignId('stream_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->json('topic_ids')->nullable();
            $t->json('types')->nullable();
            $t->string('difficulty', 8)->default('mixed');
            $t->unsignedSmallInteger('question_count')->default(20);
            $t->boolean('fixed_questions')->default(false); // true = use quiz_questions list
            $t->unsignedSmallInteger('duration_minutes')->default(30);
            $t->dateTime('starts_at');
            $t->dateTime('ends_at');
            $t->decimal('marks_per_question', 5, 2)->default(1);
            $t->decimal('negative_marks', 5, 2)->default(0);
            $t->unsignedTinyInteger('pass_percent')->default(35);
            $t->unsignedTinyInteger('max_warnings')->default(1); // leaving the page more than this ends the test
            $t->boolean('show_answers_after')->default(true);
            $t->string('certificate_template', 20)->nullable();
            $t->string('status', 10)->default('draft'); // draft | published
            $t->timestamps();
        });

        Schema::create('quiz_questions', function (Blueprint $t) {
            $t->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $t->foreignId('question_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->primary(['quiz_id', 'question_id']);
        });

        // One sitting: a self-practice set (quiz_id null) or a scheduled test.
        Schema::create('attempts', function (Blueprint $t) {
            $t->id();
            $t->foreignId('quiz_id')->nullable()->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->string('mode', 10); // practice | test
            $t->json('config')->nullable();
            $t->dateTime('started_at');
            $t->dateTime('deadline_at')->nullable();
            $t->dateTime('submitted_at')->nullable();
            $t->dateTime('last_seen_at')->nullable();
            $t->string('status', 14)->default('in_progress'); // in_progress | submitted | timed_out | terminated
            $t->string('end_reason', 120)->nullable();
            $t->unsignedTinyInteger('warnings')->default(0);
            $t->decimal('score', 7, 2)->default(0);
            $t->decimal('max_score', 7, 2)->default(0);
            $t->unsignedSmallInteger('correct')->default(0);
            $t->unsignedSmallInteger('wrong')->default(0);
            $t->unsignedSmallInteger('skipped')->default(0);
            $t->text('ai_feedback')->nullable();
            $t->string('ai_source', 10)->nullable();
            $t->timestamps();
            $t->index(['student_id', 'created_at']);
            $t->index(['quiz_id', 'status']);
        });

        Schema::create('attempt_answers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('attempt_id')->constrained()->cascadeOnDelete();
            $t->foreignId('question_id')->constrained()->cascadeOnDelete();
            $t->unsignedSmallInteger('sort')->default(0);
            $t->json('shown_options')->nullable(); // option ids, in the order shown
            $t->json('answer')->nullable(); // option ids, or ["typed text"]
            $t->boolean('is_correct')->nullable();
            $t->decimal('marks', 5, 2)->default(0);
            $t->unsignedInteger('seconds')->default(0);
            $t->unique(['attempt_id', 'question_id']);
        });

        Schema::create('certificates', function (Blueprint $t) {
            $t->id();
            $t->string('serial', 30)->unique();
            $t->foreignId('quiz_id')->constrained()->cascadeOnDelete();
            $t->foreignId('attempt_id')->constrained()->cascadeOnDelete();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->string('template', 20);
            $t->foreignId('issued_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
            $t->unique(['quiz_id', 'student_id']);
        });
    }

    public function down(): void
    {
        foreach (['certificates', 'attempt_answers', 'attempts', 'quiz_questions', 'quizzes', 'study_materials', 'memory_tip_likes', 'memory_tips', 'question_options', 'questions', 'topics'] as $table) {
            Schema::dropIfExists($table);
        }
        Schema::table('teachers', function (Blueprint $t) {
            $t->dropConstrainedForeignId('user_id');
        });
    }
};
