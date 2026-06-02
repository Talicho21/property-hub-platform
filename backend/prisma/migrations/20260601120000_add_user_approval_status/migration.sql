-- Add approval status for landlord onboarding
ALTER TABLE "User"
ADD COLUMN "isApproved" BOOLEAN NOT NULL DEFAULT true;

UPDATE "User"
SET "isApproved" = false
WHERE "role" = 'LANDLORD';