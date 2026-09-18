CREATE TABLE "NewsletterDelivery" (
  "id" TEXT NOT NULL,
  "issueId" TEXT NOT NULL,
  "subscriberId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "attemptId" TEXT,
  "providerId" TEXT,
  "lastError" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "NewsletterDelivery_status_valid" CHECK ("status" IN ('pending', 'sending', 'sent', 'failed')),
  CONSTRAINT "NewsletterDelivery_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "NewsletterDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "NewsletterDelivery_issueId_subscriberId_key" ON "NewsletterDelivery"("issueId", "subscriberId");
CREATE INDEX "NewsletterDelivery_status_idx" ON "NewsletterDelivery"("status");

ALTER TABLE "NewsletterDelivery" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE "NewsletterDelivery" FROM anon, authenticated;
