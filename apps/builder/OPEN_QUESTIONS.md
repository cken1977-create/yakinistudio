# Yakini Builder: open questions (Phase 0)

Source of truth: `00-core-v1.1.md` and `phase-0-v1.1.md`. Clarence approved "use all defaults" on 2026-11-23.

## Q1–Q17 (from core §17): status

| # | Question | Answer in use | Status |
|---|---|---|---|
| Q1 | Supabase project | New project `yakini-builder`. Phase 0 tests only on a local Postgres. | Confirmed. **Clarence creates the hosted project.** |
| Q2 | Paid sites on Yakini hosting? | Move to the client's account once signed (R3); subdomain-only until then | Default |
| Q3 | yakini.digital DNS | Per-site subdomains; no DNS changes without OK | Default |
| Q4 | Studio address | `studio.yakini.digital` | Confirmed. **DNS is a manual step for Clarence.** |
| Q5 | First in-app products | Template website + kit setup, read from `@yakini/pricing` | Confirmed (`packages/pricing/src/products.ts`) |
| Q6 | "Site by Yakini" footer | On by default, owner can hide (`footer.showSiteByYakini`, default `true`) | Confirmed |
| Q7 | Refused categories | Adult, weapons, gambling (`packages/abuse`); env can only add | Confirmed |
| Q8 | Portal `sites` module | Untouched | Confirmed |
| Q9 | Phase 5 test domain | Clarence provides one | Open (needed by Phase 5) |
| Q10 | Review gate | Operator-override publishes + risk-flagged sites | Default (`publish_reviews` table) |
| Q11 | Hide "Report this site" | Only paid + own-domain | Default |
| Q12 | Auto hold | Unpaid only: 3 reports/24h from different visitors, or any phishing report | Default |
| Q13 | Downloads | Site file + photos: any owner. Ready-to-host pages: paying owners, and up to 90 days after cancel | Default (`lib/exports.ts`) |
| Q14 | Today updates | Owners + operators; editors unless owner turns it off | Default |
| Q15 | Client's own database | Keep | Default |
| Q16 | Rollout pace | Test site → 5 → batches of 10, operator click between; security fixes in 72h | Default |
| Q17 | Visitors | Daily salted hash, salt deleted after 48h (`visit_salts`, `visit_hashes`) | Default |

## New questions from Phase 0

1. **Vercel domain limit per project.** `VERCEL_PROJECT_DOMAIN_LIMIT` defaults to 50 with a headroom of 5 (`lib/domain-limit.ts`). Please confirm the team plan's real limit.
2. **Operator access logging.** RLS can't log reads. Operators read through RLS, and every operator *write* goes through server routes that write `audit_log`. If operator *reads* must be logged too, they need a server-only read path (Phase 2).
3. **Expose the `builder` schema.** On the hosted project, add `builder` to the API's exposed schemas (Settings → API).
4. **Backups.** Daily backups are included on Supabase Pro; point-in-time recovery is an add-on. Clarence decides the cost (see `docs/ARCHITECTURE.md`).
5. **Next.js security upgrade.** Next prints a security advisory after `next build` (retrying the build passes). Recommended: run `npx next upgrade --agent=security` in a separate PR, then re-run both builds.
6. **CI workflow file.** The agent's GitHub token can't write `.github/workflows`. The workflow is at `apps/builder/ci/builder-ci.yml`; copy it to `.github/workflows/builder-ci.yml` to turn it on.
7. **Studio CSP.** Phase 0 allows `'unsafe-inline'` for scripts and styles (Next inline bootstrap). Nonce-based CSP is planned for Phase 1.

## Spec deviations (forced by Next 16)

- `middleware.ts` is deprecated in Next 16, so this uses `proxy.ts` (same behavior).
- Folders starting with `_` are private in the App Router, so the renderer lives at `app/%5Fsite/[host]/[[...path]]`. The URL path is still `/_site/...`, and the proxy blocks direct requests to it.
- RLS tests run on a plain Postgres 17 with a small Supabase shim (roles, `auth.uid()`, storage tables), not the Supabase CLI. CI does the same with a `postgres:17` service.
