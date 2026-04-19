-- Add missing location fields for student profile persistence
ALTER TABLE `students`
ADD COLUMN `district` VARCHAR(100) NULL AFTER `address`,
ADD COLUMN `taluka` VARCHAR(100) NULL AFTER `district`,
ADD COLUMN `village` VARCHAR(100) NULL AFTER `taluka`;
