-- Run on existing hsc-exam-form-db after older schema.sql
-- Safe to run multiple times (checks information_schema where needed)

USE `hsc_exam_local`;

-- streams.shortCode
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'streams' AND COLUMN_NAME = 'shortCode') = 0,
  'ALTER TABLE `streams` ADD COLUMN `shortCode` VARCHAR(3) NULL UNIQUE AFTER `name`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

UPDATE `streams` SET `shortCode` = 'SCI' WHERE `name` LIKE '%Science%' AND (`shortCode` IS NULL OR `shortCode` = '');
UPDATE `streams` SET `shortCode` = 'ART' WHERE `name` LIKE '%Arts%' AND (`shortCode` IS NULL OR `shortCode` = '');
UPDATE `streams` SET `shortCode` = 'COM' WHERE `name` LIKE '%Commerce%' AND (`shortCode` IS NULL OR `shortCode` = '');
UPDATE `streams` SET `shortCode` = 'VOC' WHERE (`name` LIKE '%Vocational%' OR `name` LIKE '%HSC.VOC%') AND (`shortCode` IS NULL OR `shortCode` = '');

-- exams.examCode
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'exams' AND COLUMN_NAME = 'examCode') = 0,
  'ALTER TABLE `exams` ADD COLUMN `examCode` VARCHAR(10) NULL UNIQUE AFTER `streamId`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- users Google auth
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'googleId') = 0,
  'ALTER TABLE `users` ADD COLUMN `googleId` VARCHAR(200) NULL UNIQUE AFTER `mobile`, ADD COLUMN `authProvider` VARCHAR(20) NULL AFTER `googleId`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- institutes
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institutes' AND COLUMN_NAME = 'collegeNo') = 0,
  'ALTER TABLE `institutes` ADD COLUMN `collegeNo` VARCHAR(20) NOT NULL DEFAULT '''' AFTER `id`, ADD COLUMN `udiseNo` VARCHAR(20) NOT NULL DEFAULT '''' AFTER `collegeNo`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institutes' AND COLUMN_NAME = 'acceptingApplications') = 0,
  'ALTER TABLE `institutes` ADD COLUMN `acceptingApplications` TINYINT(1) NOT NULL DEFAULT 1 AFTER `status`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'institutes' AND COLUMN_NAME = 'examApplicationLimit') = 0,
  'ALTER TABLE `institutes` ADD COLUMN `examApplicationLimit` INT NULL DEFAULT 100 AFTER `acceptingApplications`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- subjects.category
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'subjects' AND COLUMN_NAME = 'category') = 0,
  'ALTER TABLE `subjects` ADD COLUMN `category` VARCHAR(30) NOT NULL DEFAULT ''Optional Subjects'' AFTER `code`',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

-- students bank + location fields (if missing)
SET @sql = IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'students' AND COLUMN_NAME = 'accountHolder') = 0,
  'ALTER TABLE `students`
    ADD COLUMN `accountHolder` VARCHAR(100) NULL,
    ADD COLUMN `accountHolderRelation` VARCHAR(20) NULL,
    ADD COLUMN `accountNumber` VARCHAR(30) NULL,
    ADD COLUMN `ifscCode` VARCHAR(15) NULL,
    ADD COLUMN `district` VARCHAR(100) NULL,
    ADD COLUMN `taluka` VARCHAR(100) NULL,
    ADD COLUMN `village` VARCHAR(100) NULL,
    ADD COLUMN `apaarId` VARCHAR(20) NULL,
    ADD COLUMN `studentSaralId` VARCHAR(50) NULL,
    ADD COLUMN `managerUserId` INT NULL',
  'SELECT 1'
);
PREPARE s FROM @sql; EXECUTE s; DEALLOCATE PREPARE s;

SELECT 'sync_missing_columns.sql completed' AS status;
