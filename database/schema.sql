-- HSC Exam Form — full schema (generated from backend/prisma/schema.prisma)
-- Fresh install: create database then run this file, then seed.sql, then college-data.sql
CREATE DATABASE IF NOT EXISTS `hsc_exam_local` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `hsc_exam_local`;

-- CreateTable
CREATE TABLE `roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `roles_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institutes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `collegeNo` VARCHAR(20) NOT NULL,
    `udiseNo` VARCHAR(20) NOT NULL,
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `district` VARCHAR(100) NULL,
    `taluka` VARCHAR(100) NULL,
    `city` VARCHAR(100) NULL,
    `pincode` VARCHAR(10) NULL,
    `contactPerson` VARCHAR(100) NULL,
    `contactEmail` VARCHAR(150) NULL,
    `contactMobile` VARCHAR(15) NULL,
    `status` ENUM('APPROVED', 'PENDING', 'REJECTED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    `acceptingApplications` BOOLEAN NOT NULL DEFAULT true,
    `examApplicationLimit` INTEGER NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `institutes_code_key`(`code`),
    INDEX `institutes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roleId` INTEGER NOT NULL,
    `instituteId` INTEGER NULL,
    `username` VARCHAR(100) NOT NULL,
    `passwordHash` VARCHAR(255) NOT NULL,
    `email` VARCHAR(150) NULL,
    `mobile` VARCHAR(15) NULL,
    `status` ENUM('ACTIVE', 'PENDING', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    `googleId` VARCHAR(200) NULL,
    `authProvider` VARCHAR(20) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    UNIQUE INDEX `users_googleId_key`(`googleId`),
    INDEX `users_roleId_idx`(`roleId`),
    INDEX `users_instituteId_idx`(`instituteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institute_invites` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usedAt` DATETIME(3) NULL,

    UNIQUE INDEX `institute_invites_token_key`(`token`),
    INDEX `institute_invites_instituteId_idx`(`instituteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `tokenHash` VARCHAR(255) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `streams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `shortCode` VARCHAR(3) NULL,

    UNIQUE INDEX `streams_name_key`(`name`),
    UNIQUE INDEX `streams_shortCode_key`(`shortCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `category` VARCHAR(30) NOT NULL,

    INDEX `subjects_name_idx`(`name`),
    INDEX `subjects_code_idx`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `academicYear` VARCHAR(20) NOT NULL,
    `session` VARCHAR(30) NOT NULL,
    `streamId` INTEGER NOT NULL,
    `examCode` VARCHAR(10) NULL,
    `applicationOpen` DATETIME(3) NOT NULL,
    `applicationClose` DATETIME(3) NOT NULL,
    `lateFeeClose` DATETIME(3) NULL,
    `instructions` TEXT NULL,
    `createdByUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `exams_examCode_key`(`examCode`),
    INDEX `exams_streamId_idx`(`streamId`),
    INDEX `exams_applicationOpen_applicationClose_idx`(`applicationOpen`, `applicationClose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institute_exam_capacities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `examId` INTEGER NOT NULL,
    `streamId` INTEGER NOT NULL,
    `totalStudents` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `institute_exam_capacities_instituteId_idx`(`instituteId`),
    INDEX `institute_exam_capacities_examId_idx`(`examId`),
    INDEX `institute_exam_capacities_streamId_idx`(`streamId`),
    UNIQUE INDEX `institute_exam_capacities_instituteId_examId_streamId_key`(`instituteId`, `examId`, `streamId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `managerUserId` INTEGER NULL,
    `firstName` VARCHAR(100) NULL,
    `middleName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NULL,
    `motherName` VARCHAR(100) NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `aadhaar` VARCHAR(20) NULL,
    `apaarId` VARCHAR(20) NULL,
    `studentSaralId` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `district` VARCHAR(100) NULL,
    `taluka` VARCHAR(100) NULL,
    `village` VARCHAR(100) NULL,
    `pinCode` VARCHAR(10) NULL,
    `mobile` VARCHAR(15) NULL,
    `accountHolder` VARCHAR(100) NULL,
    `accountHolderRelation` VARCHAR(20) NULL,
    `ifscCode` VARCHAR(15) NULL,
    `accountNumber` VARCHAR(30) NULL,
    `streamCode` VARCHAR(10) NULL,
    `minorityReligionCode` VARCHAR(10) NULL,
    `categoryCode` VARCHAR(10) NULL,
    `divyangCode` VARCHAR(10) NULL,
    `mediumCode` VARCHAR(10) NULL,
    `sscPassedFromMaharashtra` BOOLEAN NULL,
    `eligibilityCertIssued` BOOLEAN NULL,
    `eligibilityCertNo` VARCHAR(100) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `students_userId_key`(`userId`),
    INDEX `students_instituteId_idx`(`instituteId`),
    INDEX `students_managerUserId_idx`(`managerUserId`),
    INDEX `students_lastName_firstName_idx`(`lastName`, `firstName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_applications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `studentId` INTEGER NOT NULL,
    `examId` INTEGER NOT NULL,
    `applicationNo` VARCHAR(50) NOT NULL,
    `instituteSequenceNumber` VARCHAR(50) NULL,
    `boardSequenceNumber` VARCHAR(50) NULL,
    `status` ENUM('DRAFT', 'SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD') NOT NULL DEFAULT 'DRAFT',
    `candidateType` ENUM('REGULAR', 'REPEATER', 'ATKT', 'BACKLOG', 'IMPROVEMENT', 'PRIVATE') NOT NULL,
    `indexNo` VARCHAR(50) NULL,
    `udiseNo` VARCHAR(50) NULL,
    `studentSaralId` VARCHAR(50) NULL,
    `applSrNo` VARCHAR(50) NULL,
    `centreNo` VARCHAR(50) NULL,
    `typeA` VARCHAR(10) NULL,
    `typeB` VARCHAR(10) NULL,
    `typeC` VARCHAR(10) NULL,
    `typeD` VARCHAR(10) NULL,
    `isForeigner` BOOLEAN NOT NULL DEFAULT false,
    `totalExemptionsClaimed` INTEGER NOT NULL DEFAULT 0,
    `enrollmentCertMonth` VARCHAR(10) NULL,
    `enrollmentCertYear` INTEGER NULL,
    `enrollmentNo` VARCHAR(50) NULL,
    `lastExamMonth` VARCHAR(10) NULL,
    `lastExamYear` INTEGER NULL,
    `lastExamSeatNo` VARCHAR(50) NULL,
    `sscPassedFromMaharashtra` BOOLEAN NULL,
    `eligibilityCertIssued` BOOLEAN NULL,
    `eligibilityCertNo` VARCHAR(50) NULL,
    `instituteVerificationRemark` TEXT NULL,
    `boardRemark` TEXT NULL,
    `submittedAt` DATETIME(3) NULL,
    `instituteVerifiedAt` DATETIME(3) NULL,
    `boardApprovedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `exam_applications_applicationNo_key`(`applicationNo`),
    UNIQUE INDEX `exam_applications_instituteSequenceNumber_key`(`instituteSequenceNumber`),
    UNIQUE INDEX `exam_applications_boardSequenceNumber_key`(`boardSequenceNumber`),
    INDEX `exam_applications_instituteId_status_idx`(`instituteId`, `status`),
    INDEX `exam_applications_examId_status_idx`(`examId`, `status`),
    INDEX `exam_applications_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_application_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `langOfAnsCode` VARCHAR(10) NULL,
    `isExemptedClaim` BOOLEAN NOT NULL DEFAULT false,

    INDEX `exam_application_subjects_applicationId_idx`(`applicationId`),
    UNIQUE INDEX `exam_application_subjects_applicationId_subjectId_key`(`applicationId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exempted_subject_info` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `subjectName` VARCHAR(150) NULL,
    `subjectCode` VARCHAR(20) NULL,
    `seatNo` VARCHAR(50) NULL,
    `month` VARCHAR(10) NULL,
    `year` INTEGER NULL,
    `marksObt` VARCHAR(20) NULL,

    INDEX `exempted_subject_info_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `previous_exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `examType` VARCHAR(10) NOT NULL,
    `seatNo` VARCHAR(50) NULL,
    `month` VARCHAR(10) NULL,
    `year` INTEGER NULL,
    `percentage` VARCHAR(10) NULL,
    `boardOrCollegeName` VARCHAR(200) NULL,

    INDEX `previous_exams_studentId_idx`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fee_reimbursement` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `studentId` INTEGER NOT NULL,
    `revenueCircleAndVillage` VARCHAR(200) NULL,
    `accountNo` VARCHAR(30) NULL,
    `ifscCode` VARCHAR(15) NULL,
    `accountHolder` VARCHAR(100) NULL,
    `accountHolderRelation` VARCHAR(20) NULL,

    UNIQUE INDEX `fee_reimbursement_studentId_key`(`studentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_application_documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `fileName` VARCHAR(255) NOT NULL,
    `mimeType` VARCHAR(100) NOT NULL,
    `filePath` VARCHAR(500) NOT NULL,
    `uploadedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedAt` DATETIME(3) NULL,
    `verifiedByUserId` INTEGER NULL,

    INDEX `exam_application_documents_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `amountPaise` INTEGER NOT NULL,
    `method` VARCHAR(30) NULL,
    `referenceNo` VARCHAR(100) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `receivedByUserId` INTEGER NULL,

    INDEX `payments_applicationId_idx`(`applicationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `status_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `applicationId` INTEGER NOT NULL,
    `fromStatus` ENUM('DRAFT', 'SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD') NULL,
    `toStatus` ENUM('DRAFT', 'SUBMITTED', 'INSTITUTE_VERIFIED', 'BOARD_APPROVED', 'REJECTED_BY_INSTITUTE', 'REJECTED_BY_BOARD') NOT NULL,
    `remark` TEXT NULL,
    `actorUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `status_history_applicationId_idx`(`applicationId`),
    INDEX `status_history_actorUserId_idx`(`actorUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actorUserId` INTEGER NOT NULL,
    `action` VARCHAR(100) NOT NULL,
    `entityType` VARCHAR(50) NULL,
    `entityId` VARCHAR(50) NULL,
    `metaJson` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_actorUserId_idx`(`actorUserId`),
    INDEX `audit_logs_action_idx`(`action`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `teachers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `nationality` VARCHAR(100) NULL,
    `governmentId` VARCHAR(20) NULL,
    `casterCategory` VARCHAR(50) NULL,
    `qualification` VARCHAR(255) NULL,
    `subjectSpecialization` VARCHAR(150) NULL,
    `certifications` TEXT NULL,
    `certificates` TEXT NULL,
    `designation` VARCHAR(100) NULL,
    `serviceStartDate` DATETIME(3) NULL,
    `appointmentDate` DATETIME(3) NULL,
    `leavingDate` DATETIME(3) NULL,
    `leavingNote` TEXT NULL,
    `teacherType` VARCHAR(50) NULL,
    `employeeId` VARCHAR(80) NULL,
    `payScale` VARCHAR(80) NULL,
    `salary` DOUBLE NULL,
    `previousExperience` TEXT NULL,
    `totalYearsService` DOUBLE NULL,
    `promotionsTransfers` TEXT NULL,
    `trainingPrograms` TEXT NULL,
    `workshops` TEXT NULL,
    `ictCertification` TEXT NULL,
    `appendixIxPublished` BOOLEAN NOT NULL DEFAULT false,
    `disclosureNotes` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `email` VARCHAR(150) NULL,
    `mobile` VARCHAR(15) NULL,
    `examinerExperienceYears` DOUBLE NULL,
    `previousExaminerAppointmentNo` VARCHAR(100) NULL,
    `moderatorExperienceYears` DOUBLE NULL,
    `lastModeratorName` VARCHAR(150) NULL,
    `lastModeratorAppointmentNo` VARCHAR(100) NULL,
    `lastModeratorCollegeName` VARCHAR(200) NULL,
    `chiefModeratorExperienceYears` DOUBLE NULL,
    `lastChiefModeratorName` VARCHAR(150) NULL,
    `lastChiefModeratorAppointmentNo` VARCHAR(100) NULL,
    `lastChiefModeratorCollegeName` VARCHAR(200) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teachers_instituteId_idx`(`instituteId`),
    INDEX `teachers_governmentId_idx`(`governmentId`),
    INDEX `teachers_teacherType_idx`(`teacherType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institute_stream_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `streamId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `answerLanguageCode` VARCHAR(10) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `institute_stream_subjects_instituteId_idx`(`instituteId`),
    INDEX `institute_stream_subjects_streamId_idx`(`streamId`),
    INDEX `institute_stream_subjects_subjectId_idx`(`subjectId`),
    UNIQUE INDEX `institute_stream_subjects_instituteId_streamId_subjectId_key`(`instituteId`, `streamId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stream_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `streamId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `stream_subjects_streamId_idx`(`streamId`),
    UNIQUE INDEX `stream_subjects_streamId_subjectId_key`(`streamId`, `subjectId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `news` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `type` VARCHAR(50) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdByUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `news_isActive_idx`(`isActive`),
    INDEX `news_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `statistics` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(100) NOT NULL,
    `value` INTEGER NOT NULL DEFAULT 0,
    `description` VARCHAR(255) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `statistics_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exam_form_sequences` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `level` ENUM('INSTITUTE', 'BOARD') NOT NULL DEFAULT 'INSTITUTE',
    `examId` INTEGER NOT NULL,
    `streamId` INTEGER NOT NULL,
    `instituteId` INTEGER NULL,
    `currentSequence` INTEGER NOT NULL DEFAULT 0,
    `totalApplications` INTEGER NOT NULL DEFAULT 0,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `exam_form_sequences_level_examId_streamId_idx`(`level`, `examId`, `streamId`),
    INDEX `exam_form_sequences_examId_streamId_instituteId_idx`(`examId`, `streamId`, `instituteId`),
    INDEX `exam_form_sequences_isActive_idx`(`isActive`),
    UNIQUE INDEX `exam_form_sequences_level_examId_streamId_instituteId_key`(`level`, `examId`, `streamId`, `instituteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_invites` ADD CONSTRAINT `institute_invites_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_invites` ADD CONSTRAINT `institute_invites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_exam_capacities` ADD CONSTRAINT `institute_exam_capacities_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_exam_capacities` ADD CONSTRAINT `institute_exam_capacities_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_exam_capacities` ADD CONSTRAINT `institute_exam_capacities_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_managerUserId_fkey` FOREIGN KEY (`managerUserId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_applications` ADD CONSTRAINT `exam_applications_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_applications` ADD CONSTRAINT `exam_applications_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_applications` ADD CONSTRAINT `exam_applications_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_application_subjects` ADD CONSTRAINT `exam_application_subjects_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_application_subjects` ADD CONSTRAINT `exam_application_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exempted_subject_info` ADD CONSTRAINT `exempted_subject_info_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `previous_exams` ADD CONSTRAINT `previous_exams_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `fee_reimbursement` ADD CONSTRAINT `fee_reimbursement_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_application_documents` ADD CONSTRAINT `exam_application_documents_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payments` ADD CONSTRAINT `payments_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `status_history` ADD CONSTRAINT `status_history_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `exam_applications`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `status_history` ADD CONSTRAINT `status_history_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `audit_logs` ADD CONSTRAINT `audit_logs_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `teachers` ADD CONSTRAINT `teachers_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_stream_subjects` ADD CONSTRAINT `institute_stream_subjects_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_stream_subjects` ADD CONSTRAINT `institute_stream_subjects_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_stream_subjects` ADD CONSTRAINT `institute_stream_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stream_subjects` ADD CONSTRAINT `stream_subjects_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stream_subjects` ADD CONSTRAINT `stream_subjects_subjectId_fkey` FOREIGN KEY (`subjectId`) REFERENCES `subjects`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `news` ADD CONSTRAINT `news_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_form_sequences` ADD CONSTRAINT `exam_form_sequences_examId_fkey` FOREIGN KEY (`examId`) REFERENCES `exams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_form_sequences` ADD CONSTRAINT `exam_form_sequences_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exam_form_sequences` ADD CONSTRAINT `exam_form_sequences_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
