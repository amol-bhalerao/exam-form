ALTER TABLE `institute_exam_capacities`
  ADD COLUMN IF NOT EXISTS `streamId` INT NULL AFTER `examId`;

UPDATE `institute_exam_capacities` c
JOIN `exams` e ON e.`id` = c.`examId`
SET c.`streamId` = e.`streamId`
WHERE c.`streamId` IS NULL;

SET @drop_unique_sql = (
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
PREPARE stmt_drop_unique FROM @drop_unique_sql;
EXECUTE stmt_drop_unique;
DEALLOCATE PREPARE stmt_drop_unique;

ALTER TABLE `institute_exam_capacities`
  MODIFY COLUMN `streamId` INT NOT NULL,
  ADD INDEX `institute_exam_capacities_streamId_idx` (`streamId`),
  ADD UNIQUE KEY `institute_exam_capacities_instituteId_examId_streamId_key` (`instituteId`, `examId`, `streamId`),
  ADD CONSTRAINT `institute_exam_capacities_streamId_fkey`
    FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
