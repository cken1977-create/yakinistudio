# Changelog: Yakini Builder

## Phase 1: demo or description → branded 5-page draft (2026-11-23, branch `feat/builder-phase1`)

### Added
- `@yakini/site-schema`: strict props for all 17 section types, doc integrity checks (unique ids, links that resolve, a home page), the `submit_site` JSON Schema, an outbound-link policy, and two every-section fixtures (`fixtures/v1/*-every-section.json`).
- `@yakini/kits`: `food-truck` and `restaurant` kits (5 pages each, allowed sections, variants, fonts, copy tone, Today kinds, licensed sample images), the fallback template, and `assembleDoc` (brand and integrations always set by the server).
- `@yakini/sections` (new): the site renderer and section library. Server components only, no JavaScript needed, container-query CSS so the phone preview lays out like a phone, self-hosted open-licence fonts, WCAG text colors without changing the stored brand hex.
- `@yakini/brand`: a pinned-DNS safe fetcher (redirects re-checked, size caps after decompression), robots.txt, a fact extractor that drops hidden text before anything reaches the model, and `readSite` (home + up to 4 pages + photos).
- `@yakini/ai`: the generate prompt (`gen-1.0`), the `submit_site` tool, retry messages, more banned phrases, an injection-phrase check, and 10 sample business sites + an injection site for tests and evals.
- `apps/builder`:
  - Draft pipeline: read the site → photos re-encoded with sharp → model with up to 2 retries → server clean-up (links, images, forms, name) → validation → kit fallback. Never ends on an error page.
  - `POST /start` (from /demo) and `POST /api/drafts` (from `/new`): streamed progress page that works with JavaScript off, 5 per hour / 30 per day per IP (hashed), Origin checks, honeypot + signed form time on `/new`.
  - `/new`: "Describe your business" form (no contact info).
  - `/d/[siteId]`: private draft preview with a phone/desktop switch, noindex by header and meta.
  - Private draft photo route, anonymous draft cookie (`__Host-`, httpOnly, Secure, SameSite=Lax, 14 days; only an HMAC of the token is stored).
  - `GET /api/cron/cleanup` + `vercel.json` cron: unclaimed drafts older than 14 days are soft-deleted.
  - Test mode (`BUILDER_TEST_MODE=1`, refused on Vercel): stand-in model, mock websites, in-memory store, fixture pages for browser tests.
  - `npm run eval -w builder`: manual real-model eval on the 10 sample businesses + injection site.
  - Yakini-drawn kit sample illustrations in `public/kit-samples/`.
- `apps/yakini.digital`: "Start my setup" posts to the studio for food truck and restaurant when `BUILDER_HANDOFF_ENABLED` is on, plus a "No website? Describe your business" link. Off by default, so nothing changes on the live site until the flag is set.
- Tests: 56 builder unit tests (pipeline, routes, access, cleanup), 59 renderer tests, browser tests for the acceptance list at 390 and 1280 with JavaScript on and off.

### Fixed
- `@yakini/brand` address checker: IPv6 spellings of private addresses (for example `[::ffff:127.0.0.1]`, NAT64, 6to4, Teredo) and a few reserved IPv4 ranges were not refused. This also protects the live /demo brand reader.

### Changed
- `@yakini/abuse`: the `draft-` slug prefix is reserved for anonymous drafts.
- `/api/health` reports `phase: 1`.

## Phase 0: foundations (2026-11-23, branch `feat/builder-phase0`)

### Added
- `apps/builder`: Next.js 16 app.
  - Studio landing page (one price line: "Setup from $299. Monthly plans from $149.").
  - Host routing in `proxy.ts`: studio vs client hosts, and `/_site` blocked from outside.
  - Neutral "This site is unavailable." 404. Everything is noindex.
  - `/api/health`.
  - Security headers and CSP.
  - Sentry with PII scrubbing; PostHog only when its env names are set.
- Shared packages:
  - `@yakini/pricing` and `@yakini/brand`, moved from yakini.digital with re-export shims, so no behavior change there.
  - `@yakini/site-schema` (SiteDoc v1 + loader/migrations).
  - `@yakini/kits` (registry + image licence check).
  - `@yakini/ai` (xAI client, copy lint, global spend cap).
  - `@yakini/abuse` (blocked categories, reserved names, impersonation, risk check).
  - `@yakini/visits` (bot filter, source, visitor hash).
- Database (`apps/builder/supabase/migrations`):
  - Every core §9 table in schema `builder`, plus the v1.1 tables: share links, abuse reports, publish reviews, Today updates, daily visits, visit hashes/salts, exports, runtime releases, client deployments, runtime links.
  - Helpers, RPCs, guard triggers.
  - RLS on every table.
  - Private storage buckets `site-assets` and `site-exports`.
- RLS test suite: 231 checks covering cross-tenant reads/writes, anon, and server-only tables.
- v1.1 items in Phase 0:
  - Global AI spend cap (`AI_DAILY_TOKEN_CAP`, `AI_GLOBAL_DAILY_USD_CAP`, fails closed).
  - Plan gate as a blocking publish-checklist item.
  - Vercel domain-limit check.
  - Export policy + 24h links (button ships in Phase 4).
  - Image licence fields (`license_kind`, `redistributable`).
- Tooling:
  - `scripts/check-secrets.mjs`.
  - `apps/builder/scripts/check-client-env.mjs`.
  - CI workflow (staged at `apps/builder/ci/builder-ci.yml`).
  - Playwright smoke at 390 and 1280.

### Changed
- `apps/yakini.digital`:
  - `lib/pricing.ts` and `lib/demo/{safe-url,fetch-page,extract-brand}.ts` now re-export from the shared packages.
  - Adds `transpilePackages` and a `test` script.
  - Its 17 tests pass and it builds.
