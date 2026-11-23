# Yakini Builder: architecture (Phase 0)

## Shape
- **Studio** (`studio.yakini.digital`, pending DNS) and **client sites** (`<slug>.yakini.digital`, custom domains) are served by the same app, `apps/builder`.
  - `proxy.ts` calls `lib/hosts.ts` `decideHost()`. Studio hosts, `*.vercel.app` and localhost go to the studio.
  - Every other host is rewritten to `/_site/{host}{path}`; the folder is `app/%5Fsite`.
  - Client sites never load studio analytics.
- **Data** lives in Supabase project `yakini-builder`, schema `builder`.
  - Every table has RLS.
  - Tenancy comes from `memberships`, using helpers `is_member`, `has_role`, `is_operator`.
  - Server-only tables (`runtime_links`, `visit_hashes`, `visit_salts`, rate limits) have no client grants at all. Operators can't read them either.
  - Published content is read only by the server function `published_doc_for_host`, which returns nothing during a takedown.
- **Site documents** are JSON (`SiteDocV1`, `@yakini/site-schema`).
  - They're always loaded through `loadSiteDoc()`, which validates, runs migrations, and refuses docs newer than the code.
  - `site_versions` rows are immutable; a trigger enforces this.
- **Shared packages** live under `packages/*`. yakini.digital and the Builder share `@yakini/pricing` (the single price source) and `@yakini/brand`.

## Safety rails in Phase 0
- **AI spend cap** (`@yakini/ai` `checkSpend`). It's a global daily token cap plus a USD cap from env price names, read from `ai_usage_today()`. It fails closed: if usage can't be read, no AI call is made. `lib/server/ai.ts` is the only way the app calls AI.
- **Plan gate**: `plan_active` is a *blocking* item in `PUBLISH_CHECKLIST`, and `canPublish()` fails closed.
- **Domain limit**: `domainCapacity()` refuses a new custom domain when the project is within `headroom` of `VERCEL_PROJECT_DOMAIN_LIMIT`.
- **Abuse**: blocked categories (adult, weapons, gambling), reserved subdomains, impersonation names, and a risk check that sends flagged sites to `publish_reviews`.
- **Secrets**: only env var names appear in code. `check-secrets` runs in CI, and `check-client-env` keeps non-`NEXT_PUBLIC_*` names out of client code.

## Client export button (Phase 4)
- The policy is already in `lib/exports.ts`: the Q13 rules and 24-hour signed links in the private `site-exports` bucket. Only owners and operators can read their tenant's exports.
- Exports include only images with `redistributable = true`. Owner uploads are marked redistributable by the server; licensed stock is included only when its licence allows.

## Image licensing
- Every asset carries `license_kind`, `license_note` and `redistributable`.
- Kit sample images must declare a licence. `unlicensedSamples()` flags any that don't, and Phase 1 CI will fail on them.

## Dogfood phase
- Before any client uses the studio, Yakini builds its own sites with it: yakini.digital pages and one test site on the Phase 5 test domain (Q9).
- That happens after Phase 1 (editor + food-truck/restaurant kits). Exit criterion: one week of real edits/publishes with no data or access bugs, then 5 clients (Q16).

## Supabase backups
- The hosted project should be on the Pro plan for daily backups (7-day retention).
- Point-in-time recovery is an extra monthly cost; Clarence decides.
- Independently, the export job (Phase 4) gives each owner a copy of their site file and photos.
- Migrations live in git, so the schema can always be rebuilt.

## Testing
- Package tests use vitest or node:test.
- Builder unit tests use vitest. The yakini.digital tests (17) use `tsx --test`.
- RLS: `PGHOST=<local> apps/builder/supabase/tests/run.sh`. It refuses non-local hosts, creates a throwaway database, applies the shim + migrations + fake seed, and runs 231 checks.
- E2E: Playwright `phone-390` and `desktop-1280` against `next start`.
