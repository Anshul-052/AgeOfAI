# AgeOfAI implementation status

Updated: 2026-09-18. Product source of truth: `AGEOFAI_MASTER_SPECIFICATION.md`. The user's later instruction adds an autonomous editor and expands coverage beyond the original specification.

## Current product direction

AgeOfAI is a weekly, evidence-checked technology magazine covering 27 fields. Readers get a fast front page, permanent issue and topic archives, full-text search, story pages with source evidence, and local bookmarks. The default experience is a responsive reading stream; the broadsheet page-turn view remains available on wide screens and is disabled on mobile and for reduced-motion users.

The publication workflow is evidence-gated and ends with an administrator decision. A weekly editor discovers recent stories from configured feeds and search, rejects stale, promotional, irrelevant, and duplicate items, requires independent corroboration, drafts only from the gathered evidence, validates every draft, and stages a private issue atomically. It refuses to create an edition that does not meet the configured quality threshold. Only the protected admin publish button can make an issue public.

## Implemented

- A shared 27-domain registry drives navigation, filters, admin forms, archive sections, and the editor.
- `scripts/ai-editor.ts` supports zero-cost scan, safe preview, and production edition modes. It records source evidence, claim-to-source links, uncertainties, verification state, model provenance, and run diagnostics.
- Without Tavily, the editor discovers and corroborates through specialist feeds and Google News RSS while preserving the two-independent-publisher requirement. Tavily remains an optional deeper verifier.
- Weekly editions use a unique edition key, so a scheduler retry cannot create a duplicate issue.
- Public queries consistently hide unpublished issues and stories.
- The homepage highlights a concise set of strong stories instead of rendering the whole database as one feed.
- Issue, story, topic, search, bookmark, and issue-archive pages have been rebuilt around permanent discovery and reading.
- Search supports query, domain, time-period, sort, and pagination controls.
- Source-checked stories expose their evidence on the story page. New reports target 600–1,000 words, while archive cards show concise previews. Bookmarks stay synchronized between visible cards.
- Stories use original publisher images discovered from feeds or source-page metadata. Unverified AI and stock-image URLs are rejected.
- The responsive broadsheet layout has mobile touch targets, a sticky section picker, desktop domain navigation, reduced-motion behavior, and no document-level horizontal overflow at the tested widths.
- Newsletter issue links now use the issue identifier, and generated email content is escaped with validated URLs.
- Legacy admin pages, admin APIs, AI drafting, and story/issue mutations are disabled by default. Setting `ADMIN_ACCESS_KEY` enables Basic or Bearer authentication for temporary access.
- The Supabase PostgreSQL schema and newsletter-safety migrations are live. They add unique ingestion/story constraints, status checks, a full-text GIN index, RLS on every application table, revoked Data API grants, restrictive default privileges, and idempotent newsletter delivery records.
- `scripts/migrate-sqlite-to-supabase.ts` transactionally copied the existing publication into Supabase without deleting target data and remains available for repeatable previews.
- Newsletter unsubscribe links use HMAC signatures, dispatches require complete configuration, and per-subscriber delivery records plus Resend idempotency keys prevent duplicate sends on retries.
- Inbox approval is transactional, accepts a selected draft or published issue, validates fields, prevents duplicate publication, and invalidates affected pages.
- Draft issues remain invisible on all public pages until the protected admin confirmation publishes them in one transaction.
- Offline caching excludes private/admin/API traffic, RSC payloads, and third-party requests.
- A GitHub Actions workflow is ready to prepare a private draft every Sunday at 09:00 Asia/Kolkata, prevent overlapping runs, support manual runs, and retain editorial reports for 30 days.

See `AI_EDITOR.md` for activation, environment variables, output guarantees, and scheduling.

## Verification

- A clean Next.js 16.3.5 production build passed against the live Supabase database on 2026-09-18.
- ESLint and TypeScript validation passed.
- Nine regression tests passed: admin Bearer/Basic credentials and disabled-by-default behavior; transactional publication and rollback; signed unsubscribe-token validation; private cache exclusion; correct offline page and asset handling.
- Editor scan and preview runs completed without mutating the database.
- Gemini `gemini-flash-latest` was verified with a successful live response. The editor completed a real two-source LLM draft in preview mode without Tavily and recorded the model used.
- A zero-AI scan fetched 1,915 qualified candidates across all 27 domain searches and feeds; low-quality publisher and promotional filters were tightened from the report.
- The SQLite-to-Supabase transfer completed with 2 issues, 23 stories, 28 tags, 115 ingested candidates, and 1 response-cache record with no duplicate story URLs or candidate hashes.
- Live database verification confirmed all migrated counts, both migration versions, RLS on all nine application tables, no `anon` or `authenticated` table grants, and the required search, deduplication, and newsletter indexes. Supabase database lint and performance advisors reported no errors or warnings.
- Responsive production checks cover 390, 768, and 1440 CSS-pixel viewports.
- Production HTTP checks returned `200` for the homepage, issue archive, search, story page, and public APIs; protected story mutation, AI drafting, and the disabled admin page returned `404`.
- Next.js and React were upgraded to current patched releases. The dependency audit now reports no critical advisories; remaining reported packages belong to Prisma's local development CLI dependency tree rather than public request handlers.
- No newsletter dispatch, database reseed, public deployment, or real edition publication was performed.

## Activation and launch work

1. Choose the public deployment target and configure its production environment: the Supabase transaction-pooler URL, Gemini key/model, and final `NEXT_PUBLIC_SITE_URL`.
2. Connect the project to GitHub and add `DATABASE_URL` plus `GEMINI_API_KEY` repository secrets to activate the checked-in Sunday editor workflow.
3. Configure `RESEND_API_KEY`, `NEWSLETTER_FROM`, and a 32+ character `NEWSLETTER_UNSUBSCRIBE_SECRET`, then send one private test delivery before accepting public subscribers.
4. Add Tavily when available for deeper discovery and parsed evidence. The editor already operates with specialist feeds and Google News RSS.
5. Set a long random `ADMIN_ACCESS_KEY` in Vercel. This is required to open `/admin` and perform the final publication approval.
6. Add deployment backups, uptime/error monitoring, CI, and final cross-device accessibility checks. Establish project-scoped version control before connecting a deployment provider; Git currently resolves above this project, so unrelated parent files must not be staged.

## Later roadmap

- Placement syllabus categories and a weekly five-question cheat sheet.
- Living-story relationships with chronological timelines.
- PostgreSQL hybrid semantic search and related stories.
- Opt-in domain notifications with weekly scarcity limits.
- Multilingual editions, campus print exports, and interactive system-design learning.
