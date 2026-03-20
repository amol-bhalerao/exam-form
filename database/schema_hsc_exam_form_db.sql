-- Database: hsc-exam-form-db
CREATE DATABASE IF NOT EXISTS `hsc-exam-form-db`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hsc-exam-form-db`;

-- Disable FK checks during (re)create (optional)
SET FOREIGN_KEY_CHECKS = 0;

-- ROLES
CREATE TABLE IF NOT EXISTS `roles` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- INSTITUTES (tenant) with basic geo fields
CREATE TABLE IF NOT EXISTS `institutes` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
   `collegeNo` VARCHAR(20) NOT NULL,
  `udiseNo` VARCHAR(20) NOT NULL,
  `name` VARCHAR(200) NOT NULL,
  `code` VARCHAR(50) UNIQUE,
  `address` TEXT,
  `district` VARCHAR(100),
  `taluka` VARCHAR(100),
  `city` VARCHAR(100),
  `pincode` VARCHAR(10),
  `contactPerson` VARCHAR(100),
  `contactEmail` VARCHAR(150),
  `contactMobile` VARCHAR(15),
  `status` ENUM('APPROVED','PENDING','REJECTED','DISABLED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_institutes_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- USERS (RBAC + Google provision)
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `roleId` INT NOT NULL,
  `instituteId` INT NULL,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `passwordHash` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150),
  `mobile` VARCHAR(15),
  `google_sub` VARCHAR(255) UNIQUE,
  `status` ENUM('ACTIVE','PENDING','DISABLED') NOT NULL DEFAULT 'PENDING',
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_roleId` (`roleId`),
  INDEX `idx_users_instituteId` (`instituteId`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`),
  CONSTRAINT `fk_users_institute` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- REFRESH TOKENS
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `userId` INT NOT NULL,
  `tokenHash` VARCHAR(255) NOT NULL,
  `expiresAt` DATETIME NOT NULL,
  `revokedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_refresh_userId` (`userId`),
  CONSTRAINT `fk_refresh_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- STREAMS
CREATE TABLE IF NOT EXISTS `streams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- SUBJECTS
CREATE TABLE IF NOT EXISTS `subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `code` VARCHAR(20) NOT NULL UNIQUE,
  `category` ENUM('Language','Compulsory','Optional','Bifocal','Vocational') NOT NULL,
  INDEX `idx_subjects_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EXAMS
CREATE TABLE IF NOT EXISTS `exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `academicYear` VARCHAR(20) NOT NULL,
  `session` VARCHAR(30) NOT NULL,
  `streamId` INT NOT NULL,
  `applicationOpen` DATETIME NOT NULL,
  `applicationClose` DATETIME NOT NULL,
  `lateFeeClose` DATETIME NULL,
  `instructions` TEXT,
  `createdByUserId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_exams_streamId` (`streamId`),
  INDEX `idx_exams_window` (`applicationOpen`,`applicationClose`),
  CONSTRAINT `fk_exams_stream` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`),
  CONSTRAINT `fk_exams_createdby` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- STUDENTS
CREATE TABLE IF NOT EXISTS `students` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instituteId` INT NOT NULL,
  `userId` INT UNIQUE,
  `firstName` VARCHAR(100),
  `middleName` VARCHAR(100),
  `lastName` VARCHAR(100),
  `motherName` VARCHAR(100),
  `dob` DATETIME NULL,
  `gender` VARCHAR(20),
  `aadhaar` VARCHAR(20),
  `address` TEXT,
  `pinCode` VARCHAR(10),
  `mobile` VARCHAR(15),
  `streamCode` VARCHAR(10),
  `minorityReligionCode` VARCHAR(10),
  `categoryCode` VARCHAR(10),
  `divyangCode` VARCHAR(10),
  `mediumCode` VARCHAR(10),
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_students_instituteId` (`instituteId`),
  INDEX `idx_students_name` (`lastName`,`firstName`),
  CONSTRAINT `fk_students_institute` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`),
  CONSTRAINT `fk_students_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EXAM APPLICATIONS
CREATE TABLE IF NOT EXISTS `exam_applications` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instituteId` INT NOT NULL,
  `studentId` INT NOT NULL,
  `examId` INT NOT NULL,
  `applicationNo` VARCHAR(50) NOT NULL UNIQUE,
  `status` ENUM('DRAFT','SUBMITTED','INSTITUTE_VERIFIED','BOARD_APPROVED','REJECTED_BY_INSTITUTE','REJECTED_BY_BOARD') NOT NULL DEFAULT 'DRAFT',
  `candidateType` ENUM('REGULAR','REPEATER','ATKT','BACKLOG','IMPROVEMENT','PRIVATE') NOT NULL,

  `indexNo` VARCHAR(50),
  `udiseNo` VARCHAR(50),
  `studentSaralId` VARCHAR(50),
  `applSrNo` VARCHAR(50),
  `centreNo` VARCHAR(50),

  `typeA` VARCHAR(10),
  `typeB` VARCHAR(10),
  `typeC` VARCHAR(10),
  `typeD` VARCHAR(10),
  `isForeigner` TINYINT(1) NOT NULL DEFAULT 0,

  `totalExemptionsClaimed` INT NOT NULL DEFAULT 0,

  `enrollmentCertMonth` VARCHAR(10),
  `enrollmentCertYear` INT,
  `enrollmentNo` VARCHAR(50),

  `lastExamMonth` VARCHAR(10),
  `lastExamYear` INT,
  `lastExamSeatNo` VARCHAR(50),

  `sscPassedFromMaharashtra` TINYINT(1),
  `eligibilityCertIssued` TINYINT(1),
  `eligibilityCertNo` VARCHAR(50),

  `instituteVerificationRemark` TEXT,
  `boardRemark` TEXT,

  `submittedAt` DATETIME NULL,
  `instituteVerifiedAt` DATETIME NULL,
  `boardApprovedAt` DATETIME NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX `idx_app_institute_status` (`instituteId`,`status`),
  INDEX `idx_app_exam_status` (`examId`,`status`),
  INDEX `idx_app_student` (`studentId`),

  CONSTRAINT `fk_app_institute` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`),
  CONSTRAINT `fk_app_student` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`),
  CONSTRAINT `fk_app_exam` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EXAM APPLICATION SUBJECTS
