-- Add Student Saral ID support for student profile
ALTER TABLE `students`
ADD COLUMN `studentSaralId` VARCHAR(50) NULL AFTER `apaarId`;
