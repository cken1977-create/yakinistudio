# Phase 4 — Billing with PayPal (spec v1.2, written 2026-11-26)

Written by Claude from Clarence's decisions (PayPal over Stripe, Template website for general-kit
sites, indexing switch with billing). Hard rules R1–R16 from 00-core.md still apply.

## Goal
An owner chooses a plan and pays through PayPal. Paying unlocks publishing without an operator
override; a payment that stops pauses publishing and, after the grace period, takes the site
offline. Owners of paid sites can let search engines find their site.

## Plans (R9: amounts come only from `@yakini/pricing`)
- Products: the Template website (`website-simple`) and each sold kit at Small, Growing and Larger
  (`kit:<kit>:<size>`). A general-kit site (`service`) and a kit not sold in-app default to the
  Template website (`defaultProduct`).
- Each product is one PayPal subscription plan: the setup amount is the plan's setup fee, the
  monthly amount repeats every month. Plans are created in PayPal from `/ops/billing` ("Set up plans
  in PayPal") with the server's credentials and stored in `builder.billing_plans`; no plan ids in
  environment variables. Changing a price in `@yakini/pricing` and pressing the button again makes a
  new plan; the old one is deactivated.

## Owner flow (Flow J)
1. `/sites/[id]/plan` (owner only): the default plan first, other sizes below, with the amounts
   from the pricing config. "Continue to PayPal".
2. `POST /api/sites/[id]/billing/checkout`: creates a PayPal subscription with `custom_id` = tenant
   id and sends the owner to PayPal's approval page (303). Nothing is stored as paid yet.
3. PayPal returns to `/sites/[id]/plan?paid=1`; the server reads the subscription from PayPal (never
   trusting the query string) and records it.
4. The webhook (`POST /api/billing/paypal/webhook`) is the source of truth for every later change.
5. With an active plan the checklist's plan item passes and Publish works without override.
6. "Cancel plan" (owner): cancels in PayPal; the plan stays in force until the end of the paid
   month, then the tenant becomes canceled.

## Webhook
- Every event is verified with PayPal (`verify-webhook-signature` with `PAYPAL_WEBHOOK_ID`) before
  anything is read from it. Unverified: 400, nothing stored.
- Each event id is stored once in `builder.billing_events`; repeats are acknowledged and ignored.
- `custom_id` must name an existing tenant, and a subscription id already linked to another tenant
  is refused.
- Status map: ACTIVE → active; SUSPENDED (failed payments) → past_due; CANCELLED, EXPIRED → canceled
  (at the end of the paid period when PayPal gives one). Payments completed move the paid-through
  date forward.

## Lapsed plans
- past_due: the site stays live; the owner can't publish new versions after `PAST_DUE_GRACE_DAYS`
  (default 7); the owner sees a banner with "Update payment in PayPal".
- canceled and the paid period over, or past_due beyond the grace period: the nightly cleanup takes
  the site offline ("This site is being updated"), audited as `billing.lapse`. Nothing is deleted;
  paying again and publishing brings it back.
- Visitors never see a billing message. Nothing is sent to visitors or prospects (R4/R5); the owner
  and the operator get one email each per change.

## Search engines (from Phase 3 question 5)
- Publish screen: "Let search engines find this site", owners only, requires an active plan.
  Stored in `sites.indexable`; the renderer already serves noindex unless paid and indexable.

## Operator desk
- `/ops/billing`: PayPal connection status (names of missing settings only), "Set up plans in
  PayPal", and every subscription with tenant, plan, status and paid-through date.

## Settings (names only, values in Vercel)
`PAYPAL_ENV` (`sandbox` or `live`), `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_WEBHOOK_ID`.
The old `STRIPE_*` names are removed.

## Database (repo only; Clarence applies it)
- Provider-neutral names: `tenants.stripe_customer_id` → `billing_customer_id`;
  `subscriptions.stripe_subscription_id` → `provider_subscription_id`, `stripe_price_ids` →
  `provider_plan_ids`, new `provider` (default `paypal`) and `paid_through`; table `stripe_events` →
  `billing_events` with `provider`.
- New `billing_plans` (operator read only).
- Server-only functions, each one transaction with its audit row: `record_subscription`,
  `set_site_indexable`, `lapse_due_sites`. New audit actions `billing.change`, `billing.lapse`,
  `indexing.change`.

## Acceptance
1. In test mode, an owner chooses a plan, approves on the stand-in PayPal page, comes back to an
   active plan and publishes without an operator. Browser test at 390 and 1280 with screenshots.
2. Webhook: a bad signature is refused; a repeated event changes nothing; a suspended plan is
   past_due; a cancelled plan lapses after its paid period and the site goes offline in cleanup.
3. Indexing switch only for paid owners; the live site's robots tag follows it.
4. Amounts shown and sent to PayPal equal `@yakini/pricing` (unit test).
5. Migration and RLS checks: owners read only their own subscription; billing_events and
   billing_plans are not readable by owners; functions are service-role only.
6. Sandbox run (Clarence): with the sandbox settings in Vercel, set up plans, buy one with a
   sandbox buyer account, see the site's plan turn active.
