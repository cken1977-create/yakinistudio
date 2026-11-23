# Changelog: Yakini Builder

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
