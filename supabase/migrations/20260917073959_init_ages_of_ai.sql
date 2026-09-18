-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Issue" (
    "id" TEXT NOT NULL,
    "editionKey" TEXT,
    "volume" TEXT NOT NULL,
    "issueNumber" INTEGER NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "layout" TEXT NOT NULL DEFAULT 'lead-story-focus',
    "coverImageUrl" TEXT,
    "coverImagePrompt" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Issue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Story" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "crux" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "imageUrl" TEXT,
    "videoUrl" TEXT,
    "domain" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "evidenceJson" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'legacy',
    "publishedAt" TIMESTAMP(3) NOT NULL,
    "issueId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TokenUsage" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'google',
    "modelName" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "promptTokens" INTEGER NOT NULL,
    "candidateTokens" INTEGER NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'ai-draft',
    "domain" TEXT,
    "isCacheHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TokenUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestedCandidate" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "rawTitle" TEXT NOT NULL,
    "rawContent" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "draftJson" TEXT,
    "suggestedDomain" TEXT,
    "fetchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IngestedCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResponseCache" (
    "id" TEXT NOT NULL,
    "contentHash" TEXT NOT NULL,
    "draftJson" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResponseCache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "subscribedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Subscriber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_StoryToTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_StoryToTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Issue_editionKey_key" ON "Issue"("editionKey");

-- CreateIndex
CREATE UNIQUE INDEX "Story_sourceUrl_key" ON "Story"("sourceUrl");

-- CreateIndex
CREATE INDEX "Story_domain_idx" ON "Story"("domain");

-- CreateIndex
CREATE INDEX "Story_publishedAt_idx" ON "Story"("publishedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");

-- CreateIndex
CREATE INDEX "TokenUsage_domain_idx" ON "TokenUsage"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "IngestedCandidate_contentHash_key" ON "IngestedCandidate"("contentHash");

-- CreateIndex
CREATE INDEX "IngestedCandidate_status_idx" ON "IngestedCandidate"("status");

-- CreateIndex
CREATE UNIQUE INDEX "ResponseCache_contentHash_key" ON "ResponseCache"("contentHash");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_email_key" ON "Subscriber"("email");

-- CreateIndex
CREATE INDEX "_StoryToTag_B_index" ON "_StoryToTag"("B");

-- AddForeignKey
ALTER TABLE "Story" ADD CONSTRAINT "Story_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "Issue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryToTag" ADD CONSTRAINT "_StoryToTag_A_fkey" FOREIGN KEY ("A") REFERENCES "Story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_StoryToTag" ADD CONSTRAINT "_StoryToTag_B_fkey" FOREIGN KEY ("B") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Editorial integrity constraints
ALTER TABLE "Issue" ADD CONSTRAINT "Issue_issueNumber_positive" CHECK ("issueNumber" > 0);
ALTER TABLE "Story" ADD CONSTRAINT "Story_severity_valid" CHECK ("severity" IN ('normal', 'notable', 'major'));
ALTER TABLE "IngestedCandidate" ADD CONSTRAINT "IngestedCandidate_status_valid" CHECK ("status" IN ('pending', 'drafted', 'published', 'rejected'));
ALTER TABLE "Subscriber" ADD CONSTRAINT "Subscriber_status_valid" CHECK ("status" IN ('active', 'unsubscribed'));

-- Accelerate full-text archive search.
CREATE INDEX "Story_search_idx"
ON "Story" USING GIN (to_tsvector('english', "title" || ' ' || "crux"));

-- The application uses a server-side PostgreSQL connection. Keep every table
-- private from the Supabase Data API and use RLS as defense in depth.
ALTER TABLE "Issue" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Story" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tag" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "TokenUsage" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "IngestedCandidate" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ResponseCache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscriber" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "_StoryToTag" ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
