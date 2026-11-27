# Changelog: Yakini Builder

## Published sites without framework JavaScript (2026-11-27, branch `perf/static-published-sites`)

- Published client pages are plain HTML from a route handler: a standalone renderer bundle with its
  own React, one first-party stylesheet and self-hosted fonts. No framework JavaScript (was about
  193 KB per page); the only script is JSON-LD. The studio and editor are unchanged.
- Room for D7: first-party, nonce-tagged "islands" can be added per site; none today.
- If the renderer bundle were ever missing, published pages show "This site is being updated"
  (503) and Sentry is told.
- Lighthouse (phone, throttled): 9 of 10 rich sites now score 0.95 or higher (was 3).
- Tests: unit (every fixture page has no script but JSON-LD; D7 hook), browser (0 script requests
  on every page of a published site; forms submit with JavaScript off).
- Fonts: no more text moving when fonts load. Each site preloads its own fonts, and every font pair
  has size-matched local fallbacks for slow connections. Published fonts are subset at build time;
  at most 100 KB per site, enforced by the build and a test.

## Phase 5a: your own domain (2026-11-26, branch `feat/builder-phase5-domains`)

Spec: `docs/spec/phase-5.md`.

- **Owner flow** `/sites/[id]/domain` (linked from Publish as "Use your own domain"): type a whole domain (`yourbusiness.com`, www is added too) or one part (`shop.yourbusiness.com`). The page shows the exact DNS records to add, taken from Vercel's answer: `A @ <IP>` for a whole domain, `CNAME <name> <target>` for www and subdomains, and a `TXT` proof when Vercel asks for one. "Check now", plus a check on page open (at most once a minute) and every night. Once the main name works it becomes the site's main address; the free address and www forward to it. Remove (with a confirm box) makes the free address main again and releases the names. Works with JavaScript off.
- **Rules:** paid plan (or an operator); one domain per site; refuses yakini.digital addresses, hosting names, IP addresses, names another site or another hosting project holds. Publishing again keeps the custom domain as the main address.
- **Database (repo only, not applied):** `20261126000300_builder_custom_domains.sql`: server-only `add_custom_domain`, `set_domain_status`, `remove_custom_domain` (audited `domain.add`, `domain.remove`).
- **Test stand-in for Vercel domains** (`/api/dev/domains`, test mode only).
- Tests: unit 201 (9 new), database (16 new domain checks), browser 4 new at 390 and 1280. Screenshots in `docs/phase5-evidence`.

## Founding offer (2026-11-26, branch `feat/builder-founding-offer`)

- **Founding 20:** the first 20 businesses pay the setup fee at sign-up; PayPal starts monthly billing on February 1, 2027 (`start_time`). The plan page shows the offer, spots left and "$299 today, then $149 a month from February 1, 2027".
- Spots are counted in one locked transaction (the 21st business never gets one); unpaid spots go back after a day (nightly cleanup).
- `/ops/billing`: offer on/off, number of spots, end date, and who holds a spot. Audited (`billing.promo`, `billing.promo_claim`).
- Database (repo only): `20261126000200_builder_founding_offer.sql` (`billing_promos`, `promo_claims`, `subscriptions.promo_id`, server-only `claim_promo`, `attach_promo`, `release_stale_promo_claims`, `set_promo`).
- Plan page also shows the full amount due today when there is no offer ("$448 today, then $149 a month").
- Tests: unit 192, database (incl. 16 offer checks), browser 88 at 390 and 1280.

## Phase 4: billing with PayPal (2026-11-26, branch `feat/builder-phase4-billing`)

