/*
  Warnings:

  - Added the required column `collegeNo` to the `institutes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `udiseNo` to the `institutes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `category` to the `subjects` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `institutes` ADD COLUMN `acceptingApplications` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `city` VARCHAR(100) NULL,
    ADD COLUMN `collegeNo` VARCHAR(20) NOT NULL,
    ADD COLUMN `district` VARCHAR(100) NULL,
    ADD COLUMN `pincode` VARCHAR(10) NULL,
    ADD COLUMN `taluka` VARCHAR(100) NULL,
    ADD COLUMN `udiseNo` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `subjects` ADD COLUMN `category` VARCHAR(30) NOT NULL;

-- CreateTable
CREATE TABLE `teachers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `fullName` VARCHAR(150) NOT NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(20) NULL,
    `nationality` VARCHAR(100) NULL,
    `governmentId` VARCHAR(100) NULL,
    `qualification` VARCHAR(255) NULL,
    `subjectSpecialization` VARCHAR(150) NULL,
    `certifications` TEXT NULL,
    `designation` VARCHAR(100) NULL,
    `appointmentDate` DATETIME(3) NULL,
    `appointmentType` VARCHAR(50) NULL,
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
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `teachers_instituteId_idx`(`instituteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `institute_stream_subjects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `instituteId` INTEGER NOT NULL,
    `streamId` INTEGER NOT NULL,
    `subjectId` INTEGER NOT NULL,
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
