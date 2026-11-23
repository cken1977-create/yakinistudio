-- Yakini Builder, Phase 0 (spec v1.1 Section 9.2): core tables.
-- All tables live in schema `builder`. Tenant-owned tables carry tenant_id NOT NULL.
-- RLS is enabled in 20261123000400; nothing here is reachable by clients until then.

create schema if not exists builder;
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------- tenants
create table builder.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  kit_id text not null check (kit_id ~ '^[a-z0-9-]{2,40}$'),
  status text not null default 'prospect' check (status in ('prospect','trial','active','past_due','canceled')),
  hosting_mode text not null default 'yakini' check (hosting_mode in ('yakini','client_account')),
  portal_room_id uuid,
  agreement_signed_at timestamptz,
  ownership_attested_at timestamptz,
  ownership_attested_ip_hash text check (ownership_attested_ip_hash is null or ownership_attested_ip_hash ~ '^[0-9a-f]{64}$'),
  stripe_customer_id text,
  timezone text check (timezone is null or char_length(timezone) between 3 and 64),
  first_live_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  -- R12: client-account hosting needs a signed agreement first.
  constraint tenants_client_account_signed check (hosting_mode <> 'client_account' or agreement_signed_at is not null)
);

-- ---------------------------------------------------------------- operators (Yakini staff)
create table builder.operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  can_override_publish boolean not null default false,
  can_takedown boolean not null default false,
  can_rollout_fleet boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- memberships
create table builder.memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','editor')),
  invited_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, user_id)
);
create index memberships_user_idx on builder.memberships (user_id) where deleted_at is null;

-- ---------------------------------------------------------------- sites
create table builder.sites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{2,39}$'),
  kit_id text not null check (kit_id ~ '^[a-z0-9-]{2,40}$'),
  draft_doc jsonb not null check (octet_length(draft_doc::text) <= 204800),
  draft_rev int not null default 0 check (draft_rev >= 0),
  published_version_id uuid, -- FK added after site_versions exists
  indexable boolean not null default false,
  draft_token_hash text check (draft_token_hash is null or draft_token_hash ~ '^[0-9a-f]{64}$'),
  draft_expires_at timestamptz,
  source_url text check (source_url is null or char_length(source_url) <= 2048),
  review_status text not null default 'not_required' check (review_status in ('not_required','pending','approved','rejected')),
  takedown_at timestamptz,
  takedown_kind text check (takedown_kind is null or takedown_kind in ('operator','auto_hold')),
  takedown_reason text check (takedown_reason is null or takedown_reason in ('impersonation','phishing','copyright','illegal','other')),
  report_link_hidden boolean not null default false,
  today_editors_allowed boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint sites_takedown_complete check ((takedown_at is null) = (takedown_kind is null))
);
create index sites_tenant_idx on builder.sites (tenant_id);

-- ---------------------------------------------------------------- site_versions (immutable)
create table builder.site_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  number int not null check (number >= 1),
  kind text not null check (kind in ('checkpoint','published','review')),
  doc jsonb not null check (octet_length(doc::text) <= 204800),
  doc_sha256 text not null check (doc_sha256 ~ '^[0-9a-f]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now(),
  unique (site_id, number)
);
alter table builder.sites
  add constraint sites_published_version_fk foreign key (published_version_id) references builder.site_versions(id) on delete restrict;

-- ---------------------------------------------------------------- site_edits (audit trail of every change)
create table builder.site_edits (
  id bigint generated always as identity primary key,
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_kind text not null check (actor_kind in ('owner','editor','operator','ai','anonymous')),
  source text not null check (source in ('click','chat','system')),
  ops jsonb not null,
  draft_rev_after int not null,
  created_at timestamptz not null default now()
);
create index site_edits_site_idx on builder.site_edits (site_id, created_at desc);

