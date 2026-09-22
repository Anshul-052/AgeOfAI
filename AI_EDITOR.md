# Autonomous edition editor

## Local per-story drafting

The admin inbox now sends every selected candidate to its own database-backed drafting job. **Automatic** routing uses Qwen 3.5 4B on the editor laptop for ordinary stories and reserves Gemini for sensitive subjects such as cybersecurity, health, finance, crypto, and policy. The model selector can override that choice with Qwen, Phi-4 Mini, or Gemini. If a local draft fails validation, the worker retries it with the other local model. It never publishes a story; the administrator must review it, add it to an issue, and use the final issue publish control.

Install Ollama and both models once:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\setup-local-editor.ps1
```

Keep the worker running while drafting from `/admin/inbox`:

```powershell
powershell -ExecutionPolicy Bypass -File scripts\start-local-editor.ps1
```

On this Windows machine, double-click `START_LOCAL_EDITOR.cmd` in the project folder for the same result. Keep that window open while queued stories are being drafted.

The inbox refreshes queued work automatically. Each card shows the assigned provider and model, routing reason, job state, word count, token count, fallback use, and errors. `npm run editor:local-once` processes one queued story and exits, which is useful for testing. The worker needs the same `DATABASE_URL` as the deployed application because Vercel cannot connect directly to a model running on a private laptop.

`scripts/ai-editor.ts` is the separate editor for AgeOfAI. It is designed for a publication without a daily human editor and uses a fail-closed workflow: weak or unverified stories are withheld instead of being published with a confident-sounding summary.

## What it does

1. Scans recent feeds and, when enabled, search results for every domain in `src/lib/domains.json`.
2. Removes promotional posts and near-duplicate headlines, then ranks candidates by freshness and source quality.
3. Searches feeds and Google News RSS for independent corroboration. When Tavily is configured, it adds deeper current-web verification. A story always needs at least two different publisher domains.
4. Gives the drafting model numbered evidence only. The model must return a detailed 600–1,000 word report, tags, severity, uncertainties, and a claim-to-source ledger.
5. Validates the structure and every citation before accepting the draft.
6. Saves all accepted stories in one private draft issue. If coverage falls below `EDITOR_MIN_STORIES`, no issue is created.
7. Saves the evidence trail on every story so readers can inspect sources and limitations.
8. Uses a unique Sunday edition key so a scheduler retry cannot create the same week twice.
9. Requires the administrator to review the draft and press the final publish button before readers can see it.
10. Uses images supplied by the original publisher page or feed. If a source image cannot be verified, the story is shown without an image.

Source checking reduces errors but cannot prove that every source is correct. The public story page describes the process as “AI source-checked,” not “factually guaranteed.”

## Configuration

The current local environment has Gemini and Supabase configured. Deployments need the same server-side values. Tavily remains optional until its key is available:

```ini
GEMINI_API_KEY="..."
GEMINI_MODEL="a model available to your Google AI account"
TAVILY_API_KEY="..." # optional enhancement; add when available

EDITOR_LOOKBACK_DAYS="8"
EDITOR_MAX_PER_DOMAIN="2"
EDITOR_MIN_STORIES="8"
EDITOR_SEARCH_DISCOVERY="true"
```

The model name is intentionally configuration, because provider model availability changes. Without Tavily, the editor uses specialist feeds plus Google News RSS and still enforces the independent-domain threshold. Tavily adds current discovery, relevance scores, date and domain filters, and stronger parsed source content when available.

The editor runs as a server-side script, while final publication is limited to the protected admin UI. Set `ADMIN_ACCESS_KEY` to a long random value and use it as either a Bearer token or the password in the browser's Basic Auth prompt. Without this value, admin pages and mutation endpoints return `404`.

## Run it

Scan all domain feeds and discovery results without calling Gemini or changing the database:

```powershell
npm run editor:scan
```

Preview coverage without changing the database:

```powershell
npm run editor:preview
```

Build a private draft edition:

```powershell
npm run editor:edition
```

Without Gemini, scan mode still reports coverage gaps. Draft creation refuses to proceed without Gemini or when too few stories pass verification. A successful run prints one JSON report with coverage per domain, model usage, and every withheld reason; retain that output in the scheduler logs. Review the private issue at `/admin`, then use **Review complete — publish issue** for the final release.

## Scheduling

Run `editor:edition` once each Sunday after configuring a persistent production database. It prepares a private draft and never makes it public. The scheduler must stop on a non-zero exit code and alert on failures. Do not schedule this against an ephemeral deployment filesystem or a local SQLite file that the public site cannot read.

`.github/workflows/weekly-edition.yml` is ready for GitHub Actions. It runs Sundays at 09:00 Asia/Kolkata, prevents overlapping editions, supports manual runs, fails when required secrets are absent, and retains the editor report for 30 days. Add `DATABASE_URL` and `GEMINI_API_KEY` as repository secrets; `TAVILY_API_KEY` can be added later without changing the workflow.

## Expanding coverage

Edit `src/lib/domains.json` to add or refine a field. Each item supplies:

- `id`: the database and URL value;
- `label`: reader-facing navigation text;
- `description`: the section’s editorial remit;
- `query`: discovery and relevance terms;
- `feed`: a primary or specialist feed used as an editorial anchor.

The reader, archive filters, navigation, and editor all use the same registry, so a new domain appears throughout the product.
