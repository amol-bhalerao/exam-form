-- Add stable exam/application sequence fields used by printable exam forms.
ALTER TABLE `exams`
  ADD COLUMN IF NOT EXISTS `examCode` VARCHAR(10) NULL AFTER `streamId`;

CREATE UNIQUE INDEX IF NOT EXISTS `exams_examCode_key`
  ON `exams` (`examCode`);

ALTER TABLE `exam_applications`
  ADD COLUMN IF NOT EXISTS `instituteSequenceNumber` VARCHAR(50) NULL AFTER `applicationNo`,
  ADD COLUMN IF NOT EXISTS `boardSequenceNumber` VARCHAR(50) NULL AFTER `instituteSequenceNumber`,
  ADD COLUMN IF NOT EXISTS `applSrNo` VARCHAR(50) NULL AFTER `studentSaralId`;

CREATE UNIQUE INDEX IF NOT EXISTS `exam_applications_instituteSequenceNumber_key`
  ON `exam_applications` (`instituteSequenceNumber`);

CREATE UNIQUE INDEX IF NOT EXISTS `exam_applications_boardSequenceNumber_key`
  ON `exam_applications` (`boardSequenceNumber`);

CREATE TABLE IF NOT EXISTS `exam_form_sequences` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `level` ENUM('INSTITUTE','BOARD') NOT NULL DEFAULT 'INSTITUTE',
  `examId` INT NOT NULL,
  `streamId` INT NOT NULL,
  `instituteId` INT NULL,
  `currentSequence` INT NOT NULL DEFAULT 0,
  `totalApplications` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `exam_form_sequences_level_examId_streamId_instituteId_key` (`level`, `examId`, `streamId`, `instituteId`),
  KEY `exam_form_sequences_level_examId_streamId_idx` (`level`, `examId`, `streamId`),
  KEY `exam_form_sequences_examId_streamId_instituteId_idx` (`examId`, `streamId`, `instituteId`),
  KEY `exam_form_sequences_isActive_idx` (`isActive`),
  CONSTRAINT `exam_form_sequences_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `exams`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_form_sequences_streamId_fkey`
    FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_form_sequences_instituteId_fkey`
    FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
