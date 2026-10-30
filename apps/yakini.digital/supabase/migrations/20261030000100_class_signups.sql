-- Yakini Academy free class: signups + the emails sent to them.
-- Target: Supabase project "yakini" (ref mxshsmknfqxwltucgezl) ONLY.
-- Additive and idempotent. NOT APPLIED. Needs Clarence's OK after merge.
--
-- Security: RLS is ON for both tables with NO policies, and every grant to anon /
-- authenticated is revoked, so the public (browser) key can't read, insert or update
-- anything. Only the site's server code (service-role key) touches these tables.
-- Until this runs, /class and /clase show a "signups open soon" state and save nothing.

do $$
begin
  -- Wrong-project guard: the yakini project has these tables; the portal project does not.
  if to_regclass('public.contracts') is null
     or to_regclass('public.leads') is null then
    raise exception 'WRONG PROJECT: expected the yakini project (mxshsmknfqxwltucgezl). Nothing changed.';
  end if;
  if to_regclass('public.help_request_events') is not null or to_regclass('public.knocks') is not null then
    raise exception 'WRONG PROJECT: this looks like the yakini-portal project. Nothing changed.';
  end if;
end $$;

begin;

create extension if not exists pgcrypto;

create table if not exists public.class_signups (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  class_slug          text not null default 'build-something-yours' check (class_slug ~ '^[a-z0-9-]{1,60}$'),

  first_name          text not null check (char_length(first_name) between 1 and 60),
  email               text not null check (char_length(email) between 3 and 254 and email = lower(email)),
  language            text not null check (language in ('en','es')),
  landing_path        text not null check (landing_path in ('/class','/clase')),

  phone               text check (phone is null or phone ~ '^\+[1-9][0-9]{6,14}$'),
  sms_consent         boolean not null default false,
  sms_consent_text    text,
  sms_consent_at      timestamptz,
  sms_opted_out_at    timestamptz,

  email_consent_text  text not null,
  consent_at          timestamptz not null default now(),
  consent_page_url    text check (consent_page_url is null or char_length(consent_page_url) <= 500),
  ip_hash             text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent          text check (user_agent is null or char_length(user_agent) <= 400),

  country             text check (country is null or country ~ '^[A-Z]{2}$'),
  country_source      text check (country_source is null or country_source in ('form','geo')),
  timezone            text check (timezone is null or char_length(timezone) <= 64),

  source              text not null default 'direct'
                        check (source in ('instagram','tiktok','facebook','youtube','x','linkedin','ad','direct','other','teachable')),
  utm_source          text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium          text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign        text check (utm_campaign is null or char_length(utm_campaign) <= 120),
  utm_content         text check (utm_content is null or char_length(utm_content) <= 120),
  utm_term            text check (utm_term is null or char_length(utm_term) <= 120),
  referrer            text check (referrer is null or char_length(referrer) <= 500),

  access_token        text not null unique default encode(gen_random_bytes(24), 'hex'),

  started_at          timestamptz,
  watched_at          timestamptz,
  stage               text not null default 'signed_up'
                        check (stage in ('signed_up','watched','workbook','course','plan')),

  unsubscribed_at     timestamptz,
  unsubscribed_via    text check (unsubscribed_via is null or unsubscribed_via in ('link','one_click','admin','reply')),

  session_at          timestamptz, -- empty in v1 (on-demand replay); for live sessions later

  constraint class_signups_sms_consent_chk
    check (not sms_consent or (phone is not null and sms_consent_text is not null and sms_consent_at is not null)),
  constraint class_signups_email_per_class unique (class_slug, email)
);

create table if not exists public.class_emails (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  signup_id      uuid not null references public.class_signups(id) on delete cascade,
  kind           text not null check (kind ~ '^(confirm|ready|reminder_1|reminder_2|followup_[1-9])$'),
  send_id        text check (send_id is null or char_length(send_id) <= 120),
  scheduled_for  timestamptz,
  status         text not null check (status in ('scheduled','sent','canceled','failed','skipped')),
  error          text check (error is null or char_length(error) <= 300)
);

create index if not exists class_signups_created_idx   on public.class_signups (class_slug, created_at desc);
create index if not exists class_signups_ip_recent_idx on public.class_signups (ip_hash, created_at desc);
create index if not exists class_emails_signup_idx     on public.class_emails (signup_id, kind, created_at desc);
create index if not exists class_emails_scheduled_idx  on public.class_emails (status) where status = 'scheduled';

create or replace function public.class_touch_updated_at() returns trigger
  language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists class_signups_touch on public.class_signups;
create trigger class_signups_touch before update on public.class_signups
  for each row execute function public.class_touch_updated_at();
drop trigger if exists class_emails_touch on public.class_emails;
create trigger class_emails_touch before update on public.class_emails
  for each row execute function public.class_touch_updated_at();

-- Locked: RLS on, no policies, no public grants. Server (service_role) only.
alter table public.class_signups enable row level security;
alter table public.class_emails  enable row level security;

revoke all on public.class_signups, public.class_emails from anon, authenticated, public;
grant select, insert, update, delete on public.class_signups, public.class_emails to service_role;
revoke all on function public.class_touch_updated_at() from anon, authenticated, public;

comment on table public.class_signups is 'Yakini Academy free class signups (one row per person per class). Server-only; RLS on, no policies.';
comment on table public.class_emails  is 'Emails sent or scheduled for class signups. Server-only; RLS on, no policies.';
comment on column public.class_signups.ip_hash is 'Salted SHA-256 of the signup IP (never the raw IP)';

commit;

-- Tell PostgREST about the new tables right away.
notify pgrst, 'reload schema';
