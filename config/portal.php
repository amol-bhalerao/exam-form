<?php

return [
    /*
     | Unlisted sign-in addresses for staff. They are not linked anywhere on
     | the public site; share them privately with each institute / board.
     */
    'login_paths' => [
        'super_admin' => env('ADMIN_LOGIN_PATH', 'control-room'),
        'board' => env('BOARD_LOGIN_PATH', 'board-desk'),
        'institute' => env('INSTITUTE_LOGIN_PATH', 'college-desk'),
        'teacher' => env('TEACHER_LOGIN_PATH', 'teacher-desk'),
    ],

    'cashfree' => [
        'app_id' => env('CASHFREE_APP_ID'),
        'secret' => env('CASHFREE_SECRET_KEY'),
        'env' => env('CASHFREE_ENV', 'sandbox'), // sandbox | production
        'api_version' => '2023-08-01',
        // Sandbox (test) keys on the live site would mark forms paid without real money.
        // They are refused when APP_ENV=production unless this is set true for a short trial run.
        'allow_sandbox_on_live' => (bool) env('CASHFREE_ALLOW_SANDBOX_ON_LIVE', false),
    ],

    // Allows "Simulate payment" when Cashfree keys are missing. Never true in production.
    // Hard-off on the live site (APP_ENV=production) whatever .env says.
    'allow_test_payments' => env('APP_ENV') !== 'production' && (bool) env('ALLOW_TEST_PAYMENTS', env('APP_ENV') === 'local'),

    // Allows a password-less demo student sign-in for local testing only.
    'allow_demo_student_login' => env('APP_ENV') !== 'production' && (bool) env('ALLOW_DEMO_STUDENT_LOGIN', env('APP_ENV') === 'local'),

    'locales' => ['mr' => 'मराठी', 'en' => 'English', 'hi' => 'हिंदी'],
];
