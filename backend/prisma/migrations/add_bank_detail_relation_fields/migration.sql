ALTER TABLE `fee_reimbursement`
  MODIFY COLUMN `accountHolder` VARCHAR(100) NULL,
  ADD COLUMN IF NOT EXISTS `accountHolderRelation` VARCHAR(20) NULL AFTER `accountHolder`;
