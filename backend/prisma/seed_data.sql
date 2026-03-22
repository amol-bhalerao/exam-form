-- ==============================================================================
-- HSC EXAM FORM - DATABASE SEED SCRIPT
-- ==============================================================================
-- This script seeds the HSC Exam Form database with:
-- - Test user roles
-- - Test users (superadmin, board, institute1, student1)
-- - Demo institutes
-- - Streams and subjects
-- - Sample exam for testing
-- ==============================================================================

-- ==============================================================================
-- PART 1: INSERT ROLES
-- ==============================================================================

INSERT INTO `roles` (`name`) VALUES 
    ('SUPER_ADMIN'),
    ('BOARD'),
    ('INSTITUTE'),
    ('STUDENT')
ON DUPLICATE KEY UPDATE `name`=VALUES(`name`);

-- ==============================================================================
-- PART 2: INSERT DEMO INSTITUTES
-- ==============================================================================

-- Demo Institute 1 (APPROVED)
INSERT IGNORE INTO `institutes` 
    (`collegeNo`, `udiseNo`, `name`, `code`, `address`, `district`, `taluka`, 
     `city`, `pincode`, `contactPerson`, `contactEmail`, `contactMobile`, 
     `status`, `acceptingApplications`, `examApplicationLimit`)
VALUES 
    ('COLL001', '27280100123', 'Demo Junior College 1', 'INST001', 
     'Demo Address, Maharashtra', 'Pune', 'Pune City', 'Pune', '411001',
     'Principal', 'inst1@example.com', '9999999999', 'APPROVED', true, 100);

-- Demo Institute 2 (PENDING)
INSERT IGNORE INTO `institutes` 
    (`collegeNo`, `udiseNo`, `name`, `code`, `address`, `district`, `taluka`,
     `city`, `pincode`, `contactPerson`, `contactEmail`, `contactMobile`,
     `status`, `acceptingApplications`)
VALUES 
    ('COLL002', '27280100124', 'Demo Junior College 2 (Pending)', 'INST002',
     'Pending address', 'Pune', 'Pune City', 'Pune', '411001',
     'Principal', 'inst2@example.com', '', 'PENDING', true);

-- ==============================================================================
-- PART 3: INSERT TEST USERS
-- ==============================================================================
-- Password: Password@123
-- Hash: $2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe

INSERT IGNORE INTO `users` 
    (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `mobile`, `status`)
SELECT 
    r.`id`, NULL, 'superadmin', 
    '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
    'superadmin@example.com', '', 'ACTIVE'
FROM `roles` r WHERE r.`name` = 'SUPER_ADMIN' LIMIT 1;

INSERT IGNORE INTO `users`
    (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `mobile`, `status`)
SELECT
    r.`id`, NULL, 'board',
    '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
    'board@example.com', '', 'ACTIVE'
FROM `roles` r WHERE r.`name` = 'BOARD' LIMIT 1;

INSERT IGNORE INTO `users`
    (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `mobile`, `status`)
SELECT
    r.`id`, i.`id`, 'institute1',
    '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
    'institute1@example.com', '9999999999', 'ACTIVE'
FROM `roles` r, `institutes` i
WHERE r.`name` = 'INSTITUTE' AND i.`code` = 'INST001' LIMIT 1;

INSERT IGNORE INTO `users`
    (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `mobile`, `status`)
SELECT
    r.`id`, i.`id`, 'student1',
    '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
    'student1@example.com', '9988776655', 'ACTIVE'
FROM `roles` r, `institutes` i
WHERE r.`name` = 'STUDENT' AND i.`code` = 'INST001' LIMIT 1;

-- ==============================================================================
-- PART 4: INSERT STREAMS
-- ==============================================================================

INSERT IGNORE INTO `streams` (`name`) VALUES 
    ('Science'),
    ('Commerce'),
    ('Arts');

-- ==============================================================================
-- PART 5: INSERT SUBJECTS
-- ==============================================================================

-- Science Stream Subjects
INSERT IGNORE INTO `subjects` (`name`, `code`, `category`) VALUES
    ('Mathematics', 'MAT', 'Science'),
    ('Physics', 'PHY', 'Science'),
    ('Chemistry', 'CHE', 'Science'),
    ('Biology', 'BIO', 'Science'),
    ('English', 'ENG', 'Language'),
    ('Marathi', 'MAR', 'Language'),
    ('information Technology', 'CS', 'Science'),
    ('Economics', 'ECO', 'Science');

-- Commerce Stream Subjects
INSERT IGNORE INTO `subjects` (`name`, `code`, `category`) VALUES
    ('Accountancy', 'ACC', 'Commerce'),
    ('Business Studies', 'BUS', 'Commerce'),
    ('Economics', 'ECO', 'Commerce'),
    ('Statistics', 'STA', 'Commerce'),
    ('English', 'ENG', 'Language'),
    ('Marathi', 'MAR', 'Language');

-- Arts Stream Subjects
INSERT IGNORE INTO `subjects` (`name`, `code`, `category`) VALUES
    ('History', 'HIS', 'Arts'),
    ('Geography', 'GEO', 'Arts'),
    ('Political Science', 'POL', 'Arts'),
    ('Economics', 'ECO', 'Arts'),
    ('Psychology', 'PSY', 'Arts'),
    ('English', 'ENG', 'Language'),
    ('Marathi', 'MAR', 'Language');

-- ==============================================================================
-- PART 6: INSERT STREAM-SUBJECT MAPPINGS
-- ==============================================================================

