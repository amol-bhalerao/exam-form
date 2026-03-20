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

-- AddForeignKey
ALTER TABLE `institute_invites` ADD CONSTRAINT `institute_invites_instituteId_fkey` FOREIGN KEY (`instituteId`) REFERENCES `institutes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `institute_invites` ADD CONSTRAINT `institute_invites_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
