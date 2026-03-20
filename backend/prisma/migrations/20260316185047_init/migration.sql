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
    `name` VARCHAR(200) NOT NULL,
    `code` VARCHAR(50) NULL,
    `address` TEXT NULL,
    `contactPerson` VARCHAR(100) NULL,
    `contactEmail` VARCHAR(150) NULL,
    `contactMobile` VARCHAR(15) NULL,
    `status` ENUM('APPROVED', 'PENDING', 'REJECTED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
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
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_roleId_idx`(`roleId`),
    INDEX `users_instituteId_idx`(`instituteId`),
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

    UNIQUE INDEX `streams_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `code` VARCHAR(20) NOT NULL,

    UNIQUE INDEX `subjects_code_key`(`code`),
    INDEX `subjects_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exams` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(150) NOT NULL,
    `academicYear` VARCHAR(20) NOT NULL,
    `session` VARCHAR(30) NOT NULL,
    `streamId` INTEGER NOT NULL,
    `applicationOpen` DATETIME(3) NOT NULL,
    `applicationClose` DATETIME(3) NOT NULL,
    `lateFeeClose` DATETIME(3) NULL,
    `instructions` TEXT NULL,
    `createdByUserId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `exams_streamId_idx`(`streamId`),
    INDEX `exams_applicationOpen_applicationClose_idx`(`applicationOpen`, `applicationClose`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `students` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `userId` INTEGER NULL,
    `firstName` VARCHAR(100) NULL,
    `middleName` VARCHAR(100) NULL,
    `lastName` VARCHAR(100) NULL,
    `motherName` VARCHAR(100) NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `aadhaar` VARCHAR(20) NULL,
    `address` TEXT NULL,
    `pinCode` VARCHAR(10) NULL,
    `mobile` VARCHAR(15) NULL,
    `streamCode` VARCHAR(10) NULL,
    `minorityReligionCode` VARCHAR(10) NULL,
    `categoryCode` VARCHAR(10) NULL,
    `divyangCode` VARCHAR(10) NULL,
    `mediumCode` VARCHAR(10) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `students_userId_key`(`userId`),
    INDEX `students_instituteId_idx`(`instituteId`),
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
    `accountHolder` VARCHAR(20) NULL,

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

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_streamId_fkey` FOREIGN KEY (`streamId`) REFERENCES `streams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `exams` ADD CONSTRAINT `exams_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `students` ADD CONSTRAINT `students_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

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
