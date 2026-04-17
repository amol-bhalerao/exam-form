-- Allow one login user to manage multiple student profiles.
ALTER TABLE "students"
ADD COLUMN IF NOT EXISTS "managerUserId" INTEGER;

CREATE INDEX IF NOT EXISTS "students_managerUserId_idx" ON "students"("managerUserId");

ALTER TABLE "students"
ADD CONSTRAINT "students_managerUserId_fkey"
FOREIGN KEY ("managerUserId") REFERENCES "users"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