-- ---------------------------------------------------------------- assets (+ image licensing, v1.1 addition)
create table builder.assets (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid references builder.sites(id) on delete set null,
  kind text not null check (kind in ('logo','image','og')),
  storage_path text not null check (storage_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.[a-z0-9]{2,5}$'),
  mime text not null check (mime in ('image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/gif')),
  width int check (width is null or width between 1 and 8000),
  height int check (height is null or height between 1 and 8000),
  bytes int check (bytes is null or bytes between 1 and 10485760),
  alt text check (alt is null or char_length(alt) <= 160),
  source text not null check (source in ('upload','scraped','kit-sample')),
  source_url text check (source_url is null or char_length(source_url) <= 2048),
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  -- Image licensing tracking (v1.1): who may use this image and whether it may ship in an export.
  license_kind text not null default 'unknown' check (license_kind in ('owner_upload','owner_site','kit_licensed','public_domain','unknown')),
  license_note text check (license_note is null or char_length(license_note) <= 300),
  redistributable boolean not null default false,
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint assets_path_tenant check (split_part(storage_path, '/', 1) = tenant_id::text)
);
create index assets_tenant_idx on builder.assets (tenant_id);

-- ---------------------------------------------------------------- domains
create table builder.domains (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  hostname text not null unique check (hostname = lower(hostname) and hostname ~ '^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z][a-z0-9-]{1,62}$' and char_length(hostname) <= 253),
  kind text not null check (kind in ('subdomain','custom')),
  is_primary boolean not null default false,
  status text not null default 'pending' check (status in ('pending','verifying','active','misconfigured','error','removed')),
  vercel_project_id text,
  verification jsonb,
  last_checked_at timestamptz,
  verified_at timestamptz,
  check_attempts int not null default 0,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index domains_one_primary on builder.domains (site_id) where is_primary and deleted_at is null;

-- ---------------------------------------------------------------- forms + submissions
create table builder.forms (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  form_key text not null check (form_key ~ '^[a-z0-9-]{1,40}$'),
  kind text not null check (kind in ('contact','catering','booking_request')),
  fields jsonb not null,
  notify_emails text[] not null default '{}' check (cardinality(notify_emails) <= 5),
  portal_target text not null default 'contact' check (portal_target in ('contact','room_request')),
  created_at timestamptz not null default now(),
  unique (site_id, form_key)
);

create table builder.form_submissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  form_id uuid not null references builder.forms(id) on delete cascade,
  payload jsonb not null check (octet_length(payload::text) <= 16384),
  visitor_ip_hash text check (visitor_ip_hash is null or visitor_ip_hash ~ '^[0-9a-f]{64}$'),
  user_agent_hash text check (user_agent_hash is null or user_agent_hash ~ '^[0-9a-f]{64}$'),
  spam_score int not null default 0,
  status text not null default 'received' check (status in ('received','forwarded','forward_failed','spam')),
  portal_contact_id uuid,
  forward_attempts int not null default 0,
  created_at timestamptz not null default now()
);
create index form_submissions_site_idx on builder.form_submissions (site_id, created_at desc);

-- ---------------------------------------------------------------- ai_runs (no prompt bodies stored)
create table builder.ai_runs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references builder.tenants(id) on delete set null,
  site_id uuid references builder.sites(id) on delete set null,
  kind text not null check (kind in ('generate','edit','helper')),
  model text not null,
  prompt_version text not null,
  input_tokens int not null default 0 check (input_tokens >= 0),
  output_tokens int not null default 0 check (output_tokens >= 0),
  latency_ms int,
  outcome text not null check (outcome in ('ok','invalid','fallback','timeout','error','blocked')),
  tool_calls int not null default 0,
  created_at timestamptz not null default now()
);
create index ai_runs_created_idx on builder.ai_runs (created_at);

-- ---------------------------------------------------------------- chat_messages
create table builder.chat_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) <= 2000),
  proposal jsonb,
  applied boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- billing
create table builder.subscriptions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  stripe_subscription_id text not null unique,
  stripe_price_ids text[] not null default '{}',
  product_key text not null check (product_key ~ '^(website-simple|kit:[a-z0-9-]+:(small|growing|larger))$'),
  status text not null,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create table builder.stripe_events (
  id text primary key,
  type text not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  error text
);

-- ---------------------------------------------------------------- rate limits
create table builder.rate_limits (
  key text not null check (char_length(key) <= 200),
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

-- ---------------------------------------------------------------- audit_log
create table builder.audit_log (
  id bigint generated always as identity primary key,
  tenant_id uuid references builder.tenants(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_kind text not null check (actor_kind in ('owner','editor','operator','system','anonymous')),
  action text not null check (action in (
    'publish','rollback','domain.add','domain.remove','brand.colors.change','override.publish','handoff.start',
    'member.invite','delete.soft','restore','review.approve','review.reject','takedown','takedown.auto_hold',
    'takedown.lift','report.dismiss','report.actioned','share.create','share.revoke','export.create',
    'export.download','forms.csv','today.post','today.clear','fleet.release','fleet.stage','fleet.halt',
    'fleet.rollback','runtime_link.create','runtime_link.rotate','schema.check')),
  target_id text,
  details jsonb not null default '{}'::jsonb check (octet_length(details::text) <= 8192),
  created_at timestamptz not null default now()
);
create index audit_log_tenant_idx on builder.audit_log (tenant_id, created_at desc);

-- ---------------------------------------------------------------- tutorial_progress (R13)
create table builder.tutorial_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  step text not null check (step ~ '^[a-z0-9-]{1,40}$'),
  done_at timestamptz not null default now(),
  primary key (user_id, site_id, step)
);
