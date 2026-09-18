# AgeOfAI — MASTER PROJECT SPECIFICATION & ARCHITECTURAL BIBLE
### The Definitive Manual: History, Philosophy, Present Architecture, Tech Stack, Methodology, Build Instructions, and Future Vision

---

## 2026-09-17 Product Directive Addendum

This directive supersedes older passages where they conflict with it:

- **Elevator pitch:** AgeOfAI is the evidence-checked technology magazine that helps readers follow developments across almost every technology field, save useful stories, and find them again at any time.
- **Coverage:** the canonical domain registry now contains 27 fields rather than the original 14. Product navigation, archives, filters, and editorial automation use that shared registry.
- **Editorial operation:** the primary workflow is an autonomous weekly editor because no permanent human editor is available. It may publish only when it has current evidence, at least two independent publisher domains for each selected development, claim-level source links, valid structured drafts, and enough qualified stories for the edition. Otherwise it must refuse publication and produce a diagnostic report.
- **Reader experience:** permanent discovery, source transparency, search, and bookmarks are first-class product capabilities. The responsive reading stream is the default on phones and laptops. Page-turn presentation is optional on capable wide screens and must respect reduced-motion preferences.
- **Implementation references:** `AI_EDITOR.md` defines editor activation and guarantees. `IMPLEMENTATION_STATUS.md` records what is implemented and what remains before public launch.

## 1. Executive Summary & Project Identity

### 1.1 Project Overview
**AgeOfAI** is a weekly digital broadsheet newspaper and curated knowledge archive engineered specifically for computer science and engineering students, early-career software developers, and technical practitioners. Published every **Sunday**, the publication synthesizes the rapidly shifting artificial intelligence and broader software engineering landscape into an intellectually rigorous, editorial-grade format.

Rather than delivering ephemeral social media snippets or generalist daily email digests, AgeOfAI combines the tactile, focused experience of a physical broadsheet newspaper with modern web performance, permanent topic indexing, multi-source automated intelligence ingestion, and interactive AI-driven technical tutoring.

```
+-----------------------------------------------------------------------------+
|                                  AgeOfAI                                    |
|            Official Sunday Edition • Technology & Engineering               |
| Vol. IV | Issue 12             New Delhi, India           Price: Free       |
+-----------------------------------------------------------------------------+
| [ FRONT PAGE HEADLINES ]  |  [ DOMAIN ARCHIVES ]    | [ THE BACK PAGE ]     |
| • Scaled LLM Architectures|  • LLMs, Robotics, Sec  | • Boardroom Coups     |
| • Electric Humanoid Robots|  • Hardware, Web, Crypto| • Benchmark Wars      |
| • Test-Time Compute Wars  |  • Tools & Research     | • Model Weight Leaks  |
+-----------------------------------------------------------------------------+
| Interactive Flipbook • 14 Domains • 9 Ingest Sources • "Ask the Engineer"  |
+-----------------------------------------------------------------------------+
```

### 1.2 Core Philosophy: "Digital Broadsheet for the Intelligence Age"
The project is built on four non-negotiable principles:
1. **Depth Over Noise**: AI moves too quickly for uncurated feeds. Students are constantly overwhelmed by Twitter/X threads, LinkedIn engagement-bait, and sensationalized headlines. AgeOfAI trades "breaking news by 30 seconds" for "worth reading and understanding deeply."
2. **Permanent Utility, Not Disposable Email**: Conventional newsletters die in user inboxes after 24 hours. In AgeOfAI, every published story is permanently indexed by topic, domain, technology tag, and severity in an optimized database. An article published six months ago on Retrieval-Augmented Generation (RAG) remains discoverable, cross-referenced, and continuously updated.
3. **Physical Metaphor in a Digital Medium**: The reading interface rejects generic SaaS dashboards, endless vertical doomscrolling, and modern digital clutter. It embraces high-contrast serif typography, multi-column print grids, hairline borders, halftone monochrome imagery, and a skeuomorphic page-flip animation that mimics holding a Sunday broadsheet.
4. **Student-Centric Engineering Framing**: Every news item is framed through the lens of employability, system design interviews, and foundational engineering principles rather than corporate marketing or venture capital PR.

### 1.3 Target Audience Personas
* **Primary Persona: The Final-Year / Pre-Final-Year Engineering Student**: Preparing for campus placements, software engineering interviews, and technical screenings. Needs to speak fluently about modern AI developments (e.g., Mixture-of-Experts, FlashAttention, context window scaling, autonomous security agents) with genuine architectural depth rather than surface buzzwords.
* **Secondary Persona: The Early-Stage Developer & Junior Technologist**: Building core technical literacy, seeking curated open-source tools, hackathons, cloud credits, and understanding how foundational systems (operating systems, networking, compilers) intersect with AI hardware and models.
* **Tertiary Persona: The Academic & Research Enthusiast**: Tracking arXiv preprints, benchmark validity, and algorithmic breakthroughs across computer vision, natural language processing, and robotics.

---

## 2. Project History & Evolution: Origin to Present Day

### 2.1 The Origin Problem (Why Incumbents Fail Students)
The daily AI newsletter market is mature and dominated by major players:
* **The Rundown AI** (~2M+ subscribers): Optimized for business executives, non-technical professionals, and general productivity tool roundups.
* **TLDR AI** (~1.1M+ subscribers): Quick 3-minute link curation; useful for surface awareness, but disposable and devoid of deep technical analysis.
* **Superhuman AI** (~1.5M+ subscribers): Focused heavily on consumer AI apps, prompt hacks, and marketing workflows.

