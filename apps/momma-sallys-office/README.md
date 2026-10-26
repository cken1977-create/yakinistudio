# Momma Sally's Office (back office, slice 1)

Private back office for Momma Sally's at **office.mamasallys.com** (not set up yet).
Owner (Nicole) sees money. Crew sign in and see the menu, never a dollar amount.
**Everything ships OFF.** With no env set, every path returns 404.

## What's in slice 1
| Part | Flag | What it does |
|---|---|---|
| Logins + roles | `OFFICE_ENABLED` | Email sign-in link (no passwords, no sign-ups). Two roles: `owner`, `crew`. Enforced by RLS in the database, not just the UI. |
| Square sync | `OFFICE_SQUARE_SYNC_ENABLED` | Read-only OAuth to the **Square sandbox**: orders, payments + fees, catalog, customers, team (no wages). Token refresh, signed webhooks with de-dupe, daily cron, owner-only daily sales. |
| Receipts → price book | `OFFICE_RECEIPTS_ENABLED` | Photo upload (HEIC→JPEG, resized in the browser) to a private bucket, line items via a reader interface, math + duplicate checks, side-by-side review, nothing counts until Approve, learned item matches. |

Receipt reader: `RECEIPT_EXTRACTOR=manual` (default, owner types lines next to the photo) or
`mock` (labeled SAMPLE data for testing). **No paid reader is wired.** A real one is one more
`ReceiptExtractor` in `lib/receipts/providers/` once Clarence picks it.

## How crew are kept away from money
1. Every table is classified in `ms_table_classes` (`money`, `owner_only`, `service_only`, `members`).
   The test suite fails if a new table isn't classified.
2. Money and owner-only tables have owner-only RLS; synced Square tables are read-only to everyone
   but the server (service role); Square tokens are service-only and AES-256-GCM encrypted.
3. Crew get the menu through `ms_crew_menu()`, which has no price columns (Long Tree pattern).
4. Approved receipts are frozen by trigger; the price book is written only by `ms_approve_receipt()`.

## Tests
```bash
npm test                     # unit tests (signature, crypto, mappers, checks, pack sizes)
# RLS suite on a LOCAL Postgres only (the script refuses anything else):
PGHOST=/tmp PGPORT=55432 PGUSER=postgres npm run test:db
```
`supabase/tests/local-supabase-shim.sql` fakes the bits of Supabase (roles, `auth.uid()`, storage) the
migrations need. Seed data is fake.

## Infrastructure needed (NOT created; needs Clarence's OK)
1. Her own Supabase project, then apply `supabase/migrations/*` in order. Auth settings: disable sign-ups,
   site URL `https://office.mamasallys.com`, redirect `https://office.mamasallys.com/auth/confirm`.
2. Seed the owner: `insert into ms_members (email, role, display_name) values ('<nicole's email>', 'owner', 'Nicole');`
   plus an auth user for that email. She claims it on first sign-in.
3. A Vercel project for `apps/momma-sallys-office`, domain `office.mamasallys.com` (DNS CNAME), env from `env.example`.
4. Square developer app (sandbox): redirect URL + webhook subscription to `/api/square/webhook` for
   `order.*`, `payment.*`, `refund.*`, `catalog.version.updated`, `customer.*`, `team_member.*`, `oauth.authorization.revoked`.
5. Production Square needs a code change (base URL + `environment` CHECK) and Clarence's OK.
