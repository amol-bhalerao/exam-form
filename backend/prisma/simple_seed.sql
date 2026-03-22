-- ==============================================================================
-- SIMPLE DATABASE SEED - Direct Values
-- ==============================================================================

-- Insert Roles
INSERT INTO `roles` (`id`, `name`, `createdAt`) VALUES 
(1, 'SUPER_ADMIN', NOW()),
(2, 'BOARD', NOW()),
(3, 'INSTITUTE', NOW()),
(4, 'STUDENT', NOW());

-- Insert Institutes
INSERT INTO `institutes` 
(`collegeNo`, `udiseNo`, `name`, `code`, `address`, `district`, `taluka`, `city`, `pincode`, 
 `contactPerson`, `contactEmail`, `contactMobile`, `status`, `acceptingApplications`, `examApplicationLimit`, `createdAt`)
VALUES 
('COLL001', '27280100123', 'Demo Junior College 1', 'INST001', 'Demo Address, Maharashtra', 
 'Pune', 'Pune City', 'Pune', '411001', 'Principal', 'inst1@example.com', '9999999999', 
 'APPROVED', 1, 100, NOW()),
('COLL002', '27280100124', 'Demo Junior College 2 (Pending)', 'INST002', 'Pending address',
 'Pune', 'Pune City', 'Pune', '411001', 'Principal', 'inst2@example.com', '',
 'PENDING', 1, NULL, NOW());

-- Insert Test Users
-- Password: Password@123 (Bcrypt hash)
INSERT INTO `users` 
(`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `mobile`, `status`, `createdAt`)
VALUES 
(1, NULL, 'superadmin', '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe', 
 'superadmin@example.com', '', 'ACTIVE', NOW()),
(2, NULL, 'board', '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
 'board@example.com', '', 'ACTIVE', NOW()),
(3, 1, 'institute1', '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
 'institute1@example.com', '9999999999', 'ACTIVE', NOW()),
(4, 1, 'student1', '$2a$10$k4LEQUf6jh5L5PqChhY0m.0BpGVXKHPbP6qRV1C4s1F6HkGMlyHqe',
 'student1@example.com', '9988776655', 'ACTIVE', NOW());

-- Insert Streams
INSERT INTO `streams` (`name`) VALUES 
('Science'),
('Commerce'),
('Arts');

-- Insert Subjects for Science
INSERT INTO `subjects` (`name`, `code`, `category`) VALUES
('Mathematics', 'MAT01', 'Science'),
('Physics', 'PHY01', 'Science'),
('Chemistry', 'CHE01', 'Science'),
('Biology', 'BIO01', 'Science'),
('English', 'ENG01', 'Language'),
('Marathi', 'MAR01', 'Language'),
('Computer Science', 'CSC01', 'Science'),
('Electronics', 'ELE01', 'Science');

-- Insert Subjects for Commerce
INSERT INTO `subjects` (`name`, `code`, `category`) VALUES
('Accountancy', 'ACC01', 'Commerce'),
('Business Studies', 'BUS01', 'Commerce'),
('Economics', 'ECO01', 'Commerce'),
('Statistics', 'STA01', 'Commerce'),
('Marathi', 'MAR02', 'Language'),
('English', 'ENG02', 'Language');

-- Insert Subjects for Arts
INSERT INTO `subjects` (`name`, `code`, `category`) VALUES
('History', 'HIS01', 'Arts'),
('Geography', 'GEO01', 'Arts'),
('Political Science', 'POL01', 'Arts'),
('Psychology', 'PSY01', 'Arts'),
('English', 'ENG03', 'Language'),
('Marathi', 'MAR03', 'Language');

-- Insert Stream-Subject Mappings for Science (streams id=1, subjects id 1-8)
INSERT INTO `stream_subjects` (`streamId`, `subjectId`) VALUES
(1, 1), (1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8);

-- Insert Stream-Subject Mappings for Commerce (streams id=2, subjects id 9-14)
INSERT INTO `stream_subjects` (`streamId`, `subjectId`) VALUES
(2, 9), (2, 10), (2, 11), (2, 12), (2, 5), (2, 6);

-- Insert Stream-Subject Mappings for Arts (streams id=3, subjects id 15-20)
INSERT INTO `stream_subjects` (`streamId`, `subjectId`) VALUES
(3, 15), (3, 16), (3, 17), (3, 18), (3, 5), (3, 6);

-- Insert Institute-Stream-Subject Mappings (Institute 1 [id=1] with Science [id=1] stream)
INSERT INTO `institute_stream_subjects` (`instituteId`, `streamId`, `subjectId`) VALUES
(1, 1, 1), (1, 1, 2), (1, 1, 3), (1, 1, 4), (1, 1, 5), (1, 1, 6), (1, 1, 7), (1, 1, 8);

-- Insert Student Profile
INSERT INTO `students` 
(`instituteId`, `userId`, `firstName`, `middleName`, `lastName`, `motherName`, 
 `dob`, `gender`, `aadhaar`, `address`, `pinCode`, `mobile`, `streamCode`, `createdAt`)
VALUES 
(1, 4, 'Demo', 'Test', 'Student', 'Demo Mother', '2006-01-15', 'Male', 
 '123456789012', 'Demo Address, Pune', '411001', '9988776655', 'Science', NOW());

-- Insert Sample Exams
INSERT INTO `exams` 
(`name`, `academicYear`, `session`, `streamId`, `applicationOpen`, `applicationClose`, 
 `lateFeeClose`, `instructions`, `createdByUserId`, `createdAt`)
VALUES 
('HSC Science Stream 2026', '2025-2026', 'March 2026', 1,
 '2026-01-01 00:00:00', '2026-03-15 23:59:59', '2026-03-25 23:59:59',
 'Instructions for HSC Science examination 2026', 1, NOW()),
('HSC Commerce Stream 2026', '2025-2026', 'March 2026', 2,
 '2026-01-01 00:00:00', '2026-03-15 23:59:59', '2026-03-25 23:59:59',
 'Instructions for HSC Commerce examination 2026', 1, NOW());

-- ==============================================================================
-- VERIFICATION QUERIES
-- ==============================================================================

SELECT 'DATABASE SEED COMPLETED SUCCESSFULLY' as Status;
SELECT CONCAT('Total Roles: ', COUNT(*)) FROM roles;
SELECT CONCAT('Total Users: ', COUNT(*)) FROM users;
SELECT CONCAT('Total Institutes: ', COUNT(*)) FROM institutes;
SELECT CONCAT('Total Streams: ', COUNT(*)) FROM streams;
SELECT CONCAT('Total Subjects: ', COUNT(*)) FROM subjects;
SELECT CONCAT('Total Exams: ', COUNT(*)) FROM exams;
SELECT CONCAT('Total Students: ', COUNT(*)) FROM students;