**The Failure Mode for Students**:
* **Lack of Technical Rigor**: Existing digests explain *that* a model was released, but never *how* the attention mechanism was modified, how memory footprints were optimized, or what trade-offs were made.
* **Disposable Architecture**: Newsletters live in email clients. When a student prepares for an interview on "Vector Databases" three months later, searching through an email inbox is completely ineffective.
* **Geographic & Economic Disconnect**: Global newsletters focus heavily on Silicon Valley funding rounds and enterprise pricing ($20–$200/month tools), ignoring student realities, Indian engineering placement dynamics, and open-source local inference alternatives.

### 2.2 Phase 0: Design Ideation & The Stitch Digital Broadsheet
The visual and stylistic foundation was established through a series of bespoke design prototypes created in Stitch (`stitch_ageofai_digital_broadsheet`). 

Key design breakthroughs from this phase:
* Creation of the **Digital Broadside** aesthetic: warm newsprint backgrounds (`#fdfae8`), rich charcoal ink (`#1c1c11`), oxblood highlight accents (`#ba1a1a`), and muted ruled lines (`#D1CEBD`).
* Typography specification combining **Playfair Display** (commanding broadsheet headlines), **Source Serif 4** (high-legibility editorial body text), and **Archivo Narrow** (datelines, tags, metadata, and stamps).
* The **Halftone Image Filter**: Applying grayscale, high-contrast, and simulated radial dot matrix effects to modern digital photos to make them appear ink-stamped onto paper.
* Structural separation of the front page (hero stories) from inner domains and the back page (industry drama and controversies).

### 2.3 Phase 1: The Claude & PostgreSQL MVP
The initial software implementation established:
1. **Next.js 14 App Router** foundation in TypeScript.
2. **Prisma ORM** mapping `Issue`, `Story`, and `Tag` models.
3. Native PostgreSQL full-text search utilizing `tsvector('english', title || ' ' || crux)` and `plainto_tsquery`.
4. The Anthropic **Claude API** integration for automated crux generation and tag extraction.
5. First implementation of `react-pageflip` to test realistic digital page-turning.

### 2.4 Phase 1.5: Gemini Migration, Token Auditing & SHA-256 Caching
As editorial volume scaled, reliance on third-party drafting necessitated radical cost and speed optimization:
* Transitioned the primary AI engine to **Google Gemini 1.5 Flash**, reducing drafting latency by ~70% and drastically reducing API costs.
* Implemented the **SHA-256 Response Caching Engine** (`ResponseCache` table). Raw ingested content is hashed before invoking an LLM. If identical content was previously processed, the cached draft is returned with **zero token consumption**.
* Built the **TokenUsage Audit System** to track prompt tokens, candidate tokens, total tokens, provider metadata, and cache-hit ratios per domain in real time.

### 2.5 Phase 2: The Multi-Source Ingestion Engine & Admin Inbox
To transition AgeOfAI from a purely manual editorial tool into an intelligent news aggregation system, an automated 9-source ingestion pipeline was engineered:
* Automated polling of **arXiv** (Atom/XML for CS research), **Hugging Face Daily Papers**, **GitHub Trending**, **Hacker News Firebase API**, **Product Hunt GraphQL API**, and 4 specialized RSS clusters (Gaming, Crypto/Web3, Mobile, Hardware).
* Ingested items populate an **Editorial Inbox** (`/admin/inbox`) in a `pending` state, allowing human editors to batch-review, edit AI drafts, adjust severity, and publish with a single click.

### 2.6 Phase 2.5: 14-Domain Expansion & Broadsheet Reflow
The editorial scope expanded from 6 AI domains to **14 comprehensive technology domains**, structured into a 3-tier broadsheet layout per domain page:
1. **Lead Story**: High-priority investigative breakdown with image or video embed.
2. **In Brief**: 3 to 5 rapid-fire bullet items covering fast updates.
3. **Deeper Look**: An analytical focus card examining algorithmic trade-offs, benchmarks, or interview questions.

Additional capabilities integrated during this phase:
* **"Ask the Engineer" AI Tutor**: Interactive drawer on every story card allowing students to ask technical questions and receive structured explanations with code snippets.
* **Newsletter Dispatch Engine**: Converts weekly issues into responsive, table-based HTML emails distributed via the **Resend API**.
* **Student Study Bookmarks**: Client-side collection saving stories with one-click export to Markdown (`.md`) and printable broadsheet PDF.
* **Progressive Web App (PWA) & Offline Reading**: Service worker (`sw.js`) caching assets and articles for offline access with an active network indicator.

### 2.7 Present Day Architecture
AgeOfAI operates as a hybrid platform:
* **Dual-Engine Database Layer**: Seamlessly switches between local zero-config **SQLite** (`dev.db` via `@prisma/adapter-better-sqlite3`) and production cloud **PostgreSQL** (Neon, Supabase, Railway via `@prisma/adapter-pg`) based on runtime protocol inspection.
* **Zero-Failure Fallbacks**: If AI APIs (Gemini/Claude) are unavailable or rate-limited, intelligent heuristic drafters take over without crashing the system.
* **Strict Human-in-the-Loop Governance**: AI generates first-pass drafts, but human editors retain final approval before any story enters the public archive or newsletter.

---

## 3. Core Vision & Strategic Future Roadmap

```
+-------------------------------------------------------------------------+
|                           AgeOfAI ROADMAP                               |
+-------------------+--------------------+--------------------------------+
| PHASE 1 & 2       | PHASE 3            | PHASE 4                        |
| (COMPLETED)       | (NEAR-TERM)        | (LONG-TERM SCALE)              |
+-------------------+--------------------+--------------------------------+
| • Digital Broadsheet | • Placement Syllabus | • Multilingual Bharat AI     |
| • 14 Domains      | • Dynamic Follow-up| • University Print Editions    |
| • 9 Ingest Sources| • pgvector Search  | • Sponsorship / Talent Drops   |
| • SHA-256 Cache   | • Auto-Interview Qs| • Autonomous Multi-Agent Draft |
| • Dual DB Engine  | • Web Push Alerts  | • Interactive System Design    |
+-------------------+--------------------+--------------------------------+
```

