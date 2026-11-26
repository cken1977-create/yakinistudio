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

1. **Vercel domain limit per project.** Confirmed 2026-11-23: brsa-registry is on Vercel Pro. Official docs list Pro as unlimited with a soft limit of 100,000 domains per project (Hobby is 50). `DEFAULT_DOMAIN_LIMIT` is now 100,000 with a headroom of 5; override with `VERCEL_PROJECT_DOMAIN_LIMIT` if that changes.
2. **Operator access logging.** RLS can't log reads. Operators read through RLS, and every operator *write* goes through server routes that write `audit_log`. If operator *reads* must be logged too, they need a server-only read path (Phase 2).
3. **Expose the `builder` schema.** On the hosted project, add `builder` to the API's exposed schemas (Settings → API).
4. **Backups.** Daily backups are included on Supabase Pro; point-in-time recovery is an add-on. Clarence decides the cost (see `docs/ARCHITECTURE.md`).
5. **Next.js security upgrade.** Next prints a security advisory after `next build` (retrying the build passes). Recommended: run `npx next upgrade --agent=security` in a separate PR, then re-run both builds.
6. **CI workflow file.** The agent's GitHub token can't write `.github/workflows`. The workflow is at `apps/builder/ci/builder-ci.yml`; copy it to `.github/workflows/builder-ci.yml` to turn it on.
7. **Studio CSP.** Scripts now use a per-request nonce and `strict-dynamic` in `proxy.ts` (no script-src `'unsafe-inline'`). Style tags are nonced; React style attributes stay allowed via `style-src-attr`.

## New questions from Phase 1

1. **Settings to turn the studio on** (names only; values are yours to add in Vercel): `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DRAFT_TOKEN_PEPPER` and `IP_HASH_PEPPER` (long random strings), `XAI_API_KEY`, `CRON_SECRET`, `DEMO_ORIGIN` (default `https://yakini.digital`). Without them the studio shows "The studio isn’t open yet" instead of failing. On yakini.digital: `BUILDER_HANDOFF_ENABLED=1` (and `BUILDER_STUDIO_ORIGIN` only for a preview).
2. **Kit sample pictures.** Settled in Phase 2: the kits now use the approved sample photos (see Phase 2 item 5).
3. **Photos read from a client's own site** are stored as not redistributable until the owner confirms them (matters for the Phase 4 export).
4. **Draft screen buttons.** Settled in Phase 2: "Keep editing" and "Make it mine" both work.
5. **Report link on drafts.** Settled in Phase 3: drafts, share previews and live sites all carry the Report link (spec 7.3).
6. **Studio landing.** `/` still says the studio is opening soon. Spec §12 wants "Your website, ready in minutes." with two buttons; switch it when you're ready to open the studio.
7. **First draft snapshot kind.** The Phase 0 table has no `draft` kind, so the first draft is saved as a `checkpoint` (no migration needed).
8. **Nonce-based CSP (Phase 0 item 7)** is in its own PR (`proxy.ts` + `lib/csp.ts`). Every studio page renders per request: the studio layout awaits `connection()` (from `next/server`), because a prerendered page can't carry the request's nonce and its scripts would be blocked.
9. **Visual snapshot baselines.** Browser tests save screenshots as a CI artifact; pixel-diff baselines can be locked in after you've looked at the first run.

## Spec deviations (forced by Next 16)

- `middleware.ts` is deprecated in Next 16, so this uses `proxy.ts` (same behavior).
- Folders starting with `_` are private in the App Router, so the renderer lives at `app/%5Fsite/[host]/[[...path]]`. The URL path is still `/_site/...`, and the proxy blocks direct requests to it.
- RLS tests run on a plain Postgres 17 with a small Supabase shim (roles, `auth.uid()`, storage tables), not the Supabase CLI. CI does the same with a `postgres:17` service.

## New questions from Phase 2

