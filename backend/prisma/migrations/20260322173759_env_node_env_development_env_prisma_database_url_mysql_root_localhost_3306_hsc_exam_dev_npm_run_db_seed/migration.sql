/*
  Warnings:

  - You are about to drop the column `appointmentType` on the `teachers` table. All the data in the column will be lost.
  - You are about to alter the column `governmentId` on the `teachers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(100)` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE `institutes` ADD COLUMN `examApplicationLimit` INTEGER NULL DEFAULT 100;

-- AlterTable
ALTER TABLE `teachers` DROP COLUMN `appointmentType`,
    ADD COLUMN `casterCategory` VARCHAR(50) NULL,
    ADD COLUMN `certificates` TEXT NULL,
    ADD COLUMN `leavingDate` DATETIME(3) NULL,
    ADD COLUMN `leavingNote` TEXT NULL,
    ADD COLUMN `serviceStartDate` DATETIME(3) NULL,
    ADD COLUMN `teacherType` VARCHAR(50) NULL,
    MODIFY `governmentId` VARCHAR(20) NULL;

-- CreateIndex
CREATE INDEX `teachers_governmentId_idx` ON `teachers`(`governmentId`);

-- CreateIndex
CREATE INDEX `teachers_teacherType_idx` ON `teachers`(`teacherType`);
