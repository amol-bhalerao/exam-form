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
