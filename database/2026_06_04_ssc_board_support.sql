-- SSC/HSC board-type support.
-- Run this on production before deploying code that uses SSC board scoping.

SET @add_institute_board_type := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `institutes` ADD COLUMN `boardType` VARCHAR(10) NOT NULL DEFAULT ''HSC'' AFTER `examApplicationLimit`',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'institutes'
    AND COLUMN_NAME = 'boardType'
);
PREPARE stmt FROM @add_institute_board_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_exam_board_type := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `exams` ADD COLUMN `boardType` VARCHAR(10) NOT NULL DEFAULT ''HSC'' AFTER `examCode`',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exams'
    AND COLUMN_NAME = 'boardType'
);
PREPARE stmt FROM @add_exam_board_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_user_board_type := (
  SELECT IF(
    COUNT(*) = 0,
    'ALTER TABLE `users` ADD COLUMN `boardType` VARCHAR(10) NULL AFTER `instituteId`',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND COLUMN_NAME = 'boardType'
);
PREPARE stmt FROM @add_user_board_type;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @make_exam_stream_nullable := (
  SELECT IF(
    IS_NULLABLE = 'NO',
    'ALTER TABLE `exams` MODIFY COLUMN `streamId` INT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exams'
    AND COLUMN_NAME = 'streamId'
  LIMIT 1
);
PREPARE stmt FROM @make_exam_stream_nullable;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE `institutes` SET `boardType` = 'HSC' WHERE `boardType` IS NULL OR `boardType` = '';
UPDATE `exams` SET `boardType` = 'HSC' WHERE `boardType` IS NULL OR `boardType` = '';
UPDATE `users` u
JOIN `roles` r ON r.`id` = u.`roleId`
SET u.`boardType` = 'HSC'
WHERE r.`name` = 'BOARD' AND (u.`boardType` IS NULL OR u.`boardType` = '');

SET @make_sequence_stream_nullable := (
  SELECT IF(
    IS_NULLABLE = 'NO',
    'ALTER TABLE `exam_form_sequences` MODIFY COLUMN `streamId` INT NULL',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exam_form_sequences'
    AND COLUMN_NAME = 'streamId'
  LIMIT 1
);
PREPARE stmt FROM @make_sequence_stream_nullable;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_institutes_board_idx := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `institutes_boardType_idx` ON `institutes` (`boardType`)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'institutes'
    AND INDEX_NAME = 'institutes_boardType_idx'
);
PREPARE stmt FROM @add_institutes_board_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_exams_board_idx := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `exams_boardType_idx` ON `exams` (`boardType`)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'exams'
    AND INDEX_NAME = 'exams_boardType_idx'
);
PREPARE stmt FROM @add_exams_board_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @add_users_board_idx := (
  SELECT IF(
    COUNT(*) = 0,
    'CREATE INDEX `users_boardType_idx` ON `users` (`boardType`)',
    'SELECT 1'
  )
  FROM INFORMATION_SCHEMA.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'users'
    AND INDEX_NAME = 'users_boardType_idx'
);
PREPARE stmt FROM @add_users_board_idx;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

INSERT INTO `users` (`roleId`, `username`, `passwordHash`, `email`, `status`, `boardType`)
SELECT r.`id`, 'ssc.board', '$2b$12$zQf2y1V05em0f5T1XILicekwd6g4ZqRCHdxM6fcd/Hl8QQkRWNu3q', 'ssc.board@hscexam.in', 'ACTIVE', 'SSC'
FROM `roles` r
WHERE r.`name` = 'BOARD'
  AND NOT EXISTS (SELECT 1 FROM `users` WHERE `username` = 'ssc.board');

-- Temporary credentials for the new SSC board account:
-- Username: ssc.board
-- Password: SscBoard@123
-- Change this password immediately after first login.

-- SSC school import guidance:
-- Import SSC schools into `institutes` with `boardType = 'SSC'`.
-- Use `collegeNo` for the school/index code from the SSC school list, `udiseNo` for UDISE if present,
-- and keep HSC colleges as `boardType = 'HSC'`.