-- Science Stream Subject Mapping
INSERT IGNORE INTO `stream_subjects` (`streamId`, `subjectId`)
SELECT s.`id`, sub.`id` FROM `streams` s, `subjects` sub
WHERE s.`name` = 'Science' AND sub.`code` IN ('MAT', 'PHY', 'CHE', 'BIO', 'ENG', 'MAR', 'CS', 'ECO');

-- Commerce Stream Subject Mapping  
INSERT IGNORE INTO `stream_subjects` (`streamId`, `subjectId`)
SELECT s.`id`, sub.`id` FROM `streams` s, `subjects` sub
WHERE s.`name` = 'Commerce' AND (
    (sub.`code` IN ('ACC', 'BUS') AND sub.`category` = 'Commerce') OR
    sub.`code` IN ('ENG', 'MAR', 'ECO', 'STA')
);

-- Arts Stream Subject Mapping
INSERT IGNORE INTO `stream_subjects` (`streamId`, `subjectId`)
SELECT s.`id`, sub.`id` FROM `streams` s, `subjects` sub
WHERE s.`name` = 'Arts' AND (sub.`code` IN ('HIS', 'GEO', 'POL', 'ECO', 'PSY', 'ENG', 'MAR'));

-- ==============================================================================
-- PART 7: INSTITUTE-STREAM-SUBJECT MAPPINGS (Demo Institute 1)
-- ==============================================================================

INSERT IGNORE INTO `institute_stream_subjects` (`instituteId`, `streamId`, `subjectId`)
SELECT i.`id`, s.`id`, sub.`id` FROM 
    `institutes` i, `streams` s, `subjects` sub
WHERE i.`code` = 'INST001' AND s.`name` IN ('Science', 'Commerce')
AND (
    (s.`name` = 'Science' AND sub.`code` IN ('MAT', 'PHY', 'CHE', 'BIO', 'ENG', 'MAR', 'CS', 'ECO')) OR
    (s.`name` = 'Commerce' AND sub.`code` IN ('ACC', 'BUS', 'ENG', 'MAR', 'ECO', 'STA'))
);

-- ==============================================================================
-- PART 8: CREATE SAMPLE STUDENT PROFILE
-- ==============================================================================

-- Get the student1 user and create student profile
INSERT IGNORE INTO `students` 
    (`instituteId`, `userId`, `firstName`, `middleName`, `lastName`, `motherName`,
     `dob`, `gender`, `aadhaar`, `address`, `pinCode`, `mobile`, `streamCode`)
SELECT 
    i.`id`, u.`id`, 'Demo', 'Test', 'Student', 'Demo Mother',
    '2006-01-15', 'Male', '123456789012', 'Demo Address, Pune', '411001', '9988776655', 'Science'
FROM `institutes` i, `users` u
WHERE i.`code` = 'INST001' AND u.`username` = 'student1'
AND NOT EXISTS (
    SELECT 1 FROM `students` s WHERE s.`userId` = u.`id`
);

-- ==============================================================================
-- PART 9: CREATE SAMPLE EXAM
-- ==============================================================================

-- HSC Science Exam 2026
INSERT IGNORE INTO `exams`
    (`name`, `academicYear`, `session`, `streamId`, `applicationOpen`, `applicationClose`,
     `lateFeeClose`, `instructions`, `createdByUserId`)
SELECT
    'HSC Science Stream 2026', '2025-2026', 'March 2026', s.`id`,
    '2026-01-01 00:00:00', '2026-03-15 23:59:59', '2026-03-25 23:59:59',
    'Instructions for HSC examination 2026',
    (SELECT u.`id` FROM `users` u WHERE u.`username` = 'superadmin' LIMIT 1)
FROM `streams` s
WHERE s.`name` = 'Science'
AND NOT EXISTS (
    SELECT 1 FROM `exams` e WHERE e.`name` LIKE 'HSC Science%'
);

-- HSC Commerce Exam 2026
INSERT IGNORE INTO `exams`
    (`name`, `academicYear`, `session`, `streamId`, `applicationOpen`, `applicationClose`,
     `lateFeeClose`, `instructions`, `createdByUserId`)
SELECT
    'HSC Commerce Stream 2026', '2025-2026', 'March 2026', s.`id`,
    '2026-01-01 00:00:00', '2026-03-15 23:59:59', '2026-03-25 23:59:59',
    'Instructions for HSC examination 2026',
    (SELECT u.`id` FROM `users` u WHERE u.`username` = 'superadmin' LIMIT 1)
FROM `streams` s
WHERE s.`name` = 'Commerce'
AND NOT EXISTS (
    SELECT 1 FROM `exams` e WHERE e.`name` LIKE 'HSC Commerce%'
);

-- ==============================================================================
-- PART 10: SUMMARY - DISPLAY SEEDED DATA
-- ==============================================================================

SELECT '✓ DATABASE SEED COMPLETE' as Status;
SELECT COUNT(*) as RolesCount FROM `roles`;
SELECT COUNT(*) as UsersCount FROM `users`;
SELECT COUNT(*) as InstitutesCount FROM `institutes`;
SELECT COUNT(*) as StreamsCount FROM `streams`;
SELECT COUNT(*) as SubjectsCount FROM `subjects`;
SELECT COUNT(*) as ExamsCount FROM `exams`;
SELECT COUNT(*) as StudentsCount FROM `students`;

-- ==============================================================================
-- TEST CREDENTIALS (all with password: Password@123)
-- ==============================================================================
-- Superadmin: superadmin
-- Board Admin: board
-- Institute Admin: institute1 (linked to Demo Junior College 1)
-- Student: student1 (linked to Demo Junior College 1)
-- ==============================================================================
