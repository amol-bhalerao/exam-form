USE `hsc-exam-form-db`;

-- Basic seed data for roles
INSERT INTO `roles` (`name`) VALUES
  ('SUPER_ADMIN'),
  ('BOARD'),
  ('INSTITUTE'),
  ('STUDENT')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Example institutes (you will extend this with full Excel dump)
INSERT INTO `institutes` (`collegeNo`, `udiseNo`, `name`, `code`, `address`, `district`, `taluka`, `city`, `pincode`, `contactPerson`, `contactEmail`, `contactMobile`, `status`)
VALUES
  ('COLL001', '27280100123', 'Demo Junior College 1', 'INST001', 'Demo Address, Maharashtra', 'Pune', 'Pune City', 'Pune', '411001', 'Principal', 'inst1@example.com', '9999999999', 'APPROVED')
ON DUPLICATE KEY UPDATE
  `collegeNo` = VALUES(`collegeNo`),
  `udiseNo` = VALUES(`udiseNo`),
  `name` = VALUES(`name`),
  `address` = VALUES(`address`),
  `district` = VALUES(`district`),
  `taluka` = VALUES(`taluka`),
  `city` = VALUES(`city`),
  `pincode` = VALUES(`pincode`),
  `contactPerson` = VALUES(`contactPerson`),
  `contactEmail` = VALUES(`contactEmail`),
  `contactMobile` = VALUES(`contactMobile`),
  `status` = VALUES(`status`);

-- Example streams
INSERT INTO `streams` (`name`) VALUES
  ('Science'),
  ('Arts'),
  ('Commerce'),
  ('HSC Vocational'),
  ('Technology Science')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Example subjects (extend these with full Excel export)


-- SUPER ADMIN, BOARD, INSTITUTE USER, STUDENT USER
-- Note: password_hash here is a placeholder; prefer seeding via application (Prisma seed) for real bcrypt hashes.

-- 1) Look up role ids & institute ids dynamically is easier from application code.
--    For pure SQL, you can either hardcode ids or run separate UPDATEs after row creation.

-- Example: create bare users; then update role/institute via app or manual SQL.
INSERT INTO `users` (`roleId`, `instituteId`, `username`, `passwordHash`, `email`, `status`)
VALUES
  ( (SELECT id FROM roles WHERE name = 'SUPER_ADMIN'), NULL, 'superadmin', '$2b$10$F6otMv7xgmuQd9jaozFoD.SBuN2e4lKn7LCkyMoeQcLqpupL0tnD.', 'superadmin@example.com', 'ACTIVE' ),
  ( (SELECT id FROM roles WHERE name = 'BOARD'), NULL, 'board', '$2b$10$F6otMv7xgmuQd9jaozFoD.SBuN2e4lKn7LCkyMoeQcLqpupL0tnD.', 'board@example.com', 'ACTIVE' ),
  ( (SELECT id FROM roles WHERE name = 'INSTITUTE'), (SELECT id FROM institutes WHERE code = 'INST001'), 'institute1', '$2b$10$F6otMv7xgmuQd9jaozFoD.SBuN2e4lKn7LCkyMoeQcLqpupL0tnD.', 'institute1@example.com', 'ACTIVE' ),
  ( (SELECT id FROM roles WHERE name = 'STUDENT'), (SELECT id FROM institutes WHERE code = 'INST001'), 'student1', '$2b$10$F6otMv7xgmuQd9jaozFoD.SBuN2e4lKn7LCkyMoeQcLqpupL0tnD.', 'student1@example.com', 'ACTIVE' )
ON DUPLICATE KEY UPDATE
  `email` = VALUES(`email`),
  `status` = VALUES(`status`);

-- IMPORTANT:
-- Replace the four $2a$10$PLACEHOLDER_*_HASH strings with real bcrypt hashes
-- for the password "Password@123" if you want SQL-only seeding to match
-- the Node/Prisma seed. You can copy the actual hashes from your existing DB
-- (created by `prisma db seed`) via phpMyAdmin export.

-- SUBJECT & INSTITUTE BULK IMPORT FROM EXCEL
-- ==========================================
-- To load ALL subjects and institutes from your Excel files:
--
-- 1) Export your Excel sheets (subjects, institutes) to CSV.
-- 2) Either:
--    a) Use phpMyAdmin "Import" on the `subjects` and `institutes` tables, OR
--    b) Generate INSERT statements in Excel / a script and paste them below.
--
-- Example INSERT format for subjects generated from Excel:
--
-- INSERT INTO `subjects` (`name`, `code`) VALUES
--   ('Marathi', '02'),
--   ('Hindi', '03'),
--   ...
-- ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);
--
-- Example INSERT format for institutes generated from Excel:
--
-- INSERT INTO `institutes`
--   (`name`,`code`,`address`,`district`,`taluka`,`city`,`pincode`,
--    `contactPerson`,`contactEmail`,`contactMobile`,`status`)
-- VALUES
--   ('XYZ Jr College', 'JCOLL123', 'Full address...', 'Pune', 'Haveli', 'Pune', '411002',
--    'Principal Name', 'principal@xyz.com', '9876543210', 'APPROVED'),
--   ...
-- ON DUPLICATE KEY UPDATE
--   `name` = VALUES(`name`),
--   `address` = VALUES(`address`),
--   `district` = VALUES(`district`),
--   `taluka` = VALUES(`taluka`),
--   `city` = VALUES(`city`),
--   `pincode` = VALUES(`pincode`),
--   `contactPerson` = VALUES(`contactPerson`),
--   `contactEmail` = VALUES(`contactEmail`),
--   `contactMobile` = VALUES(`contactMobile`),
--   `status` = VALUES(`status`);

