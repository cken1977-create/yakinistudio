-- Momma Sally's catering funnel: leads, follow-up email log, visit counts.
--
-- Server-only. RLS is on with NO policies and no table grants to anon/authenticated, so nothing can
-- read or write these tables directly with a public key. The site's server talks to them only through
-- ms_funnel(key, op, args), which checks a secret key (only its SHA-256 hash is stored here).
--
-- Target: Momma Sally's own database (her portal copy). Safe to re-run. Pipeline stages match the
-- portal's hospitality playbook (inquiry, proposal_sent, tasting, booked, lost).
-- After applying, set the key hash once (never commit the key itself):
--   insert into public.ms_funnel_config (id, key_hash) values (1, '<sha256 hex of MS_FUNNEL_KEY>')
--   on conflict (id) do update set key_hash = excluded.key_hash, updated_at = now();

create table if not exists public.ms_funnel_config (
  id int primary key default 1 check (id = 1),
  key_hash text not null check (key_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default now()
);

create table if not exists public.ms_catering_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  email text check (email is null or (email = lower(email) and char_length(email) <= 254 and email ~ '^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$')),
  phone text check (phone is null or phone ~ '^\+?[0-9]{10,15}$'),
  event_date date,
  headcount int check (headcount is null or headcount between 1 and 5000),
  event_type text not null default 'other' check (event_type in ('office','party','wedding','church','other')),
  budget text check (budget is null or budget in ('under_500','500_1000','1000_2500','2500_plus','not_sure')),
  notes text check (notes is null or char_length(notes) <= 2000),
  source text not null default 'direct' check (source ~ '^[a-z0-9_-]{1,32}$'),
  lang text not null default 'en' check (lang in ('en','es')),
  email_consent boolean not null default false,
  consent_text text check (consent_text is null or char_length(consent_text) <= 1000),
  consent_at timestamptz,
  stage text not null default 'inquiry' check (stage in ('inquiry','proposal_sent','tasting','booked','lost')),
  stage_changed_at timestamptz not null default now(),
  lost_reason text check (lost_reason is null or char_length(lost_reason) <= 300),
  replied_at timestamptz,
  unsubscribed_at timestamptz,
  unsub_token text not null unique default (replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '')),
  quote_amount_cents int check (quote_amount_cents is null or quote_amount_cents between 0 and 100000000),
  quote_note text check (quote_note is null or char_length(quote_note) <= 2000),
  deposit_url text check (deposit_url is null or (deposit_url ~ '^https://' and char_length(deposit_url) <= 500)),
  quote_sent_at timestamptz,
  deposit_paid_at timestamptz,
  ip_hash text,
  is_test boolean not null default false,
  check (email is not null or phone is not null)
);
create index if not exists ms_catering_leads_created_idx on public.ms_catering_leads (created_at desc);
create index if not exists ms_catering_leads_stage_idx on public.ms_catering_leads (stage, stage_changed_at desc);
create index if not exists ms_catering_leads_ip_idx on public.ms_catering_leads (ip_hash, created_at desc);

create table if not exists public.ms_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.ms_catering_leads(id) on delete cascade,
  kind text not null check (kind in ('created','stage','replied','quote','quote_sent','deposit_paid','unsubscribed','note')),
  body text check (body is null or char_length(body) <= 2000),
  created_at timestamptz not null default now()
);
create index if not exists ms_lead_events_lead_idx on public.ms_lead_events (lead_id, created_at desc);

create table if not exists public.ms_funnel_emails (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.ms_catering_leads(id) on delete cascade,
  kind text not null check (kind in ('confirm','day1','day3','day7','owner_alert','quote','weekly')),
  to_email text,
  status text not null check (status in ('sent','scheduled','skipped','failed','canceled')),
  send_id text,
  scheduled_for timestamptz,
  error text check (error is null or char_length(error) <= 300),
  created_at timestamptz not null default now()
);
create index if not exists ms_funnel_emails_lead_idx on public.ms_funnel_emails (lead_id, created_at);

create table if not exists public.ms_site_visits (
  id bigserial primary key,
  at timestamptz not null default now(),
  path text not null check (char_length(path) <= 100),
  source text not null default 'direct' check (source ~ '^[a-z0-9_-]{1,32}$')
);
create index if not exists ms_site_visits_at_idx on public.ms_site_visits (at desc);

alter table public.ms_funnel_config enable row level security;
alter table public.ms_catering_leads enable row level security;
alter table public.ms_lead_events enable row level security;
alter table public.ms_funnel_emails enable row level security;
alter table public.ms_site_visits enable row level security;
revoke all on public.ms_funnel_config, public.ms_catering_leads, public.ms_lead_events,
  public.ms_funnel_emails, public.ms_site_visits from anon, authenticated;
revoke all on sequence public.ms_site_visits_id_seq from anon, authenticated;

