-- HSC Exam Portal - Production DB Migration
-- Date: 2026-04-06
-- Purpose:
--   1) Add teacher board-duty columns
--   2) Add stream-wise institute exam capacity support
-- Safe to run on the production database before reloading the backend.

START TRANSACTION;

-- ---------------------------------------------------------------------
-- 1. Teacher board-duty fields
-- ---------------------------------------------------------------------
ALTER TABLE `teachers`
  ADD COLUMN IF NOT EXISTS `examinerExperienceYears` DOUBLE NULL AFTER `mobile`,
  ADD COLUMN IF NOT EXISTS `previousExaminerAppointmentNo` VARCHAR(100) NULL AFTER `examinerExperienceYears`,
  ADD COLUMN IF NOT EXISTS `moderatorExperienceYears` DOUBLE NULL AFTER `previousExaminerAppointmentNo`,
  ADD COLUMN IF NOT EXISTS `lastModeratorName` VARCHAR(150) NULL AFTER `moderatorExperienceYears`,
  ADD COLUMN IF NOT EXISTS `lastModeratorAppointmentNo` VARCHAR(100) NULL AFTER `lastModeratorName`,
  ADD COLUMN IF NOT EXISTS `lastModeratorCollegeName` VARCHAR(200) NULL AFTER `lastModeratorAppointmentNo`,
  ADD COLUMN IF NOT EXISTS `chiefModeratorExperienceYears` DOUBLE NULL AFTER `lastModeratorCollegeName`,
  ADD COLUMN IF NOT EXISTS `lastChiefModeratorName` VARCHAR(150) NULL AFTER `chiefModeratorExperienceYears`,
  ADD COLUMN IF NOT EXISTS `lastChiefModeratorAppointmentNo` VARCHAR(100) NULL AFTER `lastChiefModeratorName`,
  ADD COLUMN IF NOT EXISTS `lastChiefModeratorCollegeName` VARCHAR(200) NULL AFTER `lastChiefModeratorAppointmentNo`;

-- ---------------------------------------------------------------------
-- 2. Stream-wise institute exam capacity support
-- ---------------------------------------------------------------------
ALTER TABLE `institute_exam_capacities`
  ADD COLUMN IF NOT EXISTS `streamId` INT NULL AFTER `examId`;

UPDATE `institute_exam_capacities` c
JOIN `exams` e ON e.`id` = c.`examId`
SET c.`streamId` = e.`streamId`
WHERE c.`streamId` IS NULL;

SET @drop_old_unique_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM `information_schema`.`statistics`
      WHERE `table_schema` = DATABASE()
        AND `table_name` = 'institute_exam_capacities'
        AND `index_name` = 'institute_exam_capacities_instituteId_examId_key'
    ),
    'ALTER TABLE `institute_exam_capacities` DROP INDEX `institute_exam_capacities_instituteId_examId_key`',
    'SELECT 1'
  )
);
PREPARE stmt_drop_old_unique FROM @drop_old_unique_sql;
EXECUTE stmt_drop_old_unique;
DEALLOCATE PREPARE stmt_drop_old_unique;

ALTER TABLE `institute_exam_capacities`
  MODIFY COLUMN `streamId` INT NOT NULL;

SET @add_stream_idx_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM `information_schema`.`statistics`
      WHERE `table_schema` = DATABASE()
        AND `table_name` = 'institute_exam_capacities'
        AND `index_name` = 'institute_exam_capacities_streamId_idx'
    ),
    'SELECT 1',
    'ALTER TABLE `institute_exam_capacities` ADD INDEX `institute_exam_capacities_streamId_idx` (`streamId`)'
  )
);
PREPARE stmt_add_stream_idx FROM @add_stream_idx_sql;
EXECUTE stmt_add_stream_idx;
DEALLOCATE PREPARE stmt_add_stream_idx;

SET @add_new_unique_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM `information_schema`.`statistics`
      WHERE `table_schema` = DATABASE()
        AND `table_name` = 'institute_exam_capacities'
        AND `index_name` = 'institute_exam_capacities_instituteId_examId_streamId_key'
    ),
    'SELECT 1',
    'ALTER TABLE `institute_exam_capacities` ADD UNIQUE KEY `institute_exam_capacities_instituteId_examId_streamId_key` (`instituteId`, `examId`, `streamId`)'
  )
);
PREPARE stmt_add_new_unique FROM @add_new_unique_sql;
EXECUTE stmt_add_new_unique;
DEALLOCATE PREPARE stmt_add_new_unique;

SET @add_stream_fk_sql = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM `information_schema`.`table_constraints`
      WHERE `constraint_schema` = DATABASE()
        AND `table_name` = 'institute_exam_capacities'
        AND `constraint_name` = 'institute_exam_capacities_streamId_fkey'
    ),
    'SELECT 1',
    'ALTER TABLE `institute_exam_capacities` ADD CONSTRAINT `institute_exam_capacities_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE'
  )
);
PREPARE stmt_add_stream_fk FROM @add_stream_fk_sql;
EXECUTE stmt_add_stream_fk;
DEALLOCATE PREPARE stmt_add_stream_fk;

COMMIT;