### 3.1 Long-Term Mission & Strategic Positioning
AgeOfAI is positioned to become the definitive technical chronicle of the AI revolution for the Indian subcontinent and global engineering students. 

While general tech media chases speculative market valuations and sensational clickbait, AgeOfAI will remain an engineering publication: focusing on model architectures, hardware economics, systems performance, and practical career readiness.

### 3.2 Phase 3: Near-Term Enhancements (In Development)

#### 1. Placement Syllabus & Interview Alignment Engine
* **The Concept**: Automatically cross-reference every major technical story with standard Indian campus placement curricula (IITs, NITs, BITS, and state engineering universities).
* **Implementation**:
  * Tagging stories with interview categories: `System Design`, `DSA / Algorithmic Pattern`, `ML Infra`, `OS & Concurrency`, `Database Internals`.
  * Every weekly issue includes a dedicated "Placement Cheat Sheet" extracting the 5 most critical technical questions an interviewer might ask regarding that week's developments (e.g., *"How does DeepSeek's Multi-Head Latent Attention reduce KV-cache memory pressure compared to standard MHA?"*).

#### 2. Living Stories & Graph-Based Follow-Up Stitching
* **The Problem**: News is non-linear. An announcement this week (e.g., an antitrust suit against OpenAI or an open-source weight release) is a continuation of a story from three months ago.
* **The Solution**:
  * Instead of creating fragmented, disconnected stories, the ingestion engine uses graph relationships (`ParentStoryId`, `FollowUpStoryId`) to append updates to existing story records.
  * Readers can toggle a "Story Timeline" drawer to trace the exact chronological history of a development from origin to current state.

#### 3. Vector Search & Semantic Discovery (`pgvector`)
* **The Concept**: Upgrade PostgreSQL from keyword-based `tsvector` full-text search to hybrid search using `pgvector`.
* **Capabilities**:
  * Semantic queries: *"How are people speeding up transformer inference on edge hardware?"* will match articles on vLLM, quantization (AWQ/GGUF), and Speculative Decoding, even if the exact keyword "edge" was not in the title.
  * "More Stories Like This" recommendation clusters on every article.

#### 4. Automated Placement Mock Interview Generator
* Integration with the "Ask the Engineer" drawer to provide an interactive "Quiz Me on This Story" mode.
* Generates 3 interview-style challenges per story:
  1. *Conceptual*: Explain the mathematical or architectural trade-off.
  2. *Code / Pseudocode*: Write a representative implementation (e.g., implement a toy KV-cache in Python).
  3. *System Design*: How to scale this component under 100k requests/second.

#### 5. Scarcity-Gated Notification Engine
* Web Push and email notifications with strict scarcity gating:
  * Only stories tagged with severity `major` trigger immediate push alerts.
  * Maximum of 1 push alert per domain per week to eliminate notification fatigue.
  * Granular student subscriptions: users can subscribe solely to "Cybersecurity" or "Hardware" major alerts.

### 3.3 Phase 4: Long-Term Scaling & Monetization Vision

#### 1. Multilingual "Bharat AI" Editions
* 70% of engineering students in India come from vernacular language backgrounds where complex technical terminology is taught in English, but conceptual intuition is formed in native tongues (Hindi, Telugu, Tamil, Marathi, Bengali, Kannada).
* Leverage Gemini 1.5's native multilingual fluency to generate parallel vernacular technical editions that explain complex concepts using colloquial analogies without compromising mathematical accuracy.

#### 2. University Campus & Noticeboard Print Distribution
* Generate automated, pre-formatted Sunday print editions in high-resolution PDF format (A3 / Broadsheet dimensions).
* Partner with student developer clubs (GDSC, ACM, IEEE chapters) across 500+ engineering campuses to print and display physical 2-page broadsheets on department noticeboards and library kiosks.

#### 3. Sustainable, Student-First Monetization Model
* **The Core Magazine Remains Free Forever**: No paywalls on the weekly issue or current reporting.
* **Monetization Vectors**:
  1. **Ethical Sponsorships**: Non-intrusive, styled "print advertisement" boxes from developer tooling companies, cloud providers offering student credits, and tech recruiters hiring entry-level talent.
  2. **Pro Placement Vault** (Nominal ₹49–₹99/month): Unlocks comprehensive placement question archives, downloadable system design blueprints, and mock interview video breakdowns.
  3. **Sponsored Hackathons & Talent Drops**: Directly connecting verified student readers who complete weekly technical challenges with hiring engineering teams.

---

## 4. Complete Technology Stack & Architecture

### 4.1 Technology Stack Matrix