-- One keyed entry point. Every call must carry the server's secret key.
create or replace function public.ms_funnel(p_key text, p_op text, p_args jsonb default '{}'::jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  a jsonb := coalesce(p_args, '{}'::jsonb);
  v_id uuid;
  v_lead public.ms_catering_leads;
  v_from timestamptz;
  v_to timestamptz;
  v_res jsonb;
  v_n int;
begin
  if p_key is null or char_length(p_key) < 32
     or encode(sha256(convert_to(p_key, 'UTF8')), 'hex') is distinct from (select key_hash from public.ms_funnel_config where id = 1) then
    raise exception 'denied' using errcode = '42501';
  end if;

  if p_op = 'submit' then
    -- per-network limit: 5 requests an hour
    select count(*) into v_n from public.ms_catering_leads
      where ip_hash is not null and ip_hash = a->>'ip_hash' and created_at > now() - interval '1 hour';
    if v_n >= 5 then return jsonb_build_object('error', 'rate'); end if;
    -- same person + date within 10 minutes = the same request (double tap)
    select * into v_lead from public.ms_catering_leads
      where email is not distinct from nullif(lower(a->>'email'), '') and event_date is not distinct from nullif(a->>'event_date','')::date
        and created_at > now() - interval '10 minutes'
      order by created_at desc limit 1;
    if found then
      return jsonb_build_object('id', v_lead.id, 'unsub_token', v_lead.unsub_token, 'dup', true);
    end if;
    insert into public.ms_catering_leads (full_name, email, phone, event_date, headcount, event_type, budget, notes,
      source, lang, email_consent, consent_text, consent_at, ip_hash, is_test)
    values (btrim(a->>'full_name'), nullif(lower(btrim(a->>'email')), ''), nullif(a->>'phone', ''),
      nullif(a->>'event_date', '')::date, nullif(a->>'headcount', '')::int, coalesce(nullif(a->>'event_type', ''), 'other'),
      nullif(a->>'budget', ''), nullif(a->>'notes', ''), coalesce(nullif(a->>'source', ''), 'direct'),
      coalesce(nullif(a->>'lang', ''), 'en'), coalesce((a->>'email_consent')::boolean, false),
      case when coalesce((a->>'email_consent')::boolean, false) then a->>'consent_text' end,
      case when coalesce((a->>'email_consent')::boolean, false) then now() end,
      a->>'ip_hash', coalesce((a->>'is_test')::boolean, false))
    returning * into v_lead;
    insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'created', 'Quote request from ' || v_lead.source);
    return jsonb_build_object('id', v_lead.id, 'unsub_token', v_lead.unsub_token, 'dup', false);

  elsif p_op = 'visit' then
    insert into public.ms_site_visits (path, source) values (left(coalesce(a->>'path', '/catering'), 100), coalesce(nullif(a->>'source', ''), 'direct'));
    return jsonb_build_object('ok', true);

  elsif p_op = 'email_log' then
    insert into public.ms_funnel_emails (lead_id, kind, to_email, status, send_id, scheduled_for, error)
    values (nullif(a->>'lead_id', '')::uuid, a->>'kind', a->>'to_email', a->>'status', a->>'send_id',
      nullif(a->>'scheduled_for', '')::timestamptz, left(a->>'error', 300))
    returning id into v_id;
    return jsonb_build_object('id', v_id);

  elsif p_op = 'email_set_status' then
    update public.ms_funnel_emails set status = a->>'status', error = left(a->>'error', 300) where id = (a->>'id')::uuid;
    return jsonb_build_object('ok', true);

  elsif p_op = 'scheduled_for_lead' then
    return coalesce((select jsonb_agg(jsonb_build_object('id', id, 'send_id', send_id, 'kind', kind))
      from public.ms_funnel_emails where lead_id = (a->>'lead_id')::uuid and status = 'scheduled'), '[]'::jsonb);

  elsif p_op = 'lead_by_token' then
    select * into v_lead from public.ms_catering_leads where unsub_token = a->>'token';
    if not found then return 'null'::jsonb; end if;
    return to_jsonb(v_lead) - 'ip_hash';

  elsif p_op = 'unsubscribe' then
    update public.ms_catering_leads set unsubscribed_at = coalesce(unsubscribed_at, now())
      where unsub_token = a->>'token' returning * into v_lead;
    if not found then return 'null'::jsonb; end if;
    insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'unsubscribed', coalesce(a->>'via', 'link'));
    return jsonb_build_object('id', v_lead.id);

  elsif p_op = 'list' then
    return coalesce((select jsonb_agg(to_jsonb(l) - 'ip_hash' - 'unsub_token' order by l.created_at desc)
      from (select * from public.ms_catering_leads order by created_at desc limit 500) l), '[]'::jsonb);

  elsif p_op = 'get' then
    select * into v_lead from public.ms_catering_leads where id = (a->>'id')::uuid;
    if not found then return 'null'::jsonb; end if;
    return jsonb_build_object(
      'lead', to_jsonb(v_lead) - 'ip_hash',
      'events', coalesce((select jsonb_agg(to_jsonb(e) order by e.created_at desc) from public.ms_lead_events e where e.lead_id = v_lead.id), '[]'::jsonb),
      'emails', coalesce((select jsonb_agg(to_jsonb(m) order by m.created_at) from public.ms_funnel_emails m where m.lead_id = v_lead.id), '[]'::jsonb));

  elsif p_op = 'set_stage' then
    if a->>'stage' not in ('inquiry','proposal_sent','tasting','booked','lost') then return jsonb_build_object('error', 'stage'); end if;
    update public.ms_catering_leads set stage = a->>'stage', stage_changed_at = now(),
      lost_reason = case when a->>'stage' = 'lost' then nullif(a->>'lost_reason', '') else null end
      where id = (a->>'id')::uuid and stage is distinct from a->>'stage' returning * into v_lead;
    if found then
      insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'stage', 'Moved to ' || v_lead.stage);
    end if;
    return jsonb_build_object('ok', true);

  elsif p_op = 'mark_replied' then
    update public.ms_catering_leads set replied_at = coalesce(replied_at, now()) where id = (a->>'id')::uuid returning * into v_lead;
    if found then insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'replied', 'Marked as replied'); end if;
    return jsonb_build_object('ok', found);

  elsif p_op = 'set_quote' then
    update public.ms_catering_leads set
      quote_amount_cents = nullif(a->>'quote_amount_cents', '')::int,
      quote_note = nullif(a->>'quote_note', ''),
      deposit_url = nullif(a->>'deposit_url', '')
      where id = (a->>'id')::uuid returning * into v_lead;
    if found then insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'quote', 'Quote details saved'); end if;
    return jsonb_build_object('ok', found);

  elsif p_op = 'quote_sent' then
    update public.ms_catering_leads set quote_sent_at = now(),
      stage = case when stage = 'inquiry' then 'proposal_sent' else stage end,
      stage_changed_at = case when stage = 'inquiry' then now() else stage_changed_at end
      where id = (a->>'id')::uuid returning * into v_lead;
    if found then insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'quote_sent', 'Quote emailed'); end if;
    return jsonb_build_object('ok', found);

  elsif p_op = 'deposit_paid' then
    update public.ms_catering_leads set deposit_paid_at = coalesce(deposit_paid_at, now()) where id = (a->>'id')::uuid returning * into v_lead;
    if found then insert into public.ms_lead_events (lead_id, kind, body) values (v_lead.id, 'deposit_paid', 'Deposit marked paid'); end if;
    return jsonb_build_object('ok', found);

  elsif p_op = 'weekly' then
    v_from := (a->>'from')::timestamptz;
    v_to := (a->>'to')::timestamptz;
    select jsonb_build_object(
      'visits', (select count(*) from public.ms_site_visits where at >= v_from and at < v_to),
      'visits_by_source', coalesce((select jsonb_object_agg(source, n) from (select source, count(*) n from public.ms_site_visits where at >= v_from and at < v_to group by source) s), '{}'::jsonb),
      'leads', (select count(*) from public.ms_catering_leads where created_at >= v_from and created_at < v_to and not (is_test and coalesce((a->>'exclude_test')::boolean, false))),
      'leads_by_source', coalesce((select jsonb_object_agg(source, n) from (select source, count(*) n from public.ms_catering_leads where created_at >= v_from and created_at < v_to and not (is_test and coalesce((a->>'exclude_test')::boolean, false)) group by source) s), '{}'::jsonb),
      'quoted', (select count(*) from public.ms_catering_leads where quote_sent_at >= v_from and quote_sent_at < v_to),
      'booked', (select count(*) from public.ms_catering_leads where stage = 'booked' and stage_changed_at >= v_from and stage_changed_at < v_to),
      'booked_cents', (select coalesce(sum(quote_amount_cents), 0) from public.ms_catering_leads where stage = 'booked' and stage_changed_at >= v_from and stage_changed_at < v_to),
      'lost', (select count(*) from public.ms_catering_leads where stage = 'lost' and stage_changed_at >= v_from and stage_changed_at < v_to),
      'open_pipeline', (select count(*) from public.ms_catering_leads where stage in ('inquiry','proposal_sent','tasting')),
      'median_reply_minutes', (select round(extract(epoch from percentile_cont(0.5) within group (order by replied_at - created_at)) / 60)
        from public.ms_catering_leads where created_at >= v_from and created_at < v_to and replied_at is not null)
    ) into v_res;
    return v_res;
  end if;

  raise exception 'unknown op' using errcode = '22023';
end $$;

revoke all on function public.ms_funnel(text, text, jsonb) from public;
grant execute on function public.ms_funnel(text, text, jsonb) to anon, authenticated, service_role;

comment on function public.ms_funnel(text, text, jsonb) is 'Momma Sally''s catering funnel: keyed server-only entry point (key hash in ms_funnel_config).';
