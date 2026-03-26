-- Add Google SSO fields to users table
-- authProvider: 'local' for username/password, 'google' for Google SSO
-- googleId: Google sub claim (unique per Google account)

ALTER TABLE `users`
  ADD COLUMN `googleId` VARCHAR(200) NULL,
  ADD COLUMN `authProvider` VARCHAR(20) NULL DEFAULT 'local';

ALTER TABLE `users`
  ADD UNIQUE INDEX `users_googleId_key` (`googleId`);