CREATE TABLE IF NOT EXISTS `exam_application_subjects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `subjectId` INT NOT NULL,
  `langOfAnsCode` VARCHAR(10),
  `isExemptedClaim` TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT `uniq_app_subject` UNIQUE (`applicationId`,`subjectId`),
  INDEX `idx_eas_applicationId` (`applicationId`),
  CONSTRAINT `fk_eas_app` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`),
  CONSTRAINT `fk_eas_subject` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EXEMPTED SUBJECT INFO
CREATE TABLE IF NOT EXISTS `exempted_subject_info` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `subjectName` VARCHAR(150),
  `subjectCode` VARCHAR(20),
  `seatNo` VARCHAR(50),
  `month` VARCHAR(10),
  `year` INT,
  `marksObt` VARCHAR(20),
  INDEX `idx_exempted_app` (`applicationId`),
  CONSTRAINT `fk_exempted_app` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PREVIOUS EXAMS
CREATE TABLE IF NOT EXISTS `previous_exams` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `studentId` INT NOT NULL,
  `examType` VARCHAR(10) NOT NULL,
  `seatNo` VARCHAR(50),
  `month` VARCHAR(10),
  `year` INT,
  `boardOrCollegeName` VARCHAR(200),
  INDEX `idx_prev_student` (`studentId`),
  CONSTRAINT `fk_prev_student` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- FEE REIMBURSEMENT
CREATE TABLE IF NOT EXISTS `fee_reimbursement` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `studentId` INT NOT NULL UNIQUE,
  `revenueCircleAndVillage` VARCHAR(200),
  `accountNo` VARCHAR(30),
  `ifscCode` VARCHAR(15),
  `accountHolder` VARCHAR(20),
  CONSTRAINT `fk_fee_student` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- EXAM APPLICATION DOCUMENTS
CREATE TABLE IF NOT EXISTS `exam_application_documents` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `fileName` VARCHAR(255) NOT NULL,
  `mimeType` VARCHAR(100) NOT NULL,
  `filePath` VARCHAR(500) NOT NULL,
  `uploadedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `verifiedAt` DATETIME NULL,
  `verifiedByUserId` INT NULL,
  INDEX `idx_docs_app` (`applicationId`),
  CONSTRAINT `fk_docs_app` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- PAYMENTS (with platform fee + gateway/status)
CREATE TABLE IF NOT EXISTS `payments` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `amountPaise` INT NOT NULL,
  `platformFeePaise` INT NOT NULL DEFAULT 0,
  `method` VARCHAR(30),
  `gateway` VARCHAR(50),
  `status` ENUM('PENDING','PAID','FAILED') NOT NULL DEFAULT 'PENDING',
  `referenceNo` VARCHAR(100),
  `receivedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `receivedByUserId` INT NULL,
  INDEX `idx_payments_app` (`applicationId`),
  CONSTRAINT `fk_payments_app` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- STATUS HISTORY
CREATE TABLE IF NOT EXISTS `status_history` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `applicationId` INT NOT NULL,
  `fromStatus` ENUM('DRAFT','SUBMITTED','INSTITUTE_VERIFIED','BOARD_APPROVED','REJECTED_BY_INSTITUTE','REJECTED_BY_BOARD'),
  `toStatus` ENUM('DRAFT','SUBMITTED','INSTITUTE_VERIFIED','BOARD_APPROVED','REJECTED_BY_INSTITUTE','REJECTED_BY_BOARD') NOT NULL,
  `remark` TEXT,
  `actorUserId` INT NOT NULL,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_status_app` (`applicationId`),
  INDEX `idx_status_actor` (`actorUserId`),
  CONSTRAINT `fk_status_app` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`),
  CONSTRAINT `fk_status_actor` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- AUDIT LOGS
CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `actorUserId` INT NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `entityType` VARCHAR(50),
  `entityId` VARCHAR(50),
  `metaJson` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_audit_actor` (`actorUserId`),
  INDEX `idx_audit_action` (`action`),
  CONSTRAINT `fk_audit_actor` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TEACHERS
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `instituteId` INT NOT NULL,
  `fullName` VARCHAR(200) NOT NULL,
  `email` VARCHAR(150),
  `mobile` VARCHAR(15),
  `qualification` VARCHAR(200),
  `experienceYears` INT,
  `experienceDetails` TEXT,
  `subjectExpertise` VARCHAR(200),
  `dateOfJoining` DATE,
  `isFullTime` TINYINT(1),
  `remarks` TEXT,
  `createdAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_teachers_institute` (`instituteId`),
  CONSTRAINT `fk_teachers_institute` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

SET FOREIGN_KEY_CHECKS = 1;