Spec: `docs/spec/phase-4.md` (written from Clarence's decisions; no Phase 4 file was provided).

### Added
- **Plans:** one PayPal subscription plan per product (Template website, and each sold kit at Small/Growing/Larger), with the setup amount as the plan's setup fee and the monthly amount repeating. Amounts come only from `@yakini/pricing` (R9). Created from `/ops/billing` ("Set up plans in PayPal") and stored in `builder.billing_plans`; pressing again keeps matching plans and replaces changed ones.
- **Owner flow:** `/sites/[id]/plan` shows the recommended plan first (the kit's Small plan, or the Template website for the general kit), then the others; "Continue to PayPal" → PayPal approval → back to an active plan. Cancel (with a confirm box) keeps the plan in force for the paid month. Works with JavaScript off.
- **Webhook** `POST /api/billing/paypal/webhook`: verified with PayPal before anything is read; the subscription is then read back from PayPal (the event body is never trusted for status, plan or tenant); each event is stored once; a subscription can't move between tenants.
- **Lapsed plans:** the nightly cleanup takes a site offline ("being updated") when its plan ended or a payment stayed failed past `PAST_DUE_GRACE_DAYS` (default 7). Nothing is deleted; paying and publishing again brings it back. Owner and operator get one email each.
- **Search engines switch** on the Publish screen (paid sites only), and a banner when a payment fails.
- **Operator desk:** `/ops/billing` with PayPal mode, missing settings (names only), plans and every subscription.
- **Settings:** `PAYPAL_ENV`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` replace the `STRIPE_*` names.
- **Database (repo only, not applied):** `20261126000100_builder_phase4_billing.sql` renames the empty Stripe columns to provider-neutral names, adds `billing_plans`, and the server-only functions `save_billing_plan`, `record_subscription`, `set_site_indexable`, `lapse_due_sites`, with audit actions `billing.change`, `billing.lapse`, `billing.plans`, `indexing.change`.
- **Test stand-in for PayPal** (`/dev/paypal`, test mode only, refused on Vercel): browser tests never touch PayPal.

### Tests
- Builder unit 185 (14 new billing tests), pricing 6, database checks 360 (incl. Phase 4: duplicates, tenant conflicts, grace period, lapse, indexing, no Stripe names left), browser 86 at 390 and 1280 (6 new). Screenshots in `docs/phase4-evidence`.

## Seven more kits (2026-11-25, branch `feat/builder-kits`)

### Added
- **Landlord:** Home, Rentals (open units, rental questions, inquiry form), Residents (repair request form, rent and move-out info, emergencies), About, Contact. Today: unit available, resident notice, office closed.
- **Real estate:** Home, Listings, Buy (steps, buyer form), Sell (steps, "What's my home worth?" form), About with contact. Today: open house (time-checked), new listing, away. The tone forbids promising prices or describing who should live in a neighborhood.
- **Tree and lawn:** Home, Services, Our work (gallery seeded with the kit photos), About, Free estimate. Today: now booking, weather update, no crews out.
- **Nonprofit:** Home (mission), Programs (with meeting times), Get involved (volunteer, give, partner, sign-up form), About, Contact. Today: event, what we need today, closed. Three approved photos.
- **Training school:** Home, Programs, Class schedule, About, Enroll. Today: now enrolling, student notice, no classes. The tone forbids promising jobs, pay, pass rates or aid.
- **Trucking:** Home, Services, Drive with us (driver application), About, Request a quote. Today: hiring, trucks available, office closed. Never invents authority numbers or ratings.
- **Oilfield:** Home, Services, Safety, Careers (application), Request service. Today: hiring, field notice, office closed. Never invents safety stats or certifications.
- Each kit has its approved photos (moved from `kit-photos/` to `public/kit-samples/`, with 960 px WebP copies), its own palette, font pairs and wording rules. The industry list sends its industries to these kits automatically, and the /demo hand-off (`STUDIO_KITS` in yakini.digital) now includes them; it stays off until `BUILDER_HANDOFF_ENABLED` is set.

### Decided and done (Clarence, 2026-11-25)
- A "Business and services" site buys the Template website; so does a kit that isn't sold in-app (`defaultProduct` in `@yakini/pricing`, for Phase 4 checkout).
- The /demo hand-off works for every kit: kits without a studio kit of their own start a general-layout draft named for that kit, instead of "coming soon".
- Addresses can't contain rude words or slurs (whole parts of the address; a few anywhere), without catching words like "cocktail" or "Scunthorpe".

### Tests
- Kits 117 (every in-site link and button points at a real page and section, unique photo ids, each kit has a form). Builder unit 171, renderer 68, yakini.digital 21. Browser 80 at 390 and 1280, including a draft for each new kit that opens every page and checks button contrast. Screenshots in `docs/kits-evidence`.

## Every kind of business (2026-11-25, branch `feat/builder-industries`)

### Added
- **"Business and services" kit** (`service`): Home, Services, About, Contact, with a contact form that asks which service. It is the general layout for any business without a kit of its own. Its six approved photos (from `kit-photos/service`, now in `public/kit-samples/service` with 960 px WebP copies) appear only for trades they really show (heating and air, plumbing, electrical, cleaning, home services); other businesses get a text hero rather than a mismatched stock photo.
- **Industry list on /new:** 173 kinds of business in 17 groups (food, trades, professional services, health, beauty, fitness, real estate, education, nonprofit and faith, transport, energy, automotive, retail, events and media, pets, other). Each points at its best kit; until that kit is built, the general layout is used. The industry name goes to the writer and into the hero line. Works with JavaScript off (native select with groups).
- **Color sets on /new:** 16 ready-made Main/Dark/Accent sets, a "Pick for me" option, and "Use my own colors" with the three pickers. A chosen set is stored exactly and labelled as the owner's (R6). The old `useColors` field is still accepted.

### Fixed
- A business that wasn't food (e.g. "Holdings company") fell back to the **restaurant** kit, with a menu and "Book a table". It now gets the general layout, and the kit chooser is told to use it for anything that isn't a food business.
- **Button text on every site** took the surrounding text color instead of the readable color picked for the button (a link rule outranked the button rules). On solid bands the button was a blank white pill; brand buttons had dark text on dark colors. Fixed in the renderer, with a browser check.

### Tests
- Kits 44 (industries, color sets, service template), builder unit 170, renderer 68, browser 66 at 390 and 1280. Screenshots in `docs/industries-evidence`.

## Phase 3: publish, working forms and the safety net (2026-11-24, branch `feat/builder-phase3`)

### Added
- Publishing (spec 5.6, 11.1, 11.2): `/sites/[id]/publish` with the pre-publish checklist (placeholders, a way to reach the business, photos and descriptions, internal and outside links, wording, forms, size, ownership, takedown, plan; warnings for contrast, hours, search description and buttons to empty sections), the address with a live check, Publish, "Your site is live" with copy and QR code, roll back, take offline, and preview links. Routes: `POST /api/sites/[id]/checks|publish|rollback|unpublish`, `GET /api/slugs/check`.
- Addresses (13.2 B, 13.3): `<slug>.yakini.digital`; reserved, big-brand and taken addresses refused; the Vercel Domains API adds the address when its settings exist, otherwise the address waits as pending.
- Renderer (13.5, 11.4): every client host resolves to its published version only (never a draft). Unknown hosts and sites under takedown get "This site is unavailable." (404, noindex, no-store); an unpublished site says "This site is being updated". Cached per host and refreshed on publish, rollback, unpublish, takedown and restore. robots.txt, sitemap.xml, canonical, Open Graph and JSON-LD; noindex unless paid and indexable. Client-site CSP with no outside hosts; the error reporter runs on studio hosts only.
- Site forms (11.3, 5.8): `POST /api/f/[siteId]/[formKey]` works with JavaScript off; host must be the site's own; honeypot, signed render time, 5 per 10 minutes per visitor and 200 a day per site; only declared fields kept. The owner gets an internal email; the visitor gets nothing (R4/R5). Thank-you page. Booking sections are request forms until portal booking (Phase 6). `/sites/[id]/forms` lists the messages.
- Safety net (14.8, Flow I): share links (owners/editors of claimed sites, shown once, hashed, expiring, revocable, max 20, refused for anonymous drafts and for flagged sites, which open a review); `/p` previews with a "Preview, not a live site" banner; the Report link on live sites, share previews and draft previews; `/report` (JS-off) with a reference code and an operator alert only; auto-hold of unpaid sites (3 distinct reporters in 24 h, or any phishing report); takedown and restore; the review gate per `REVIEW_GATE_MODE`.
- Operator desk (5.10): `/ops`, `/ops/reports` (dismiss, actioned, take down, restore), `/ops/reviews` (approve publishes the reviewed version, reject keeps the preview), Check stored sites (7.4). Routes per spec 18.
- Database (repo only, not applied anywhere): `20261125000100_builder_phase3_publish.sql` — server-only functions for publish, review, rollback, unpublish, takedown, lift, reports, share links and the host lookup, each one transaction with its own audit row; two new audit actions (`unpublish`, `report.create`). 67 new database checks (`supabase/tests/phase3-tests.sql`).
- Tests: 167 builder unit tests (31 new), 68 renderer tests, 313 database checks, 64 browser tests at 390 and 1280 (14 new). Lighthouse evidence in `docs/phase3-evidence`.

### Changed
- Links to a section with nothing in it yet open the page instead of a dead anchor.
- The first image on a page is preloaded; kit photos have a 960 px WebP for phones; client sites no longer load the studio stylesheet or ask for a favicon.
- Honeypot field renamed to `company_website` (spec 11.3).
- Editor: Publish opens the publish screen; banners for a paused site or one waiting for review; tour text updated.
- `/api/health` reports `phase: 3`.

## Phase 2: editing, sign-in and claim (2026-11-24, branch `feat/builder-phase2`)

### Added
- `@yakini/edits` (new): every editor operation (spec 8.7) as a checked, reversible change: text and list fields, business info, add/remove/move/duplicate/hide sections, styles, photos, pages, SEO. All-or-nothing batches; brand colors and logo can't be reached; after every batch the whole site must still be valid, keep its header/footer, kit sections and styles, the page limit, and use only the tenant's own pictures (so even a tampered undo can't break those). Undo/redo history (50 deep).
- Chat edits (spec 8.6, 10.4): the spec prompt, tools generated from the same operation schemas, validate → apply to a copy → copy lint → plain-English proposal, one retry; brand, publishing, domain and billing requests answered without the model. 20 scripted requests pass with no stray changes; `npm run eval -w builder` also runs them against the real model.
- Sign-in (spec 5.4): email-only, a 6-digit code or the link from the email, no passwords. Rate-limited per IP and per address; the email never appears in a URL; `next` only ever goes to a studio path.
- "Make it mine" (Flow B): `/claim/[siteId]` with the required ownership box (stored with time and IP hash), optional phone, address and hours, and the time zone (from the device, else the address; El Paso stays on Mountain time). One database step makes the owner, moves the tenant to trial and clears the draft token; typed details are saved only onto the draft the owner was looking at.
- Draft API: `GET /api/drafts/[siteId]`, `PATCH /api/sites/[siteId]/draft` (operations only, compare-and-set on `draft_rev`; a second window gets "This site was changed in another window. We loaded the latest version." and nothing is lost), versions list/save/restore (restore saves the current draft first, keeps today's brand, writes an audit row), automatic versions every 20 changes or 10 minutes, `POST /api/ai/edit` with per-tenant limits (20/hour trial, 120 active, daily token cap), photo upload (`POST /api/assets`, re-encoded, location data removed) and the photo list.
- The editor (`/sites/[siteId]/edit`, spec 10.2-10.5): the live page rendered with the same components as the published site; tap a section to edit every field it has (live character counters, rich text with bold/italic/links, buttons and where they go, photos with required descriptions, lists with add/move/remove); section toolbar; pages and business info; Chat with Apply / Undo / Try again and the change outlined on the page; Undo/Redo; saves 1.5 s after the last change, in order, and keeps working offline. Desktop: pages, canvas, Edit · Chat · Kit · Help. Phone: Pages · Edit · Chat · Publish as bottom sheets. Works for the anonymous draft holder ("Keep editing") and for members.
- Tutorial (spec 10.9): an 8-step guided tour pointing at the real editor on phone and desktop (skip any time; remembered per person and site; resumable), a written tutorial page with "Show me", and Destiny in the Help tab (editor how-tos, the one price line, change requests handed to Chat, every answer checked for stack names, other prices and "log in to see the demo").
- `/sites` (my sites) and `/sites/[siteId]/versions`.
- Database: `builder.claim_draft` and `builder.create_version` (service role only), with 15 new database checks.
- Tests: 129 builder unit tests, 31 edit-engine tests, 25 AI-package tests, 66 renderer tests (including old versions still rendering after a format change), browser tests for claim → edit → reload, every section on every page edited by click, the two-window conflict, chat, versions and all 8 tutorial steps, at 390 and 1280.

### Changed
- Kit photos: food truck and restaurant drafts now use real sample photos (5 per kit, JPEG for every browser plus full-size and 640-wide WebP offered first), replacing the drawings for new drafts. Older drafts keep showing the drawings. Photos for the 8 later kits are stored in `apps/builder/kit-photos/`.
- The renderer offers WebP first (`<picture>`, laid out as if absent) when an image has a WebP copy.
- A Today section set to hide when empty now shows a note in drafts, so the owner can find and edit it (live pages unchanged).
- The "Skip to content" link is clipped until focused instead of sitting above the site, so it can't cover anything above it.
- The draft screen's "Keep editing" and "Make it mine" now work (they were "Opens soon").
- Members can view their claimed draft at `/d/[siteId]`, and its photos.
- The renderer marks draft sections with `data-ys-section` so the editor can select them (live pages carry no ids).
- `/api/health` reports `phase: 2`.

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