| Layer | Technology | Version | Architectural Justification |
|---|---|---|---|
| **Framework** | Next.js (App Router) | 14.2.35 | Server Components for SEO on archive pages, fast server-side rendering, integrated API routes, and native streaming. |
| **Language** | TypeScript | 5.x | Full-stack end-to-end type safety across database models, API payloads, and UI components. |
| **Styling** | Tailwind CSS | 3.4.1 | Utility-first CSS configured with strict broadsheet tokens, zero border-radii, custom ink-on-paper colors, and print utilities. |
| **Page-Flip Engine**| `react-pageflip` (StPageFlip) | 2.0.3 | Canvas/DOM-based 3D skeuomorphic page turn animation delivering the physical newspaper metaphor. |
| **Database ORM** | Prisma ORM | 7.8.0 | Type-safe query building, migration management, and multi-database schema synchronization. |
| **Database Engines**| SQLite / PostgreSQL | Dynamic | Dual-engine support: SQLite (`dev.db`) for zero-config instant local dev; PostgreSQL (Neon/Supabase) for production full-text search. |
| **Driver Adapters** | `@prisma/adapter-better-sqlite3`<br>`@prisma/adapter-pg` | Latest | Runtime driver switching in `src/lib/db.ts` allowing single-codebase execution across local and cloud databases. |
| **Primary AI Model**| Google Gemini 1.5 Flash | REST v1beta | High-speed, cost-effective story drafting, crux summarization, structured JSON tag extraction, and AI tutoring. |
| **Secondary AI** | Anthropic Claude SDK | 0.110.0 | High-reasoning editorial draft fallback for complex paper analysis. |
| **Email Dispatch** | Resend API | REST v1 | Transactional and newsletter email delivery using custom table-based responsive HTML broadsheet templates. |
| **Social Cards** | `@vercel/og` | Next.js Native | Dynamic SVG/PNG OpenGraph card generation for social sharing on Twitter/X, LinkedIn, and WhatsApp. |
| **PWA & Offline** | Service Worker (`sw.js`) | Native Cache API | Offline asset and story caching enabling broadsheet reading without active internet connectivity. |
| **Typography** | Google Fonts | Web Font API | Playfair Display (headlines), Source Serif 4 (body), Archivo Narrow (datelines/stamps). |

### 4.2 System Architecture Diagram

```
                              +-------------------------------------------+
                              |          EXTERNAL INGESTION SOURCES       |
                              |  arXiv • HuggingFace • GitHub • HN • PH   |
                              |  Gaming • Crypto • Mobile • Hardware RSS  |
                              +---------------------+---------------------+
                                                    |
                                    (Scheduled Ingestion Poll)
                                                    v
                                      +---------------------------+
                                      |     src/lib/ingest.ts     |
                                      | • XML/Atom Feed Parsers   |
                                      | • GraphQL / REST Clients  |
                                      +-------------+-------------+
                                                    |
                                          (Raw Ingested Items)
                                                    v
                                      +---------------------------+
                                      |     SHA-256 HASH ENGINE   |
                                      |   computeContentHash()    |
                                      +-------------+-------------+
                                                    |
                         +--------------------------+--------------------------+
                         |                                                     |
             [ Cache Hit (Hash Exists) ]                             [ Cache Miss (New Hash) ]
                         |                                                     |
                         v                                                     v
          +-----------------------------+                       +-----------------------------+
          |     0-TOKEN REUSE ENGINE    |                       |      GOOGLE GEMINI 1.5      |
          | Pulls from ResponseCache    |                       | • Drafts 2-3 paragraph crux |
          | Log 0-token usage telemetry |                       | • Extracts tags & domain    |
          +--------------+--------------+                       | • Suggests severity level   |
                         |                                      +--------------+--------------+
                         |                                                     |
                         |           +-----------------------------------------+
                         |           | (Stores draft & persists TokenUsage)
                         v           v
          +-------------------------------------------------------+
          |             PRISMA ORM / DUAL-ENGINE DB               |
          |       SQLite (dev.db)  <--->  PostgreSQL (Cloud)      |
          |  Tables: Issue, Story, Tag, IngestedCandidate, etc.   |
          +---------------------------+---------------------------+
                                      |
                         (Populates Editorial Inbox)
                                      v
          +-------------------------------------------------------+
          |           EDITORIAL ADMIN WORKFLOW (/admin)           |
          | • Review Pending Drafts    • Edit Crux & Severity     |
          | • Generate Cover Art       • Approve & Publish Issue  |
          +---------------------------+---------------------------+
                                      |
                         (Published Issue Distribution)
                                      |
                 +--------------------+--------------------+
                 |                                         |
                 v                                         v
+---------------------------------+       +---------------------------------+
|      DIGITAL BROADSHEET UI      |       |    RESEND NEWSLETTER DISPATCH   |
| • FlipBook.tsx (Page-Turn)      |       | • Table-based HTML broadsheet   |
| • 14 Reflowed Domain Pages      |       | • Automated subscriber dispatch |
| • "Ask the Engineer" AI Tutor   |       | • Unsubscribe compliance        |
| • Study Bookmarks & PDF Export  |       +---------------------------------+
+---------------------------------+
```

---

## 5. Methodology & Editorial Workflow

### 5.1 The Human-in-the-Loop Editorial Triad
AgeOfAI strictly repudiates "100% autonomous AI journalism." Autonomous LLM scrapers consistently hallucinate technical details, misinterpret benchmark significance, and expose publications to legal and accuracy liabilities.

Every story follows a non-negotiable three-stage pipeline:

```
[ STAGE 1: INGEST ]    ===>  [ STAGE 2: AI DRAFTING ] ===>  [ STAGE 3: HUMAN AUDIT ]
Automated multi-source       Gemini 1.5 Flash drafts        Human editor verifies claims,
crawlers pull raw paper      crux, extracts tags,           edits tone, confirms source,
abstracts & repo metadata.   and suggests severity.         and clicks "Publish".
```

1. **Ingest**: Automated crawlers fetch candidate items across 9 sources, compute their SHA-256 hashes, and save them to `IngestedCandidate`.
2. **AI Drafting**: The system attempts to resolve the draft against `ResponseCache`. On a miss, Gemini 1.5 Flash synthesizes a structured draft (crux, domain, tags, severity). Token consumption is audited in `TokenUsage`.
3. **Human Review**: The story appears in `/admin/inbox`. A human editor verifies claims against the source URL, corrects technical inaccuracies, edits the crux for placement relevance, and explicitly approves publication.

