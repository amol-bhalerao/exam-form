-- Seed data for hsc-exam-form-db
-- Default password for all demo users below: Admin@123
-- bcrypt hash (cost 10): $2b$10$CkOixBjrxLLScm1oYR7dWOQLQADywcJBhsvbpWTS4IVWZA47IDITW

-- Use your database name (default in backend: hsc_exam_local)
USE `hsc_exam_local`;

INSERT INTO `roles` (`name`) VALUES
  ('SUPER_ADMIN'),
  ('BOARD'),
  ('INSTITUTE'),
  ('STUDENT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

INSERT INTO `streams` (`name`, `shortCode`) VALUES
  ('Science', 'SCI'),
  ('Arts', 'ART'),
  ('Commerce', 'COM'),
  ('HSC Vocational', 'VOC'),
  ('Technology Science', 'TEC')
ON DUPLICATE KEY UPDATE
  `shortCode` = COALESCE(VALUES(`shortCode`), `shortCode`);

-- Demo institute (for login testing). Full college list: import ../college-data.sql in phpMyAdmin
INSERT INTO `institutes`
  (`collegeNo`, `udiseNo`, `name`, `code`, `address`, `district`, `taluka`, `city`, `pincode`,
   `contactPerson`, `contactEmail`, `contactMobile`, `status`, `acceptingApplications`)
VALUES
  ('56.01.001', '27191109505', 'Demo Junior College 1', 'INST001',
   'Demo Address, Maharashtra', 'Chh. Sambhajinagar', 'Chh. Sambhajinagar', 'Aurangabad', '431001',
   'Principal', 'inst1@example.com', '9999999999', 'APPROVED', 1)
ON DUPLICATE KEY UPDATE
  `collegeNo` = VALUES(`collegeNo`),
  `udiseNo` = VALUES(`udiseNo`),
  `name` = VALUES(`name`),
  `status` = VALUES(`status`),
  `acceptingApplications` = VALUES(`acceptingApplications`);

INSERT INTO `subjects` (`name`, `code`, `category`) VALUES
  ('English', '1', 'Compulsory'),
  ('Physical Education', '30', 'Compulsory'),
  ('Environment Education', '31', 'Compulsory')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `category` = VALUES(`category`);

-- Demo users (password: Admin@123)
INSERT INTO `users` (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `status`, `authProvider`)
VALUES
  ((SELECT id FROM roles WHERE name = 'SUPER_ADMIN' LIMIT 1), NULL, 'superadmin',
   '$2b$10$CkOixBjrxLLScm1oYR7dWOQLQADywcJBhsvbpWTS4IVWZA47IDITW', 'superadmin@example.com', 'ACTIVE', 'local'),
  ((SELECT id FROM roles WHERE name = 'BOARD' LIMIT 1), NULL, 'board',
   '$2b$10$CkOixBjrxLLScm1oYR7dWOQLQADywcJBhsvbpWTS4IVWZA47IDITW', 'board@example.com', 'ACTIVE', 'local'),
  ((SELECT id FROM roles WHERE name = 'INSTITUTE' LIMIT 1),
   (SELECT id FROM institutes WHERE code = 'INST001' LIMIT 1), 'institute1',
   '$2b$10$CkOixBjrxLLScm1oYR7dWOQLQADywcJBhsvbpWTS4IVWZA47IDITW', 'institute1@example.com', 'ACTIVE', 'local'),
  ((SELECT id FROM roles WHERE name = 'STUDENT' LIMIT 1),
   (SELECT id FROM institutes WHERE code = 'INST001' LIMIT 1), 'student1',
   '$2b$10$CkOixBjrxLLScm1oYR7dWOQLQADywcJBhsvbpWTS4IVWZA47IDITW', 'student1@example.com', 'ACTIVE', 'local')
ON DUPLICATE KEY UPDATE
  `passwordHash` = VALUES(`passwordHash`),
  `email` = VALUES(`email`),
  `status` = 'ACTIVE',
  `authProvider` = 'local';

-- Optional: open exam window (requires board user id)
INSERT INTO `exams`
  (`name`, `academicYear`, `session`, `streamId`, `examCode`, `applicationOpen`, `applicationClose`, `createdByUserId`, `instructions`)
SELECT
  'HSC Examination 2025-26',
  '2025-26',
  'FEB-MAR',
  (SELECT id FROM streams WHERE shortCode = 'SCI' LIMIT 1),
  'EXM001',
  NOW() - INTERVAL 1 DAY,
  NOW() + INTERVAL 90 DAY,
  (SELECT id FROM users WHERE username = 'board' LIMIT 1),
  'Demo exam window for testing.'
WHERE NOT EXISTS (SELECT 1 FROM exams WHERE examCode = 'EXM001');

INSERT INTO `students` (`instituteId`, `userId`, `firstName`, `middleName`, `lastName`, `mobile`, `streamCode`)
SELECT
  i.id,
  u.id,
  'Demo',
  'Student',
  'One',
  '9000000000',
  '1'
FROM institutes i
JOIN users u ON u.username = 'student1'
WHERE i.code = 'INST001'
  AND NOT EXISTS (SELECT 1 FROM students WHERE userId = u.id);

SELECT 'seed.sql completed. Import college-data.sql for all institutes.' AS status;
