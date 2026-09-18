# AgeOfAI — Weekly Technology Broadsheet

A weekly general-tech newspaper for engineers, students, and technologists, published every **Sunday**. It features a responsive broadsheet reading experience, permanent searchable archives, an evidence-gated autonomous editor, interactive AI tutoring, newsletter dispatches, Supabase PostgreSQL, and PWA offline reading.

The current product direction is a domain-by-domain map of technology with permanent discovery and bookmarks. The autonomous, evidence-gated publishing workflow is documented in [AI_EDITOR.md](./AI_EDITOR.md).

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in your keys:

```env
# Supabase session pooler for local development and migrations
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres?sslmode=require"
DATABASE_POOL_SIZE="1"

# Google Gemini API Key (Powers AI story drafting & "Ask the Engineer" AI Tutor)
GEMINI_API_KEY="AIzaSyYourGeminiKeyHere"
GEMINI_MODEL="gemini-flash-latest"
GEMINI_FALLBACK_MODEL="gemini-flash-lite-latest"

# Current search and independent corroboration for the autonomous editor
TAVILY_API_KEY="tvly-..."

# Resend API Key (Optional: Powers weekly broadsheet HTML newsletter dispatches)
RESEND_API_KEY="re_123456789"
NEWSLETTER_FROM="AgeOfAI <newsletter@example.com>"
NEWSLETTER_UNSUBSCRIBE_SECRET="replace-with-at-least-32-random-characters"

# Product Hunt API Token (Optional: Powers product/startup ingestion for Web Development domain)
PRODUCT_HUNT_TOKEN="ph_abc123..."

# Base URL for newsletter links & OpenGraph cards
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

---

## 🐘 Supabase PostgreSQL

The application uses a server-side Prisma connection to Supabase PostgreSQL. The browser never receives database credentials and the migration disables Data API access to application tables with revoked grants and Row Level Security.

1. In the Supabase project dashboard, choose **Connect → Session pooler** and copy the port `5432` URI for local development and migrations.
2. Replace `[YOUR-PASSWORD]`, percent-encoding reserved characters, and save it as `DATABASE_URL` in `.env`.
3. Apply the checked-in migration:

   ```powershell
   npx --yes supabase@latest db push --db-url "$env:DATABASE_URL"
   ```

4. Preview and then copy the existing SQLite publication into the new database:

   ```powershell
   node node_modules/tsx/dist/cli.mjs scripts/migrate-sqlite-to-supabase.ts
   node node_modules/tsx/dist/cli.mjs scripts/migrate-sqlite-to-supabase.ts --apply
   ```

5. For serverless deployment, use the transaction pooler URI on port `6543`, retain `DATABASE_POOL_SIZE="1"`, and add `pgbouncer=true` if required by the hosting connection.

PostgreSQL archive search uses `to_tsvector`, `plainto_tsquery`, `ILIKE`, and a GIN search index. A separate generated SQLite client keeps existing local data and isolated tests usable while Supabase is being connected; public deployments must use PostgreSQL.

---

## 🛠️ Setup & Local Running

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Migration & Sync**
   ```bash
   npx --yes supabase@latest db push --db-url "$DATABASE_URL"
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## 🌟 Key Features

1. **Digital Broadsheet Reader**: Interactive page flipbook (`FlipBook.tsx`) with custom newspaper typography and dynamic layout templates (`lead-story-focus`, `two-column-grid`, `editorial-and-drama-split`). Closed-book opening animation, edge-to-edge fullscreen, event-isolated inner scroll.

2. **Autonomous Evidence-Gated Editor**: Discovers candidates across 27 fields, rejects weak and duplicate material, requires independent corroboration, validates claim-level citations, and atomically publishes only qualifying editions.

3. **"Ask the Engineer" AI Tutor**: Interactive concept explanation drawer on every story card (`ExplainModal.tsx`), providing engineers with technical breakdowns, code snippets, and token-budget tracking.

4. **Weekly Newsletter Dispatch**: Formats issues into table-based HTML dispatches via Resend API (`/api/admin/dispatch-newsletter`) with one-click subscriber management.

5. **AI Broadsheet Cover Art**: Generates custom woodcut-style broadsheet cover artwork for top headlines (`image-gen.ts`).

6. **Private Supabase PostgreSQL**: Uses pooled server-side connections, reproducible migrations, full-text indexes, integrity constraints, revoked Data API grants, and RLS defense in depth.

7. **Student Study Bookmarks & Exports**: Save articles to client-side study collection (`/bookmarks`), with one-click export to **Markdown (`.md`)** and **Printable Broadsheet PDF**.

8. **Dynamic OpenGraph & PWA Support**: `@vercel/og` image generator (`/api/og`) for social links, plus Service Worker (`/sw.js`) and Offline Indicator banner.

---

## 📰 Domain / Section Model

The publication covers **27 technology domains**. `src/lib/domains.json` is the canonical registry for labels, descriptions, discovery queries, navigation, archive filters, and editor coverage. Adding or refining a domain there updates the product consistently.

The responsive reading stream is the default interface. Wide screens can optionally open the page-turn view; phones and reduced-motion users retain the normal reading flow.

---

## 🔌 Ingestion Sources (9 Total)

| Source | Domains Covered | Type | Auth Required | Notes |
|--------|-----------------|------|---------------|-------|
| **arXiv** | LLMs, Robotics, Cybersecurity, Research, Drama | API (Atom/XML) | No | `cs.AI`, `cs.CL`, `cs.LG`, `cs.CV` |
| **HuggingFace Daily Papers** | LLMs, Research, Drama | REST JSON | No | Top 15 daily papers |
| **GitHub Trending** | Tools, Startups & Funding, Web Dev | REST JSON | No | ML/AI topic repos, 15 per run |
| **Hacker News** | Web Development, Startups & Funding, Tools | Firebase API | No | Top 30 stories, fetched per-item |
| **Product Hunt** | Web Development, Startups & Funding | GraphQL | **Yes** (`PRODUCT_HUNT_TOKEN`) | Top voted posts from last 7 days |
| **Gaming RSS** | Gaming | RSS/XML (multi-feed) | No | Gamasutra, GamesIndustry, Polygon, Kotaku |
| **Crypto RSS** | Crypto & Web3 | RSS/XML (multi-feed) | No | CoinDesk, The Block, Decrypt, CoinTelegraph |
| **Mobile RSS** | Mobile | RSS/XML (multi-feed) | No | Apple Dev, Android Dev, MWL, PhoneArena |
| **Hardware RSS** | Hardware | RSS/XML (multi-feed) | No | AnandTech, Tom's Hardware, The Register, Ars Technica |

---

## 📄 License

MIT — Free for educational and commercial use.