### 5.2 The Back-Page Drama & Controversy Doctrine
Industry feuds, model benchmark controversies, lawsuits, and executive shakeups are placed exclusively in **The Back Page** (`DramaSection.tsx`).

**Editorial Guidelines for Drama**:
* **Visual Isolation**: The back page uses a dedicated warm amber background (`#FEF9E7`), distinct typography, and a heavy border labeled *"THE BACK PAGE: DRAMA & GLITCHES"*.
* **Trust Preservation**: Drama stories are never mixed into verified research or infrastructure pages so that the scientific authority of the hard news remains uncompromised.
* **Liability Mitigation**: Because controversy stories carry defamation and misinformation risks, they are subject to the strictest editorial scrutiny. Claims must cite public court filings, official corporate statements, or primary GitHub/tweet links.

### 5.3 Content Crafting: The "Crux" Standard
AgeOfAI summaries reject generic paper abstracts in favor of the **Crux Standard**:
* **Paragraph 1: The Breakthrough & Architecture**: What fundamentally changed? (e.g., *"Researchers replaced dense softmax attention with a linear recurrent state-space mechanism..."*).
* **Paragraph 2: The Benchmark & Trade-off**: What is the real-world performance cost? Did accuracy drop on needle-in-a-haystack tests? What is the memory footprint?
* **Paragraph 3: The Placement & Industry Takeaway**: Why does an engineering student care? Where would this system be deployed in production?

### 5.4 The 3-Tier Broadsheet Layout Methodology
Every domain section in `broadsheetPages.tsx` follows a three-tier information hierarchy:
1. **Tier 1: Lead Story**: One flagship story dominating the top of the page, featuring a large headline, high-contrast monochrome image or YouTube video embed, and a 4-line drop-cap opening.
2. **Tier 2: In Brief (3–5 Stories)**: A multi-column collection of concise updates with bold lead-ins and direct links to original sources.
3. **Tier 3: Deeper Look**: A shaded, boxed technical analysis card focusing on code patterns, benchmark graphs, or system trade-offs.

---

## 6. Complete Database Schema & Data Models

The Prisma schema (`prisma/schema.prisma`) manages seven core models:

```prisma
// ==========================================
// PRISMA SCHEMA DEFINITION (prisma/schema.prisma)
// ==========================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite" // In production, dynamic adapter connects to PostgreSQL
}

// ------------------------------------------
// 1. ISSUE MODEL (Weekly Broadsheet Edition)
// ------------------------------------------
model Issue {
  id               String   @id @default(cuid())
  volume           String   // e.g., "Volume IV"
  issueNumber      Int      // e.g., 12
  publishedAt      DateTime
  isPublished      Boolean  @default(false)
  layout           String   @default("lead-story-focus") // lead-story-focus, two-column-grid, editorial-and-drama-split
  coverImageUrl    String?  // AI-generated woodcut broadsheet cover art
  coverImagePrompt String?  // Headline prompt used for image generation
  stories          Story[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// ------------------------------------------
// 2. STORY MODEL (Permanent Article Archive)
// ------------------------------------------
model Story {
  id          String   @id @default(cuid())
  title       String
  crux        String   // 2-3 paragraph crux summary in editorial voice
  sourceUrl   String   // Outbound clickable original source
  imageUrl    String?  // Halftone broadsheet photo
  videoUrl    String?  // Responsive YouTube iframe embed URL
  domain      String   // One of 14 domains (LLMs, Robotics, etc.)
  severity    String   @default("normal") // normal, notable, major
  publishedAt DateTime

  issueId String?
  issue   Issue?  @relation(fields: [issueId], references: [id])
  tags    Tag[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([domain])
  @@index([publishedAt])
}

// ------------------------------------------
// 3. TAG MODEL (Topic Indexing Layer)
// ------------------------------------------
model Tag {
  id      String  @id @default(cuid())
  name    String  @unique // e.g., "RAG", "vLLM", "FlashAttention"
  stories Story[]
}

// ------------------------------------------
// 4. TOKEN USAGE MODEL (Cost & Latency Audit)
// ------------------------------------------
model TokenUsage {
  id               String   @id @default(cuid())
  provider         String   @default("google") // google, anthropic, heuristic
  modelName        String   @default("gemini-1.5-flash")
  promptTokens     Int
  candidateTokens  Int
  totalTokens      Int
  action           String   @default("ai-draft") // ai-draft, explain, image-gen
  domain           String?  // Associated domain
  isCacheHit       Boolean  @default(false)
  createdAt        DateTime @default(now())

  @@index([domain])
}

// ------------------------------------------
// 5. INGESTED CANDIDATE (Editorial Inbox)
// ------------------------------------------
model IngestedCandidate {
  id              String   @id @default(cuid())
  source          String   // arxiv, huggingface, github, hackernews, producthunt, etc.
  rawTitle        String
  rawContent      String
  sourceUrl       String
  contentHash     String   // SHA-256 hash for deduplication
  status          String   @default("pending") // pending, drafted, published, rejected
  draftJson       String?  // Pre-drafted JSON from Gemini
  suggestedDomain String?
  fetchedAt       DateTime @default(now())

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([contentHash])
  @@index([status])
}

// ------------------------------------------
// 6. RESPONSE CACHE (0-Token Deduplication)
// ------------------------------------------
model ResponseCache {
  id          String   @id @default(cuid())
  contentHash String   @unique // SHA-256 of rawContent
  draftJson   String   // Serialized DraftStoryResult
  createdAt   DateTime @default(now())
}

// ------------------------------------------
// 7. SUBSCRIBER MODEL (Newsletter Audience)
// ------------------------------------------
model Subscriber {
  id           String   @id @default(cuid())
  email        String   @unique
  status       String   @default("active") // active, unsubscribed
  subscribedAt DateTime @default(now())
}
```

---

