# Phase 5a — Custom domains (spec v1.2, from Clarence's Phase 5–8 plan, 2026-11-26)

Phase 5 is split: **5a custom domains** (this) and **5b "Move to my accounts"** (client-owned hosting).

## Goal
A paying owner connects their own domain. The studio shows the exact DNS records, checks them,
and once they are right the site is served there with HTTPS and that address becomes the main
one; the `name.yakini.digital` address keeps working and forwards to it.

## Flow (`/sites/[id]/domain`, owners and operators; works without JavaScript)
1. Enter a domain: a whole domain (`example.com`, also adds `www.example.com`) or a subdomain
   (`shop.example.com`). Refused: yakini.digital and its subdomains, vercel.app, IP addresses,
   names that aren't valid host names, a name another site uses. One custom domain per site.
2. Plan gate: an active plan (or an operator) is required.
3. The studio adds the name(s) to the Builder project (Vercel Domains API) and shows the records
   Vercel asks for: `A @ <IP>` for a whole domain, `CNAME <label> <target>` for www and subdomains,
   and a `TXT` record when Vercel needs proof of ownership. Values come from Vercel, never guessed.
4. "Check now" (and the nightly cleanup) asks Vercel again. Status: waiting for DNS → active
   (HTTPS issued by Vercel). When the main name is active it becomes the site's primary address;
   other addresses redirect to it (existing renderer rule).
5. Remove: the names are removed from Vercel, the subdomain becomes primary again. Audited.

## Acceptance
- Test domain `test.brsaregistry.com` (Clarence's; the apex is live elsewhere and must not be
  touched) goes live end to end.
- Browser test at 390/1280 of connect → records → active → remove (test mode stand-in).
- Migration + DB tests for the new functions; no client access to domain writes.
