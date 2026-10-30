-- Security review 2026-10-29 (finding M1): remove leftover "allow everyone" policies.
-- Target: Supabase project "yakini" (ref mxshsmknfqxwltucgezl) ONLY.
--
-- Today these policies are inert, because the Oct 18 lockdown revoked every table
-- grant from anon/authenticated (verified live Oct 29: all 7 tables return 401 to the
-- public key). But a single GRANT would instantly reopen contracts, signing tokens,
-- clients, invoices and projects to the internet. This drops them so RLS is
-- default-deny with no policies at all.
--
-- App impact: none. Every read/write of these tables goes through lib/esign/server.ts
-- (server-only, service-role key, which bypasses RLS).
-- Idempotent. NOT APPLIED. Needs Clarence's OK after merge.

do $$
begin
  if to_regclass('public.contracts') is null
     or to_regclass('public.contract_audit') is null
     or to_regclass('public.contract_fields') is null
     or to_regclass('public.auth_tokens') is null then
    raise exception 'WRONG PROJECT: expected the yakini project (mxshsmknfqxwltucgezl). Nothing changed.';
  end if;
  if to_regclass('public.help_request_events') is not null or to_regclass('public.knocks') is not null then
    raise exception 'WRONG PROJECT: this looks like the yakini-portal project. Nothing changed.';
  end if;
end $$;

begin;

drop policy if exists "Allow all on contracts"       on public.contracts;
drop policy if exists "Allow all on contract_fields" on public.contract_fields;
drop policy if exists "Allow all on contract_audit"  on public.contract_audit;
drop policy if exists "Allow public inserts"         on public.auth_tokens;
drop policy if exists "Allow public reads"           on public.auth_tokens;
drop policy if exists "Allow public updates"         on public.auth_tokens;
drop policy if exists "Allow public reads"           on public.clients;
drop policy if exists "Anon read invoices"           on public.invoices;
drop policy if exists "Anon read projects"           on public.projects;

-- Keep RLS on and make the Oct 18 grant lockdown explicit (no-op if already revoked).
alter table public.contracts       enable row level security;
alter table public.contract_fields enable row level security;
alter table public.contract_audit  enable row level security;
alter table public.auth_tokens     enable row level security;
alter table public.clients         enable row level security;
alter table public.invoices        enable row level security;
alter table public.projects        enable row level security;

revoke all on public.contracts, public.contract_fields, public.contract_audit,
              public.auth_tokens, public.clients, public.invoices, public.projects
  from anon, authenticated;

commit;