## 7. The 14 Domains & 9 Ingestion Pipelines

### 7.1 The 14 Curated Domains

```
1. LLMs                 5. Startups & Funding    9. Crypto & Web3      13. Campus
2. Robotics             6. Tools                10. Mobile             14. Drama (Back Page)
3. Cybersecurity        7. Web Development      11. Hardware
4. Research             8. Gaming               12. Opportunities
```

| # | Domain | Core Focus Areas | Primary Student Placement Relevance |
|---|---|---|---|
| 1 | **LLMs** | Foundation models, reasoning tokens, test-time compute, MoE architectures. | Core interview questions on transformers, attention complexity, and memory bounds. |
| 2 | **Robotics** | Humanoid robots, Vision-Language-Action (VLA) models, ROS 2, sim-to-real. | Embedded systems, computer vision, kinematics, and spatial AI roles. |
| 3 | **Cybersecurity** | Autonomous red-teaming, prompt injection, LLM security guardrails, CVEs. | Security engineering, threat modeling, and application security screenings. |
| 4 | **Research** | FlashAttention, KV-cache compression, state-space models (Mamba), optimizers. | Research scientist roles, graduate school applications, and algorithmic deep dives. |
| 5 | **Startups & Funding** | AI developer tooling, infrastructure rounds, YC AI batches, open-source models. | High-growth startup hiring, equity assessment, and identifying industry trends. |
| 6 | **Tools** | vLLM, Ollama, TensorRT-LLM, llama.cpp, quantization (AWQ, GGUF, FP8). | AI engineering, local inference deployments, and latency optimization. |
| 7 | **Web Development** | Next.js, React Server Components, WebAssembly, full-stack AI integrations. | Full-stack developer roles, frontend system design, and streaming APIs. |
| 8 | **Gaming** | Procedural generation, neural rendering, Godot, Unreal Engine 5 AI. | Graphics programming, game development, and real-time physics simulations. |
| 9 | **Crypto & Web3** | Zero-knowledge proofs (zk-SNARKs), zkVMs, decentralized compute clusters. | Cryptography, distributed systems, and consensus protocol engineering. |
| 10 | **Mobile** | On-device SLMs (CoreML, ExecuTorch, Apple Intelligence), mobile frameworks. | iOS/Android mobile engineering, edge inference, and battery/thermal profiling. |
| 11 | **Hardware** | NVIDIA Blackwell, AMD MI300X, RISC-V, TPU architectures, wafer-scale chips. | Computer architecture, GPU kernel programming (CUDA/Triton), and semiconductor design. |
| 12 | **Opportunities** | Global AI hackathons, open-source fellowships, student cloud credits, grants. | Building resume projects, securing cloud compute, and winning cash prizes. |
| 13 | **Campus** | Final-year project blueprints, DSA-to-AI transition roadmaps, placement tips. | Practical guidance for Indian engineering students cracking Tier-1 tech placements. |
| 14 | **Drama** | Boardroom disputes, benchmark manipulations, legal battles, open vs closed feuds. | Industry awareness, corporate governance, and understanding tech policy debates. |

### 7.2 The 9 Automated Ingestion Sources (`src/lib/ingest.ts`)

```
+-----------------------------------------------------------------------------+
|                           INGESTION PIPELINE MATRIX                         |
+-------------------+-----------------+--------------------+------------------+
| Source            | Protocol        | Domains Covered    | Ingestion Logic  |
+-------------------+-----------------+--------------------+------------------+
| 1. arXiv          | Atom/XML API    | LLMs, Research,    | Queries cs.AI,   |
|                   |                 | Robotics, Security | cs.CL, cs.LG     |
| 2. Hugging Face   | REST JSON       | Research, LLMs     | Fetches top 15   |
|                   |                 |                    | daily papers     |
| 3. GitHub Trends  | REST JSON       | Tools, Startups,   | Scrapes top ML   |
|                   |                 | Web Development    | & AI repos       |
| 4. Hacker News    | Firebase API    | Web Dev, Tools,    | Traverses top 30 |
|                   |                 | Startups & Funding | story endpoints  |
| 5. Product Hunt   | GraphQL API     | Startups & Tools   | Queries weekly   |
|                   |                 |                    | top-voted posts  |
| 6. Gaming RSS     | RSS/XML Feed    | Gaming             | Gamasutra,       |
|                   |                 |                    | Polygon, Kotaku  |
| 7. Crypto RSS     | RSS/XML Feed    | Crypto & Web3      | CoinDesk,        |
|                   |                 |                    | The Block        |
| 8. Mobile RSS     | RSS/XML Feed    | Mobile             | Apple/Android    |
|                   |                 |                    | Dev Feeds        |
| 9. Hardware RSS   | RSS/XML Feed    | Hardware           | AnandTech, Tom's |
|                   |                 |                    | Hardware, Reg    |
+-------------------+-----------------+--------------------+------------------+
```

---

## 8. Directory Blueprint & Codebase Tour

