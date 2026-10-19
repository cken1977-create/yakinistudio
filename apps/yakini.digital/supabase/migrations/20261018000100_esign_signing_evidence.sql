-- Yakini E-Sign: store signing evidence on the contract row.
-- Target: Supabase project "yakini" (ref mxshsmknfqxwltucgezl) ONLY.
-- Additive and idempotent. The signing route works without this (it keeps the hash
-- and signature in contract_audit.notes); after this runs it also fills these columns.

do $$
begin
  -- Wrong-project guard: the yakini project has these tables; the portal project does not.
  if to_regclass('public.contracts') is null
     or to_regclass('public.contract_audit') is null
     or to_regclass('public.contract_fields') is null
     or to_regclass('public.partnership_applications') is null then
    raise exception 'WRONG PROJECT: expected the yakini project (mxshsmknfqxwltucgezl). Nothing changed.';
  end if;
  if to_regclass('public.help_request_events') is not null or to_regclass('public.knocks') is not null then
    raise exception 'WRONG PROJECT: this looks like the yakini-portal project. Nothing changed.';
  end if;
end $$;

alter table public.contracts
  add column if not exists document_hash  text,
  add column if not exists signature_type text,
  add column if not exists signature_data text,
  add column if not exists consent_text   text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'contracts_signature_type_chk') then
    alter table public.contracts
      add constraint contracts_signature_type_chk
      check (signature_type is null or signature_type in ('typed','drawn'));
  end if;
end $$;

comment on column public.contracts.document_hash is 'SHA-256 (hex) of the canonical contract text the signer was shown';
comment on column public.contracts.signature_data is 'Drawn signature as a PNG data URL (null when typed)';

-- Tell PostgREST about the new columns right away.
notify pgrst, 'reload schema';
