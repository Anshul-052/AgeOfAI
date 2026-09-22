-- Local drafting queue metadata. The queue remains private behind the server
-- database connection and the existing RLS policy.
ALTER TABLE "IngestedCandidate"
  ADD COLUMN IF NOT EXISTS "draftProvider" TEXT,
  ADD COLUMN IF NOT EXISTS "draftModel" TEXT,
  ADD COLUMN IF NOT EXISTS "draftRoute" TEXT,
  ADD COLUMN IF NOT EXISTS "draftReason" TEXT,
  ADD COLUMN IF NOT EXISTS "draftMetricsJson" TEXT,
  ADD COLUMN IF NOT EXISTS "draftRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "draftStartedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "draftCompletedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "draftError" TEXT,
  ADD COLUMN IF NOT EXISTS "draftAttempts" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "IngestedCandidate" DROP CONSTRAINT IF EXISTS "IngestedCandidate_status_valid";
ALTER TABLE "IngestedCandidate" ADD CONSTRAINT "IngestedCandidate_status_valid"
  CHECK ("status" IN ('pending', 'queued', 'drafting', 'drafted', 'failed', 'published', 'rejected'));

CREATE INDEX IF NOT EXISTS "IngestedCandidate_draftRequestedAt_idx"
  ON "IngestedCandidate"("draftRequestedAt")
  WHERE "status" = 'queued';