```
ageofai/
├── prisma/
│   ├── schema.prisma              # Seven core models (Issue, Story, Tag, TokenUsage, etc.)
│   └── seed.ts                    # Comprehensive seed script generating realistic Sunday issue
├── public/
│   ├── fonts/                     # Local fallback fonts (Geist, Playfair, Source Serif)
│   ├── sw.js                      # Service Worker for offline PWA broadsheet caching
│   ├── manifest.json              # Web App Manifest for mobile installation
│   └── icon.png                   # Broadsheet emblem icon
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout importing Google Fonts, Navbar, OfflineBanner
│   │   ├── page.tsx               # Homepage rendering current issue via FlipBook
│   │   ├── globals.css            # Tailwind directives, halftone masks, drop caps, curls
│   │   ├── bookmarks/
│   │   │   └── page.tsx           # Student study collection with Markdown & PDF export
│   │   ├── issues/
│   │   │   ├── page.tsx           # Archive listing all historical weekly issues by date
│   │   │   └── [issueId]/
│   │   │       └── page.tsx       # Dynamic flipbook viewer for any past issue
│   │   ├── topics/
│   │   │   └── [tag]/
│   │   │       └── page.tsx       # Live reverse-chronological topic archive (e.g., /topics/RAG)
│   │   ├── search/
│   │   │   └── page.tsx           # Full-text search results page with keyword highlighting
│   │   ├── admin/
│   │   │   ├── page.tsx           # Editorial dashboard overview
│   │   │   ├── inbox/
│   │   │   │   └── page.tsx       # Multi-source candidate triage inbox
│   │   │   ├── stories/
│   │   │   │   ├── new/page.tsx   # Manual + AI-assisted story creator
│   │   │   │   └── [storyId]/     # Story editor for published articles
│   │   │   └── issues/
│   │   │       └── new/page.tsx   # Issue assembler (sets volume, number, layout)
│   │   └── api/
│   │       ├── stories/route.ts   # CRUD endpoint for stories
│   │       ├── issues/route.ts    # CRUD endpoint for issues
│   │       ├── search/route.ts    # Dual PostgreSQL tsvector / SQLite fallback search
│   │       ├── ai-draft/route.ts  # Gemini drafting endpoint with SHA-256 cache check
│   │       ├── ai-explain/route.ts# "Ask the Engineer" interactive AI tutor route
│   │       ├── og/route.tsx       # Dynamic OpenGraph broadsheet card generator (@vercel/og)
│   │       ├── subscribe/route.ts # Newsletter subscription handler
│   │       └── admin/
│   │           ├── ingest/route.ts# Triggers automated multi-source poll
│   │           └── dispatch-newsletter/ # Distributes broadsheet issue via Resend API
│   ├── components/
│   │   ├── FlipBook.tsx           # react-pageflip wrapper with cover-open animation
│   │   ├── StoryCard.tsx          # Reusable broadsheet article card with video & explain modal
│   │   ├── ExplainModal.tsx       # "Ask the Engineer" interactive concept drawer
│   │   ├── BroadsheetPageScroll.tsx # Event-isolated scroll wrapper preventing flipbook lock
│   │   ├── DramaSection.tsx       # Distinct amber-tinted back-page controversy layout
│   │   ├── Navbar.tsx             # Masthead, volume metadata, domain links, search bar
│   │   ├── SearchBar.tsx          # Underlined vintage input with instant redirect
│   │   ├── VideoEmbed.tsx         # Responsive YouTube iframe embed with halftone borders
│   │   ├── TagChip.tsx            # Rectangular stamped keyword chip
│   │   ├── SubscribeForm.tsx      # Vintage newsletter subscription box
│   │   └── OfflineIndicator.tsx   # PWA offline detection banner
│   ├── lib/
│   │   ├── db.ts                  # Dual-engine Prisma driver adapter (SQLite <-> PostgreSQL)
│   │   ├── gemini.ts              # Gemini 1.5 Flash client, prompt engine, caching, tutoring
│   │   ├── ingest.ts              # 9-source ingestion crawlers and XML/RSS parsers
│   │   ├── broadsheetPages.tsx    # Dynamic generator converting stories into 14 domain pages
│   │   ├── newsletter.ts          # Table-based responsive HTML email generator
│   │   ├── bookmarks.ts           # LocalStorage client manager and Markdown exporter
│   │   ├── image-gen.ts           # Woodcut broadsheet cover art generator
│   │   └── claude.ts              # Anthropic Claude SDK fallback client
│   └── types/
│       └── index.ts               # Core TypeScript interfaces
├── .env.example                   # Annotated environment variable template
├── package.json                   # Dependencies, scripts, and Prisma seed config
├── tailwind.config.ts             # Broadsheet color palette, typography scales, zero-radii
└── README.md                      # Quickstart documentation
```

---

## 9. Step-by-Step Setup, Build & Operations Guide

