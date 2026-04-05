-- Ensure answer language support exists for institute stream subject mappings
ALTER TABLE `institute_stream_subjects`
  ADD COLUMN IF NOT EXISTS `answerLanguageCode` VARCHAR(10) NULL AFTER `subjectId`;

-- Per-exam student capacity configured by institute admins
CREATE TABLE IF NOT EXISTS `institute_exam_capacities` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `instituteId` INT NOT NULL,
  `examId` INT NOT NULL,
  `totalStudents` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `institute_exam_capacities_instituteId_examId_key` (`instituteId`, `examId`),
  KEY `institute_exam_capacities_instituteId_idx` (`instituteId`),
  KEY `institute_exam_capacities_examId_idx` (`examId`),
  CONSTRAINT `institute_exam_capacities_instituteId_fkey`
    FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `institute_exam_capacities_examId_fkey`
    FOREIGN KEY (`examId`) REFERENCES `exams`(`id`)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
