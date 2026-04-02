-- AddColumn examApplicationLimit to institutes table
ALTER TABLE `institutes` ADD COLUMN `examApplicationLimit` INT DEFAULT 100;