### 9.1 Prerequisites
* **Node.js**: Version 18.18.0 or higher (v20+ recommended).
* **npm** or **pnpm**.
* **Git**.
* Optional: A free PostgreSQL instance on [Neon](https://neon.tech) or [Supabase](https://supabase.com) (only required if deploying to production; local development runs immediately on SQLite).

### 9.2 Environment Configuration
Create a `.env` file in the root directory:

```bash
# In ageofai directory:
cp .env.example .env
```

Configure the environment variables:

```ini
# ==========================================================
# 1. DATABASE CONFIGURATION (Dual-Engine Supported)
# ==========================================================
# Option A: Zero-config Local SQLite (Default)
DATABASE_URL="file:./dev.db"

# Option B: Cloud PostgreSQL (Neon / Supabase / Railway)
# DATABASE_URL="postgresql://username:password@ep-cool-pool.us-east-2.aws.neon.tech/ageofai?sslmode=require"

# ==========================================================
# 2. AI & LLM PROVIDER
# ==========================================================
# Google Gemini API Key (Required for AI Drafting & "Ask the Engineer")
# Get a free key at https://aistudio.google.com
GEMINI_API_KEY="AIzaSyYourActualKeyHere"

# Anthropic API Key (Optional fallback)
ANTHROPIC_API_KEY="sk-ant-your-key-here"

# ==========================================================
# 3. NEWSLETTER & INGESTION TOKENS (Optional)
# ==========================================================
# Resend API Key for weekly email dispatches (https://resend.com)
RESEND_API_KEY="re_123456789"

# Product Hunt API Token for startup ingestion
PRODUCT_HUNT_TOKEN="ph_your_token_here"

# Base Site URL for OpenGraph and Newsletter Links
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
```

### 9.3 Local Development Setup (SQLite)

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Synchronize Database Schema**:
   ```bash
   npx prisma db push
   ```
   *This automatically creates `dev.db` with all tables, indices, and relationships.*

3. **Seed Database with Full Sunday Edition**:
   ```bash
   npx tsx prisma/seed.ts
   ```
   *Seeds realistic engineering stories across all 14 domains, including video embeds, breaking alerts, and drama stories.*

4. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### 9.4 Production Deployment (PostgreSQL + Vercel)

1. **Provision a PostgreSQL Database**:
   * Create a free serverless PostgreSQL database on [Neon.tech](https://neon.tech).
   * Copy the pooled connection string.

2. **Push Schema to PostgreSQL**:
   ```bash
   DATABASE_URL="postgresql://..." npx prisma db push
   ```

3. **Seed Cloud Database**:
   ```bash
   DATABASE_URL="postgresql://..." npx tsx prisma/seed.ts
   ```

4. **Deploy to Vercel**:
   * Import the repository into Vercel.
   * Add `DATABASE_URL`, `GEMINI_API_KEY`, and `RESEND_API_KEY` to Vercel Environment Variables.
   * Build Command: `npm run build`
   * Output Directory: `.next`

---

## 10. Operational & Editorial Handbook

### 10.1 Running the Weekly Ingestion Cycle
Every Sunday morning, the editorial cycle executes:
1. **Trigger Multi-Source Crawl**:
   * Navigate to `/admin/inbox` and click **"Run Ingestion Engine"**, or send a POST request to `/api/admin/ingest`.
   * The pipeline queries arXiv, Hugging Face, GitHub, Hacker News, and the RSS clusters.
   * Raw items are hashed with SHA-256 and stored as `pending` candidates.
2. **Batch AI Drafting**:
   * For each candidate, click **"Generate AI Draft"**.
   * Gemini checks the `ResponseCache`. If previously seen, draft is generated with 0 tokens. If new, Gemini generates crux, tags, and domain.
3. **Editorial Curation & Severity Triage**:
   * The editor reviews the draft against the original URL.
   * Edit crux text to emphasize engineering placement relevance.
   * Assign severity:
     * `normal`: Standard incremental update.
     * `notable`: Major open-source release or significant architecture change.
     * `major`: Paradigm shifts (e.g., GPT-5 class release, critical zero-day exploit, humanoid mass production).
4. **Publish Story**:
   * Click **"Approve & Publish"**. The story enters the permanent database and attaches to the current issue.

### 10.2 Dispatching the Weekly Broadsheet Newsletter
1. Navigate to `/admin`.
2. Click **"Dispatch Newsletter via Resend"** (or call `/api/admin/dispatch-newsletter`).
3. The server generates a clean, table-based HTML email featuring the lead stories, domain summaries, and an unsubscribe link compliant with CAN-SPAM regulations.
4. Active subscribers in the `Subscriber` table receive the edition simultaneously.

---

## 11. Architectural Safeguards & Edge-Case Handling

```
+-----------------------------------------------------------------------------+
|                          ARCHITECTURAL SAFEGUARDS                           |
+-------------------+------------------------+--------------------------------+
| Failure Mode      | Root Cause             | Engineering Mitigation         |
+-------------------+------------------------+--------------------------------+
| Gemini API Down   | Rate limits, network   | Dynamic fallback to heuristic  |
|                   | outages, bad keys      | drafter; app never crashes.    |
| FlipBook Lock     | Mobile touch conflicts | BroadsheetPageScroll isolates  |
|                   | inside long text       | touchmove/wheel events.        |
| Search Failure    | SQLite lacks tsvector  | Dynamic SQL fallback to ORM    |
|                   | full-text indexing     | ILIKE filtering on SQLite.     |
| RSS Feed Offline  | Upstream site timeout  | Independent try/catch per feed |
|                   | or XML format change   | with graceful empty returns.   |
| Offline Reader    | User has no internet   | Service Worker (sw.js) serves  |
|                   | on train/commute       | cached broadsheet & indicator. |
+-------------------+------------------------+--------------------------------+
```

1. **Zero-Crash Heuristic Fallback**:
   * In `src/lib/gemini.ts`, if the API key is unconfigured, expired, or rate-limited, the system catches the error and generates a clean, heuristic draft based on the first 600 characters of the raw content. The editorial pipeline never blocks.
2. **FlipBook Event Isolation (`BroadsheetPageScroll.tsx`)**:
   * A frequent issue with `react-pageflip` is that vertical scroll events inside a page can accidentally trigger a page turn or freeze touch scrolling on mobile.
   * The `BroadsheetPageScroll` component wraps all inner page content, capturing and stopping propagation of wheel and touch events so users can scroll long articles smoothly without turning the page prematurely.
3. **Dual-Engine Search Adaptation (`src/app/api/search/route.ts`)**:
   * On PostgreSQL, search runs high-speed PostgreSQL full-text queries:
     ```sql
     WHERE to_tsvector('english', s.title || ' ' || s.crux) @@ plainto_tsquery('english', ${query})
        OR t.name ILIKE ${query}
     ```
   * On SQLite, search automatically switches to Prisma ORM filtering (`contains: query`), ensuring the entire search experience functions locally without requiring PostgreSQL extensions.

---

## 12. Summary & Mission Statement

**AgeOfAI** proves that modern technical journalism does not have to be disposable, noisy, or shallow. By merging the enduring elegance of broadsheet print typography with modern full-stack web architecture, permanent topic indexing, and strict human-in-the-loop editorial curation, AgeOfAI equips the next generation of engineers with the clarity, depth, and perspective needed to master the artificial intelligence revolution.
