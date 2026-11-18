-- Holiday Giveaway (yakini.digital/holiday): applications and nominations.
-- Target: Supabase project "yakini" (ref mxshsmknfqxwltucgezl) ONLY.
-- Additive and idempotent. NOT APPLIED. Needs Clarence's OK.
--
-- Security: RLS is ON with NO policies, and every grant to anon / authenticated is
-- revoked, so the public (browser) key can't read, insert or update anything. Only the
-- site's server code (service-role key, /api/holiday and /dashboard/holiday) touches it.
-- Until this runs, /api/holiday still emails each submission to clarence@yakini.digital
-- so nothing is lost, and /dashboard/holiday shows a "not applied" notice.

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

create table if not exists public.holiday_giveaway_submissions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  campaign          text not null default 'holiday-2026' check (campaign ~ '^[a-z0-9-]{1,60}$'),
  type              text not null check (type in ('apply','nominate')),

  -- The business or organization that would receive the help.
  name              text not null check (char_length(name) between 1 and 120),
  business_name     text not null check (char_length(business_name) between 1 and 160),
  email             text check (email is null or (char_length(email) between 3 and 254 and email = lower(email))),
  phone             text check (phone is null or char_length(phone) between 7 and 40),
  location          text not null check (char_length(location) between 2 and 160),
  what_they_do      text not null check (char_length(what_they_do) between 2 and 2000),
  why_help          text not null check (char_length(why_help) between 10 and 4000),

  -- Only for nominations: the person who nominated them.
  nominator_name    text check (nominator_name is null or char_length(nominator_name) between 1 and 120),
  nominator_email   text check (nominator_email is null or (char_length(nominator_email) between 3 and 254 and nominator_email = lower(nominator_email))),
  nominator_phone   text check (nominator_phone is null or char_length(nominator_phone) between 7 and 40),

  -- Where they came from (the ad links here).
  utm_source        text check (utm_source is null or char_length(utm_source) <= 120),
  utm_medium        text check (utm_medium is null or char_length(utm_medium) <= 120),
  utm_campaign      text check (utm_campaign is null or char_length(utm_campaign) <= 120),
  utm_content       text check (utm_content is null or char_length(utm_content) <= 120),
  referrer          text check (referrer is null or char_length(referrer) <= 500),
  ip_hash           text check (ip_hash is null or ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent        text check (user_agent is null or char_length(user_agent) <= 400),

  -- Review (filled in later by Clarence / the team).
  status            text not null default 'new' check (status in ('new','reviewing','selected','not_selected','contacted')),
  notes             text,

  constraint holiday_contact_present check (email is not null or phone is not null),
  constraint holiday_nominator_fields check (
    (type = 'apply' and nominator_name is null and nominator_email is null and nominator_phone is null)
    or (type = 'nominate' and nominator_name is not null and nominator_email is not null)
  )
);

comment on table public.holiday_giveaway_submissions is
  'Holiday Giveaway applications and nominations from yakini.digital/holiday. Server-only; RLS on, no policies.';

create index if not exists holiday_giveaway_submissions_created_idx
  on public.holiday_giveaway_submissions (campaign, created_at desc);

alter table public.holiday_giveaway_submissions enable row level security;
revoke all on public.holiday_giveaway_submissions from anon, authenticated;
grant all on public.holiday_giveaway_submissions to service_role;

commit;
