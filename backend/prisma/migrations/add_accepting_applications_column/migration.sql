-- AddColumn acceptingApplications to institutes table
ALTER TABLE `institutes` ADD COLUMN `acceptingApplications` BOOLEAN DEFAULT true;
