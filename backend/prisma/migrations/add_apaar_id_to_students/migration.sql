-- Add APAAR ID support for student profile
ALTER TABLE `students`
ADD COLUMN `apaarId` VARCHAR(20) NULL AFTER `aadhaar`;
