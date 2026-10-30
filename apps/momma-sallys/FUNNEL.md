# Momma Sally's catering funnel

Landing page `/catering` (one offer + quote form) → lead saved in Momma Sally's pipeline (stage **Inquiry**)
→ day 0 confirmation email → day 1 / 3 / 7 follow-ups (only if they ticked the consent box) → Nicole quotes,
adds an optional deposit link, and marks the lead **Booked**. A weekly summary emails her every Monday.

Email only. **No marketing texts** until Nicole has her own registered texting number (`TEXTS_ENABLED` in
`config/funnel.ts` stays `false`; the form says no texts are sent).

## Pages
| Path | Who | What |
|---|---|---|
| `/catering` | public | Funnel page: hero, offer bar, what we bring, quote form, how it works, packages (no prices until confirmed), Meet Nicole, FAQ |
| `/events` | public | "Get my party quote" button → `/catering?type=party&src=events#quote` |
| `/catering/unsubscribe?t=…` | lead | Confirm-button unsubscribe (also one-click via the `List-Unsubscribe` header) |
| `/office` | owner | Access-code sign-in, then the pipeline (Inquiry → Proposal sent → Tasting → Booked / Lost) |
| `/office/lead/[id]` | owner | Contact, notes, stage buttons, "they replied", quote total + note + **deposit link**, email log, history |
| `/office/weekly` | owner | This week + last week: visits (by source), leads (by source), visit→lead, quotes sent, booked, lost, reply time |
| `/office/links` | owner | Tagged links + QR codes (truck, Facebook, Google, flyers) |

## Follow-up rules
- Day 0 confirmation always goes out (it answers their request). Day 1/3/7 go out at 10 AM Central only when the
  consent box was ticked; the consent wording and time are saved with the lead.
- Waiting follow-ups are cancelled the moment the lead **replies** (Nicole taps "They replied"), is **Booked** or
  **Lost**, or **unsubscribes**.
- Every email has an unsubscribe link, the reason they're getting it, and the mailing address.
- Fails closed: no `FUNNEL_MAILING_ADDRESS`, no email. Outside production, mail only goes to
  `FUNNEL_EMAIL_ALLOWLIST`. In production nothing sends until `FUNNEL_EMAIL_LIVE=1`.

## Data
`db/migrations/20261030000100_catering_funnel.sql` (tables `ms_*`). RLS on, no policies, no table grants to public
keys. The site's server reaches them only through `ms_funnel(key, op, args)`, which checks `MS_FUNNEL_KEY`
against a stored SHA-256 hash. Apply it to **Momma Sally's own database**, then set the hash (see the file header).

## Environment
| Name | Notes |
|---|---|
| `FUNNEL_DB_URL`, `FUNNEL_DB_PUBLIC_KEY` | Her database URL and its public (publishable) key |
| `MS_FUNNEL_KEY` | Server secret; its SHA-256 goes in `ms_funnel_config` |
| `RESEND_API_KEY` | Email sending key |
| `FUNNEL_FROM` | e.g. `Momma Sally's BBQ <catering@mamasallys.com>` (domain must be verified for sending) |
| `FUNNEL_REPLY_TO`, `OWNER_EMAIL` | Where replies and new-lead alerts / Monday summaries go |
| `FUNNEL_MAILING_ADDRESS` | Postal address printed in every email (required by law; fail closed) |
| `OWNER_ACCESS_CODE`, `OFFICE_SESSION_SECRET` | Owner sign-in for `/office` |
| `CRON_SECRET` | Protects `/api/catering/weekly` (Monday 14:00 UTC job in `vercel.json`) |
| `FUNNEL_EMAIL_ALLOWLIST` | Preview only: the test inboxes allowed to receive mail |
| `FUNNEL_TEST_FOLLOWUP_MINUTES` | Preview only: e.g. `3,6,9` makes day 1/3/7 land after minutes (ignored in production) |
| `FUNNEL_EMAIL_LIVE` | Production only: `1` turns real sending on |

## Placeholders waiting on Nicole (all in `config/funnel.ts` unless noted)
`OFFER` (headline, Spanish line, end date) · `REPLY_PROMISE` · `DEPOSIT_LINE` (amount/%) · `SERVICE_AREA` + travel fee ·
`BOOK_AHEAD` · `PRICES_CONFIRMED` (+ the prices in `config/catering.ts`) · `MIN_GUESTS` (kept at 20) ·
`FUNNEL_MAILING_ADDRESS` · sending address on mamasallys.com · reviews for a proof section (none shown until she OKs real ones).
