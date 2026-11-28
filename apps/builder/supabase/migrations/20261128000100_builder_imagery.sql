-- YAKINI BUILDER · Design D4: the imagery engine (generated and library images).
-- Additive only. Clarence runs this SQL; the Builder never applies migrations to the live database.
--
-- 1. assets: generated images (source 'generated', licence 'generated'), the automatic check's score
--    and reasons, focus point, inline placeholder, the AVIF/WebP variants, and licence fields that
--    record provider, model, prompt and date.
-- 2. ai_runs: image and image-check runs with their dollar cost, and ai_image_usd_today() for the
--    images' own daily cap (inside the overall AI cap).
-- 3. kit_library_images: the AI-made kit library (made by hand with scripts/generate-kit-library.ts,
--    files in the site-assets bucket under kit-library/). Server-only; no client can read or write it.

-- ---------------------------------------------------------------- 1. assets
alter table builder.assets drop constraint if exists assets_source_check;
alter table builder.assets add constraint assets_source_check check (source in ('upload','scraped','kit-sample','generated'));
alter table builder.assets drop constraint if exists assets_license_kind_check;
alter table builder.assets add constraint assets_license_kind_check
  check (license_kind in ('owner_upload','owner_site','kit_licensed','public_domain','unknown','generated'));

alter table builder.assets
  add column if not exists quality_score numeric(4,3) check (quality_score is null or (quality_score >= 0 and quality_score <= 1)),
  add column if not exists quality_reasons text[] not null default '{}' check (cardinality(quality_reasons) <= 20),
  add column if not exists focus_x real check (focus_x is null or (focus_x >= 0 and focus_x <= 1)),
  add column if not exists focus_y real check (focus_y is null or (focus_y >= 0 and focus_y <= 1)),
  add column if not exists lqip text check (lqip is null or (char_length(lqip) <= 2048 and lqip like 'data:image/webp;base64,%')),
  -- [{ "format": "avif"|"webp", "width": int, "height": int, "crop": "full"|"tall", "path": "<tenant>/<asset>/<crop>-<width>.<format>" }]
  add column if not exists variants jsonb not null default '[]' check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) <= 64),
  add column if not exists dhash text check (dhash is null or dhash ~ '^[0-9a-f]{16}$'),
  add column if not exists license_provider text check (license_provider is null or char_length(license_provider) <= 40),
  add column if not exists license_model text check (license_model is null or char_length(license_model) <= 80),
  add column if not exists license_prompt text check (license_prompt is null or char_length(license_prompt) <= 2000),
  add column if not exists license_created_at timestamptz;

-- A generated image always says where it came from.
alter table builder.assets drop constraint if exists assets_generated_license;
alter table builder.assets add constraint assets_generated_license check (
  source <> 'generated' or (license_kind = 'generated' and license_provider is not null and license_model is not null and license_prompt is not null and license_created_at is not null)
);

-- ---------------------------------------------------------------- 2. ai_runs (image spend)
alter table builder.ai_runs drop constraint if exists ai_runs_kind_check;
alter table builder.ai_runs add constraint ai_runs_kind_check check (kind in ('generate','edit','helper','image','image_check'));
alter table builder.ai_runs add column if not exists usd numeric(10,4) not null default 0 check (usd >= 0);

create or replace function builder.ai_image_usd_today()
returns numeric
language sql stable security definer set search_path = pg_catalog, builder as $$
  select coalesce(sum(r.usd), 0)::numeric
  from builder.ai_runs r
  where r.kind in ('image','image_check')
    and r.created_at >= date_trunc('day', now() at time zone 'UTC') at time zone 'UTC'
$$;
revoke all on function builder.ai_image_usd_today() from public, anon, authenticated;
grant execute on function builder.ai_image_usd_today() to service_role;

-- ---------------------------------------------------------------- 3. kit library
create table if not exists builder.kit_library_images (
  id uuid primary key default gen_random_uuid(),
  kit_id text not null check (kit_id ~ '^[a-z0-9-]{2,40}$'),
  slot text not null check (slot ~ '^(hero-wide|hero-tall|feature-[1-3]|gallery-[1-6]|scene-[0-9]{1,2})$'),
  storage_path text not null check (storage_path ~ '^kit-library/[a-z0-9-]{2,40}/[0-9a-f-]{36}\.webp$'),
  width int not null check (width between 1 and 8000),
  height int not null check (height between 1 and 8000),
  alt text not null check (char_length(alt) between 1 and 160),
  lqip text check (lqip is null or (char_length(lqip) <= 2048 and lqip like 'data:image/webp;base64,%')),
  focus_x real check (focus_x is null or (focus_x >= 0 and focus_x <= 1)),
  focus_y real check (focus_y is null or (focus_y >= 0 and focus_y <= 1)),
  variants jsonb not null default '[]' check (jsonb_typeof(variants) = 'array' and jsonb_array_length(variants) <= 64),
  dhash text check (dhash is null or dhash ~ '^[0-9a-f]{16}$'),
  quality_score numeric(4,3) not null check (quality_score >= 0 and quality_score <= 1),
  license_provider text not null check (char_length(license_provider) <= 40),
  license_model text not null check (char_length(license_model) <= 80),
  license_prompt text not null check (char_length(license_prompt) <= 2000),
  license_created_at timestamptz not null,
  created_at timestamptz not null default now(),
  retired_at timestamptz
);
create index if not exists kit_library_images_kit_idx on builder.kit_library_images (kit_id) where retired_at is null;
alter table builder.kit_library_images enable row level security;
-- No policies: only the server (service role) reads or writes the library.
revoke all on table builder.kit_library_images from public, anon, authenticated;
grant select, insert, update on table builder.kit_library_images to service_role;