1. **Sign-in email settings (Supabase Auth, yours to set).** For "Make it mine" to work on the live studio: (a) add `https://studio.yakini.digital/auth/callback` to Auth → URL Configuration → Redirect URLs; (b) the "Magic Link" email template must show the 6-digit code (`{{ .Token }}`) as well as the link, because a link only signs in on the device that asked for it; (c) to send from a Yakini address with Yakini branding (spec 5.4), point Auth → SMTP at Resend. Until (a) and (b) are done, sign-in works by link on the same device only. The studio also needs `NEXT_PUBLIC_SUPABASE_ANON_KEY` (public, names only here).
2. **Typing straight onto the page.** Spec 10.3 describes typing directly on the page. This PR edits words in the side panel (bottom sheet on phones) after tapping the section, with live counters, which covers every field and works the same on phone and desktop. Typing on the page itself is a follow-up if you want it.
3. **Destiny's voice in the Help tab** is not built (spec: optional). Text answers work now.
4. **Tutorial screenshots.** The browser tests take them at 390 and 1280 on every check run (the `builder-screenshots` download on each run). This session can't download them, so the written tutorial shows words only for now; adding them is a small follow-up (copy `tutorial-<step>-<size>.png` to `public/tutorial/<step>-<size>.png` and list them in `lib/editor/tutorial-shots.ts`).
5. **Kit photos.** The approved photos are in. Food truck and restaurant each use 5 (new drafts get a photo hero and menu photo; all 5 are in the editor's Kit photos). The other 8 kits' photos are stored in `apps/builder/kit-photos/<kit>/` with alt text in each `manifest.json`, ready for Phase 8. Six were left out: #04 and #11 (faces in focus; #11 also has a tangle of hands), #18 (a small brand badge on the range hood), #33 and #35 (hands that don't read right), #36 (a large painted face in the mural). #01 and #07 were kept though a small, out-of-focus face shows in the background; say if you want them out. They're marked Yakini-owned and allowed in "Download my site", which assumes the image generator's terms let Yakini use and pass on the pictures commercially; please confirm. The earlier drawings stay in the code only so older drafts keep showing them.
6. **Claim screen time zone.** Picked from the device when it's a US zone, otherwise worked out from the address state (El Paso stays on Mountain time). A screen to change it later isn't in this PR (it matters first for the Today card). Non-US addresses aren't accepted yet (the site format is US-only).

## New questions from Phase 3

1. **Apply the Phase 3 migration before deploying this branch.** `20261125000100_builder_phase3_publish.sql` adds the functions publishing needs. It is in the repo only; nothing was applied to the live database. Until it is applied, the publish, report and ops routes will fail on the live studio.
2. **Subdomains need the Vercel Domains API settings** (names only): `VERCEL_API_TOKEN`, `VERCEL_TEAM_ID`, `VERCEL_BUILDER_PROJECT_ID`, plus the one-time wildcard DNS record `*.yakini.digital` (13.2 B, Q3). Without them a published address stays "being set up" (pending) and doesn't serve. Done 2026-11-24: the env names are set, the `*.yakini.digital` record is live at Namecheap, and the subdomains in use (composer, mission, portal, sign, studio, www, send) are reserved in code.
3. **Alert emails need** `RESEND_API_KEY`, `EMAIL_FROM` and `OPERATOR_EMAIL` on the builder project. Done 2026-11-24.
4. **Publishing without a plan.** Until billing (Phase 4), an owner can't go live; an operator with `can_override_publish` can, with a reason, and the first such publish waits for review. Members can always see their site at `/p/<siteId>`, which is the "preview address" of spec 5.6 step 3.
5. **Indexing switch.** Decided 2026-11-25: add the owner switch with billing in Phase 4. Sites are noindex until they have a paid plan *and* `sites.indexable` is on. There is no owner switch for it yet ("Let search engines find this site"); suggest adding it with billing in Phase 4.
6. **Copy lint at publish** (decided 2026-11-25: OK as is) blocks vendor names and "AI-built" wording (R7/R8) but does not yet let the owner "keep flagged text" (11.1 item 6); it does not check "$" amounts, because a business's own menu prices are its content and R9 is Yakini's own price line. OK?
7. **Outside links** (decided 2026-11-25: OK) count as working when the site answers, including 401/403/405/429 (many sites block robots). OK?
8. **Profanity in addresses.** Done 2026-11-25: a built-in list in `packages/abuse/src/reserved.ts` refuses rude words and slurs as address parts (ordinary words that contain them still pass). Originally: Reserved words, Yakini's own subdomains and exact big-brand names are refused; names that only contain a brand go to review. There is no profanity list yet; please send one if you want it.
9. **Operator desk** has reports, reviews and Check stored sites. The full tenant list of Flow H (status, domains, AI usage, hand-off) is not in Phase 3.
10. **Lighthouse in CI.** The numbers in `docs/phase3-evidence` are local runs. Adding a Lighthouse step to `.github/workflows/builder-ci.yml` would give steadier numbers; say if you want it.
11. **Contrast on brand buttons.** Fixed on `feat/builder-industries`: a link rule (`.ys-site a { color: inherit }`) was beating the button colors, so button text took the surrounding color (and was invisible on solid bands). Originally: Lighthouse flags dark text on the food-truck kit's brick-red buttons (accessibility still 96). The renderer picks black or white ink and never changes the brand color (R6); a slightly stronger ink rule would fix it. Phase 8 polish?
12. **Merge order.** PR #122 (studio pages render per request so the CSP nonce reaches `/`) should merge before or with this branch.

## New questions from the industries work (`feat/builder-industries`)

1. **Which plan does a "Business and services" site buy?** Decided 2026-11-25: the Template website (`defaultProduct` in `@yakini/pricing`), also for kits not sold in-app. Originally: The general layout (`service`) is not a sold kit, so it has no kit price. The closest existing product is the Template website ($99 setup, $79 a month), which already lists "service business". Until billing (Phase 4) this doesn't matter: unpaid sites can't go live without an operator override. Please confirm the plan mapping before Phase 4.
2. **Industries whose kit isn't built yet** (specialized operations, cannabis, home health, reentry) use the general layout, with the industry name passed to the writer. The other seven kits are built on `feat/builder-kits`. These four have no approved photos yet; send photos (or say to build them text-only) and they can follow the same pattern.
3. **The /demo hand-off.** Decided 2026-11-25: every kit hands off; kits without their own studio kit start on the general layout, named for the kit. Originally: it handed off nine kits (`STUDIO_KITS`). It still says "coming soon" for the four quote-only or unbuilt kits. Should those start a general-layout draft instead?
4. **The industry list** (173 entries in 17 groups) is in `packages/kits/src/industries.ts`. Add or rename freely; ids must stay stable once sites use them. Industry is not stored on the site yet, only used to build the draft; storing it can come with the tenant list (Flow H).

## Billing provider (decided 2026-11-25, for Phase 4)

**PayPal, not Stripe.** Clarence chose PayPal for plans and payments. Phase 4 follows this even where
the spec says Stripe. What it changes, to do in Phase 4 (nothing changed yet):
- `@yakini/pricing` `products.ts` names Stripe price env vars (`STRIPE_PRICE_*`); these become PayPal plan
  ids (`PAYPAL_PLAN_*`), one per plan, with the setup fee as the plan's setup fee.
- `env.ts` lists `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET`; these become `PAYPAL_CLIENT_ID`,
  `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID` and `PAYPAL_ENV` (sandbox or live).
- The live database already has Stripe-named columns (`tenants.stripe_customer_id`,
  `subscriptions.stripe_subscription_id`, `stripe_price_ids`, table `stripe_events`), all empty. A new
  Phase 4 migration renames them to provider-neutral names; Clarence applies it, as before.
- Customer copy never names the payment company beyond what PayPal's own buttons show.

## New questions from Phase 4

1. **Apply the Phase 4 migration before deploying this branch.** `20261126000100_builder_phase4_billing.sql` (repo only). Without it the plan page, webhook and Publish screen fail on the live studio.
2. **PayPal settings in Vercel** (builder project, Production and Preview): `PAYPAL_ENV` (`sandbox` first, `live` later), `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET` (mark Sensitive), `PAYPAL_WEBHOOK_ID`. The webhook in PayPal points at `https://studio.yakini.digital/api/billing/paypal/webhook` with the events listed in the PR.
3. **Price line vs the Template website.** R9's only public price line is "Setup from $299. Monthly plans from $149.", but the Template website (the plan general-kit sites buy) is $99 + $79 a month. The plan page shows the real amounts from the pricing config. Should the public line change, or should general-kit sites buy a kit plan instead?
4. **Card without a PayPal account** for subscriptions depends on your PayPal account settings; worth confirming with PayPal.
5. **Switching plans** (e.g. Small → Growing) is cancel then choose again for now; PayPal's plan revision can come later.
6. **Hand-marked tenants** (paid outside the studio, e.g. your PayPal link) never lapse automatically; an operator manages them.

## Founding offer (decided 2026-11-26)

Clarence: the first 20 businesses pay the setup fee and nothing more until January 31, 2027; monthly
billing starts February 1, 2027 at the normal price. Built on `feat/builder-founding-offer`.

1. **Apply `20261126000200_builder_founding_offer.sql`** before deploying that branch (repo only).
2. **Sandbox check needed:** PayPal is told to start monthly billing on February 1 (`start_time`).
   The setup fee should be charged at approval. Please confirm in the sandbox buyer's Activity that
   only the setup fee was taken today. If PayPal also charges the first month, tell me and the offer
   switches to a plan with a free trial period instead.
3. **Public price line (R9):** the offer adds a second price message ("setup today, nothing more
   until February 1, 2027") on the plan page. It is not on yakini.digital; say if you want it there.
4. **Spots** are held at "Continue to PayPal" and go back to the pool if not paid within a day.

## Phase 5a (custom domains)

| # | Question | Answer in use | Status |
|---|---|---|---|
| P5-1 | Which domains can owners connect? | Any domain they own; one per site; whole domain adds www. | Default |
| P5-2 | Who manages DNS? | The owner adds records at their own provider; we never change their DNS. | Default |
| P5-3 | First live test | `test.brsaregistry.com` (CNAME at Namecheap). The `brsaregistry.com` apex stays on its current project. | **Clarence adds the record** |
| P5-4 | Client-owned hosting ("Move to my accounts") | Phase 5b, next. | Open |
