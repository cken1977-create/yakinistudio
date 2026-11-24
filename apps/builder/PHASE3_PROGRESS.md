# Phase 3 progress note

Branch `feat/builder-phase3` (from main at 5a2f185). Spec: `00-core.md` + `phase-3.md` section 15.4.
If a session ends, read this file first, then `git log --oneline main..HEAD`.

## Rules for this phase (from Clarence)
- Never merge, push to main, deploy, change Vercel/Supabase settings, apply migrations to the live DB, or add secrets.
- New migrations go in the repo only. Commit and push after every step. Questions go to OPEN_QUESTIONS.md.

## Decisions
- **Caching:** published-site lookups use `unstable_cache` tagged `host:<hostname>` and `site:<siteId>` (5 min safety TTL).
  Publish, rollback, unpublish, takedown and restore call `revalidateTag(tag, { expire: 0 })`, so the next request
  is fresh (Next 16 docs: `expire: 0` never serves stale). Pages render per request because the CSP nonce
  changes per request; the render itself is cheap. `'use cache'`/Cache Components would be an app-wide switch,
  left out of this phase.
- **Host state:** a new server-only SQL function returns live / unpublished / taken_down for a host, so the
  renderer can show "being updated" (unpublished) vs "unavailable" (takedown, 404, no-store) vs unknown host.
- **Subdomains (13.2 B, Q3 default):** on publish the Vercel Domains API adds `<slug>.yakini.digital`
  when `VERCEL_API_TOKEN`/`VERCEL_TEAM_ID`/`VERCEL_BUILDER_PROJECT_ID` are set. Without them the domain row stays
  `pending` and the publish result says the address is being set up (see OPEN_QUESTIONS Phase 3).
- **Email alerts:** Resend over its HTTPS API when `RESEND_API_KEY` + `EMAIL_FROM` are set; test mode keeps an
  in-memory outbox for assertions. Only internal alerts (owner on form posts, operators on reports/reviews).
  Never to a visitor, reporter or prospect (R4/R5).
- **Forms:** honeypot `company_website`, signed render time field, 5/10 min per IP per site, 200/day per site.

## Steps (✓ = committed and pushed)
1. [✓] Progress note + branch
2. [✓] Migration (repo only) + store methods (Supabase + memory) + DB tests (313 DB checks pass locally)
3. [✓] Checklist, slug check, publish / rollback / unpublish, review gate, subdomain registration
4. [✓] Renderer: host routing, caching, neutral pages, sitemap/robots/JSON-LD/canonical, client-site CSP (/p previews move to step 6)
5. [✓] Forms endpoint, thanks page, owner alert, booking request mode, /sites/[id]/forms
6. [✓] Share links + /p previews; /report + abuse_reports + auto-hold; takedown/restore; /ops, /ops/reports, /ops/reviews; Check stored sites
7. [✓] Studio screens: /sites/[id]/publish, rollback in versions, takedown banner
8. [✓] Evidence: unit + DB + e2e at 390/1280, Lighthouse, link crawl, screenshots
9. [ ] Self-review, security review, CHANGELOG, PR

## How to try it locally (test mode)
`npm run build` in apps/builder, then `BUILDER_TEST_MODE=1 npx next start -p 3110`.
Seed `POST /api/dev/seed?fixture=kit-ready` (or `impersonation`), sign in with code 246810, claim,
`POST /api/dev/state {"action":"plan","siteId":...,"plan":true}`, publish, then request the site with
`Host: <slug>.yakini.digital`. Local DB tests: see supabase/tests/run.sh (Postgres in /var/tmp/ys-pg).

## Notes for review
- Copy lint at publish checks vendor names and "AI-built" (R7/R8). It does not check "$" amounts: a
  business's own menu prices are its content; R9 is Yakini's own price line.
- Outside links count as working when the server answers, including 401/403/405/429 bot walls.
