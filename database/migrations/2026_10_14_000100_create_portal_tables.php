<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('boards', function (Blueprint $t) {
            $t->id();
            $t->string('code', 10)->unique(); // HSC | SSC
            $t->string('name');
            $t->string('name_mr')->nullable();
            $t->string('name_hi')->nullable();
            $t->string('short_name', 40);
            $t->boolean('has_streams')->default(true);
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
        });

        Schema::create('institutes', function (Blueprint $t) {
            $t->id();
            $t->foreignId('board_id')->constrained();
            $t->string('college_no', 20)->index();
            $t->string('udise_no', 20)->nullable()->index();
            $t->string('name');
            $t->string('district', 80)->nullable()->index();
            $t->string('taluka', 80)->nullable();
            $t->text('address')->nullable();
            $t->string('pincode', 10)->nullable();
            $t->string('principal_name', 120)->nullable();
            $t->string('contact_email', 150)->nullable();
            $t->string('contact_mobile', 15)->nullable();
            $t->boolean('is_active')->default(true);
            $t->boolean('accepting_forms')->default(true);
            $t->timestamps();
            $t->unique(['board_id', 'college_no']);
        });

        Schema::create('streams', function (Blueprint $t) {
            $t->id();
            $t->foreignId('board_id')->constrained();
            $t->string('code', 10); // SCI, ART, COM, VOC, TEC, GEN
            $t->string('name');
            $t->string('name_mr')->nullable();
            $t->string('name_hi')->nullable();
            $t->string('gr_key', 20)->nullable(); // SCIENCE | ARTS | COMMERCE | VOCATIONAL (2019 GR scheme)
            $t->unsignedTinyInteger('number')->nullable(); // code printed on the form (1 Science, 2 Arts ...)
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
            $t->unique(['board_id', 'code']);
        });

        Schema::create('institute_stream', function (Blueprint $t) {
            $t->foreignId('institute_id')->constrained()->cascadeOnDelete();
            $t->foreignId('stream_id')->constrained()->cascadeOnDelete();
            $t->primary(['institute_id', 'stream_id']);
        });

        Schema::create('subjects', function (Blueprint $t) {
            $t->id();
            $t->foreignId('board_id')->constrained();
            $t->string('code', 20);
            $t->string('name');
            $t->string('name_mr')->nullable();
            $t->string('name_hi')->nullable();
            // COMPULSORY, MIL, MFL, CLASSICAL, IT, ELECTIVE, BIFOCAL, VOCATIONAL, FOUNDATION, LANGUAGE, CORE
            $t->string('kind', 20)->default('ELECTIVE');
            $t->unsignedSmallInteger('theory_marks')->nullable();
            $t->unsignedSmallInteger('internal_marks')->nullable();
            $t->unsignedTinyInteger('papers')->default(1);
            $t->boolean('graded')->default(false);
            $t->boolean('is_active')->default(true);
            $t->unsignedSmallInteger('sort')->default(0);
            $t->timestamps();
            $t->unique(['board_id', 'code']);
        });

        // Board-level list of subjects allowed for a stream (fallback when an institute has not set its own).
        Schema::create('stream_subject', function (Blueprint $t) {
            $t->foreignId('stream_id')->constrained()->cascadeOnDelete();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->primary(['stream_id', 'subject_id']);
        });

        // Subjects an institute actually teaches, per stream.
        Schema::create('institute_subjects', function (Blueprint $t) {
            $t->id();
            $t->foreignId('institute_id')->constrained()->cascadeOnDelete();
            $t->foreignId('stream_id')->constrained()->cascadeOnDelete();
            $t->foreignId('subject_id')->constrained()->cascadeOnDelete();
            $t->string('answer_language', 10)->nullable();
            $t->timestamps();
            $t->unique(['institute_id', 'stream_id', 'subject_id']);
        });

        Schema::create('exams', function (Blueprint $t) {
            $t->id();
            $t->foreignId('board_id')->constrained();
            $t->string('code', 20)->unique();
            $t->string('name');
            $t->string('session', 20); // FEB-MAR | JUL-AUG
            $t->unsignedSmallInteger('year');
            $t->string('academic_year', 9);
            $t->foreignId('stream_id')->nullable()->constrained(); // null = all streams
            $t->json('candidate_types'); // which candidate types may apply
            $t->dateTime('opens_at');
            $t->dateTime('closes_at');
            $t->dateTime('late_closes_at')->nullable();
            $t->date('exam_starts_on')->nullable();
            $t->date('exam_ends_on')->nullable();
            $t->text('instructions')->nullable();
            $t->boolean('is_published')->default(false);
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('exam_fees', function (Blueprint $t) {
            $t->id();
            $t->foreignId('exam_id')->constrained()->cascadeOnDelete();
            $t->string('candidate_type', 20);
            $t->unsignedInteger('fee'); // rupees
            $t->unsignedInteger('late_fee')->default(0); // extra rupees after closes_at, until late_closes_at
            $t->unique(['exam_id', 'candidate_type']);
        });

        // A student profile. One Google account (owner) can manage several students.
        Schema::create('students', function (Blueprint $t) {
            $t->id();
            $t->foreignId('owner_id')->constrained('users')->cascadeOnDelete();
            $t->foreignId('board_id')->constrained();
            $t->foreignId('institute_id')->nullable()->constrained()->nullOnDelete();
            $t->foreignId('stream_id')->nullable()->constrained()->nullOnDelete();
            $t->string('surname', 80);
            $t->string('first_name', 80);
            $t->string('middle_name', 80)->nullable();
            $t->string('mother_name', 80)->nullable();
            $t->string('gender', 10)->nullable();
            $t->date('dob')->nullable();
            $t->text('aadhaar')->nullable(); // encrypted
            $t->string('aadhaar_last4', 4)->nullable();
            $t->string('apaar_id', 20)->nullable();
            $t->string('pen_id', 30)->nullable(); // UDISE+ PEN
            $t->string('saral_id', 30)->nullable();
            $t->string('mobile', 15)->nullable();
            $t->string('email', 150)->nullable();
            $t->text('address')->nullable();
            $t->string('village', 80)->nullable();
            $t->string('taluka', 80)->nullable();
            $t->string('district', 80)->nullable();
            $t->string('pincode', 10)->nullable();
            $t->string('category', 10)->nullable();
            $t->string('minority_religion', 20)->nullable();
            $t->string('medium', 20)->nullable();
            $t->string('divyang', 30)->nullable(); // null/NONE or type
            $t->boolean('ssc_from_maharashtra')->nullable();
            $t->boolean('eligibility_cert_issued')->nullable();
            $t->string('eligibility_cert_no', 50)->nullable();
            $t->string('photo_path')->nullable();
            $t->string('signature_path')->nullable();
            // Fee reimbursement (drought-prone areas)
            $t->string('revenue_circle_village', 150)->nullable();
            $t->string('bank_account_no', 30)->nullable();
            $t->string('bank_ifsc', 15)->nullable();
            $t->string('bank_account_holder', 20)->nullable(); // OWN | FATHER | MOTHER | GUARDIAN
            $t->timestamps();
            $t->index(['surname', 'first_name']);
        });

        Schema::create('previous_exams', function (Blueprint $t) {
            $t->id();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->string('exam', 10); // SSC | XI | HSC
            $t->string('seat_no', 30)->nullable();
            $t->string('month', 3)->nullable();
            $t->unsignedSmallInteger('year')->nullable();
            $t->decimal('percentage', 5, 2)->nullable();
            $t->string('board_or_college', 150)->nullable();
        });

        Schema::create('applications', function (Blueprint $t) {
            $t->id();
            $t->string('application_no', 30)->unique();
            $t->foreignId('exam_id')->constrained();
            $t->foreignId('student_id')->constrained()->cascadeOnDelete();
            $t->foreignId('institute_id')->constrained();
            $t->foreignId('board_id')->constrained();
            $t->foreignId('stream_id')->nullable()->constrained();
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            // regular | repeater | improvement | isolated | private
            $t->string('candidate_type', 20);
            $t->string('exemption_status', 20)->default('NON_EXEMPTED');
            $t->unsignedTinyInteger('exemptions_claimed')->default(0);
            $t->string('subject_group', 20)->nullable(); // GENERAL | BIFOCAL | IT | VOCATIONAL
            $t->boolean('is_foreigner')->default(false);
            $t->string('enrolment_cert_no', 50)->nullable(); // private candidates
            $t->string('last_exam_month', 3)->nullable();
            $t->unsignedSmallInteger('last_exam_year')->nullable();
            $t->string('last_exam_seat_no', 30)->nullable();
            // draft | submitted | returned | verified | approved | board_returned | rejected
            $t->string('status', 20)->default('draft')->index();
            $t->unsignedInteger('fee_amount')->default(0);
            $t->boolean('late_fee_applied')->default(false);
            $t->timestamp('paid_at')->nullable();
            $t->timestamp('submitted_at')->nullable();
            $t->timestamp('verified_at')->nullable();
            $t->timestamp('decided_at')->nullable();
            $t->text('institute_note')->nullable();
            $t->text('board_note')->nullable();
            $t->string('institute_seq', 40)->nullable()->unique();
            $t->string('board_seq', 40)->nullable()->unique();
            $t->string('centre_no', 20)->nullable();
            $t->string('index_no', 20)->nullable();
            $t->json('snapshot')->nullable(); // frozen student/institute details at submission
            $t->timestamps();
            $t->index(['institute_id', 'status']);
            $t->index(['exam_id', 'status']);
            $t->unique(['exam_id', 'student_id']);
        });

        Schema::create('application_subjects', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained()->cascadeOnDelete();
            $t->foreignId('subject_id')->constrained();
            $t->string('answer_language', 10)->nullable();
            $t->boolean('is_exempted')->default(false);
            $t->unsignedTinyInteger('sort')->default(0);
            $t->unique(['application_id', 'subject_id']);
        });

        Schema::create('application_events', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action', 40);
            $t->string('from_status', 20)->nullable();
            $t->string('to_status', 20)->nullable();
            $t->text('note')->nullable();
            $t->json('changes')->nullable();
            $t->timestamp('created_at')->useCurrent();
        });

        Schema::create('payments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('application_id')->constrained()->cascadeOnDelete();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('gateway', 20)->default('cashfree');
            $t->string('order_id', 50)->unique();
            $t->string('payment_session_id')->nullable();
            $t->unsignedInteger('amount');
            $t->string('status', 20)->default('created'); // created | paid | failed | expired
            $t->string('gateway_payment_id', 80)->nullable();
            $t->string('method', 40)->nullable();
            $t->json('payload')->nullable();
            $t->timestamp('paid_at')->nullable();
            $t->timestamps();
        });

        Schema::create('teachers', function (Blueprint $t) {
            $t->id();
            $t->foreignId('institute_id')->constrained()->cascadeOnDelete();
            $t->string('full_name', 150);
            $t->string('gender', 10)->nullable();
            $t->date('dob')->nullable();
            $t->string('mobile', 15)->nullable();
            $t->string('email', 150)->nullable();
            $t->string('qualification', 150)->nullable();
            $t->foreignId('subject_id')->nullable()->constrained()->nullOnDelete();
            $t->string('designation', 80)->nullable();
            $t->string('appointment_type', 20)->nullable(); // PERMANENT | CONTRACT | CHB
            $t->date('joined_on')->nullable();
            $t->unsignedTinyInteger('experience_years')->nullable();
            $t->json('duty_roles')->nullable(); // examiner, moderator, chief_moderator, paper_setter, supervisor, centre_conductor
            $t->unsignedTinyInteger('examiner_years')->nullable();
            $t->string('last_appointment_no', 60)->nullable();
            $t->boolean('available_for_duty')->default(true);
            $t->string('board_status', 20)->default('pending'); // pending | approved | rejected
            $t->text('board_note')->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('reviewed_at')->nullable();
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });

        // ---------- Website / CMS ----------
        Schema::create('pages', function (Blueprint $t) {
            $t->id();
            $t->string('title');
            $t->string('slug')->unique();
            $t->string('summary', 300)->nullable();
            $t->longText('body')->nullable();
            $t->string('layout', 20)->default('default'); // default | wide | landing
            $t->string('hero_image')->nullable();
            $t->string('seo_title')->nullable();
            $t->string('seo_description', 300)->nullable();
            $t->string('seo_keywords')->nullable();
            $t->boolean('noindex')->default(false);
            $t->string('status', 10)->default('draft'); // draft | published
            $t->boolean('in_header')->default(false);
            $t->boolean('in_footer')->default(false);
            $t->unsignedSmallInteger('menu_order')->default(0);
            $t->foreignId('parent_id')->nullable()->constrained('pages')->nullOnDelete();
            $t->timestamp('published_at')->nullable();
            $t->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('notices', function (Blueprint $t) {
            $t->id();
            $t->foreignId('board_id')->nullable()->constrained()->nullOnDelete();
            $t->string('title');
            $t->string('slug')->unique();
            $t->string('category', 20)->default('notice'); // notice | circular | news | event | timetable | result
            $t->longText('body')->nullable();
            $t->string('attachment_path')->nullable();
            $t->string('link_url')->nullable();
            $t->boolean('is_pinned')->default(false);
            $t->boolean('in_ticker')->default(false);
            $t->timestamp('published_at')->nullable();
            $t->timestamp('expires_at')->nullable();
            $t->string('status', 10)->default('published');
            $t->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('settings', function (Blueprint $t) {
            $t->string('key', 80)->primary();
            $t->longText('value')->nullable();
            $t->timestamps();
        });

        Schema::create('media', function (Blueprint $t) {
            $t->id();
            $t->string('path');
            $t->string('original_name');
            $t->string('mime', 100)->nullable();
            $t->unsignedInteger('size')->default(0);
            $t->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamps();
        });

        Schema::create('audit_logs', function (Blueprint $t) {
            $t->id();
            $t->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $t->string('action', 60);
            $t->string('subject_type', 60)->nullable();
            $t->unsignedBigInteger('subject_id')->nullable();
            $t->json('details')->nullable();
            $t->string('ip', 45)->nullable();
            $t->timestamp('created_at')->useCurrent();
            $t->index(['subject_type', 'subject_id']);
        });
    }

    public function down(): void
    {
        foreach (['audit_logs', 'media', 'settings', 'notices', 'pages', 'teachers', 'payments', 'application_events',
            'application_subjects', 'applications', 'previous_exams', 'students', 'exam_fees', 'exams', 'institute_subjects',
            'stream_subject', 'subjects', 'institute_stream', 'streams', 'institutes', 'boards'] as $table) {
            Schema::dropIfExists($table);
        }
    }
};
