-- Yakini Builder, Phase 0: tables added in spec v1.1 (Section 9.2, "Added in 1.1").

create table builder.share_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  version_id uuid references builder.site_versions(id) on delete cascade, -- null = current draft
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_by uuid not null references auth.users(id) on delete cascade,
  expires_at timestamptz not null default (now() + interval '7 days'),
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now(),
  constraint share_links_max_30_days check (expires_at <= created_at + interval '30 days')
);
create index share_links_site_idx on builder.share_links (site_id) where revoked_at is null;

create table builder.abuse_reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  host text not null check (char_length(host) <= 253),
  reason text not null check (reason in ('impersonation','phishing','copyright','illegal','other')),
  details text check (details is null or char_length(details) <= 2000),
  reporter_email text check (reporter_email is null or char_length(reporter_email) <= 254),
  reporter_says_owner boolean not null default false,
  reporter_ip_hash text check (reporter_ip_hash is null or reporter_ip_hash ~ '^[0-9a-f]{64}$'),
  status text not null default 'open' check (status in ('open','dismissed','actioned')),
  handled_by uuid references auth.users(id) on delete set null,
  handled_at timestamptz,
  operator_note text check (operator_note is null or char_length(operator_note) <= 1000),
  created_at timestamptz not null default now()
);
create index abuse_reports_site_idx on builder.abuse_reports (site_id, created_at desc);

create table builder.publish_reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  version_id uuid not null references builder.site_versions(id) on delete cascade,
  trigger text not null check (trigger in ('override','risk_check')),
  risk_flags jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  decision_note text check (decision_note is null or char_length(decision_note) <= 500),
  created_at timestamptz not null default now()
);

create table builder.today_updates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  kind text not null check (kind ~ '^[a-z0-9_-]{1,40}$'),
  fields jsonb not null check (octet_length(fields::text) <= 2048),
  starts_at timestamptz not null default now(),
  expires_at timestamptz not null,
  cleared_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (expires_at > starts_at)
);
-- At most one active Today update per site.
create unique index today_updates_one_active on builder.today_updates (site_id) where cleared_at is null;

create table builder.site_visits_daily (
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  day date not null,
  page_slug text not null check (page_slug = '' or page_slug = '*' or page_slug ~ '^[a-z0-9-]{1,40}$'),
  views int not null default 0 check (views >= 0),
  visitors int check (visitors is null or visitors >= 0),
  src_direct int not null default 0,
  src_search int not null default 0,
  src_social int not null default 0,
  src_other int not null default 0,
  origin text not null default 'builder' check (origin in ('builder','runtime')),
  primary key (site_id, day, page_slug, origin)
);

create table builder.visit_hashes (
  site_id uuid not null references builder.sites(id) on delete cascade,
  day date not null,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  primary key (site_id, day, visitor_hash)
);

create table builder.visit_salts (
  day date primary key,
  salt bytea not null check (octet_length(salt) = 32)
);

create table builder.exports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  requested_by uuid references auth.users(id) on delete set null,
  includes text[] not null check (includes <@ array['site_file','images','html']::text[] and cardinality(includes) >= 1),
  status text not null default 'queued' check (status in ('queued','building','ready','failed','expired')),
  storage_path text check (storage_path is null or split_part(storage_path, '/', 1) = tenant_id::text),
  bytes bigint,
  sha256 text check (sha256 is null or sha256 ~ '^[0-9a-f]{64}$'),
  error_code text,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create table builder.runtime_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique check (version ~ '^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$'),
  git_sha text not null check (git_sha ~ '^[0-9a-f]{7,40}$'),
  min_schema int not null check (min_schema >= 1),
  max_schema int not null,
  db_level int not null default 0,
  security boolean not null default false,
  notes text check (notes is null or char_length(notes) <= 2000),
  status text not null default 'draft' check (status in ('draft','canary','rolling','complete','halted')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  check (max_schema >= min_schema)
);

create table builder.client_deployments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  site_id uuid not null references builder.sites(id) on delete cascade,
  vercel_team_id text not null,
  vercel_project_id text not null,
  runtime_version text not null,
  doc_version_id uuid references builder.site_versions(id) on delete set null,
  vercel_deployment_id text,
  previous_deployment_id text,
  rollout_release_id uuid references builder.runtime_releases(id) on delete set null,
  status text not null default 'deploying' check (status in ('deploying','healthy','unhealthy','rolled_back')),
  health jsonb,
  deployed_at timestamptz not null default now(),
  checked_at timestamptz
);
create index client_deployments_tenant_idx on builder.client_deployments (tenant_id, deployed_at desc);

create table builder.runtime_links (
  tenant_id uuid primary key references builder.tenants(id) on delete cascade,
  secret_ciphertext bytea not null, -- AES-256-GCM with RUNTIME_LINK_ENC_KEY; never returned by any route
  key_id text not null,
  created_at timestamptz not null default now(),
  rotated_at timestamptz,
  last_seen_at timestamptz
);
