-- YAKINI BUILDER · Founding offer (Clarence, 2026-11-26): the first 20 businesses pay the setup fee
-- today and no monthly charge until the offer's end date (2027-01-31); monthly billing starts the
-- day after. Repo only: Clarence applies it. One spot per business, counted in one locked
-- transaction so the 21st business can never get it.

-- ---------------------------------------------------------------- audit actions
alter table builder.audit_log drop constraint audit_log_action_check;
alter table builder.audit_log add constraint audit_log_action_check check (action in (
  'publish','rollback','domain.add','domain.remove','brand.colors.change','override.publish','handoff.start',
  'member.invite','delete.soft','restore','review.approve','review.reject','takedown','takedown.auto_hold',
  'takedown.lift','report.dismiss','report.actioned','share.create','share.revoke','export.create',
  'export.download','forms.csv','today.post','today.clear','fleet.release','fleet.stage','fleet.halt',
  'fleet.rollback','runtime_link.create','runtime_link.rotate','schema.check',
  'unpublish','report.create',
  'billing.change','billing.lapse','billing.plans','indexing.change',
  'billing.promo','billing.promo_claim'));

-- ---------------------------------------------------------------- the offer (service role only)
create table builder.billing_promos (
  id text primary key check (id ~ '^[a-z0-9-]{2,40}$'),
  label text not null check (char_length(label) between 1 and 80),
  active boolean not null default false,
  max_claims int not null check (max_claims between 0 and 10000),
  free_until date not null,
  updated_at timestamptz not null default now()
);
alter table builder.billing_promos enable row level security;
revoke all on builder.billing_promos from anon, authenticated;

create table builder.promo_claims (
  promo_id text not null references builder.billing_promos(id) on delete cascade,
  tenant_id uuid not null references builder.tenants(id) on delete cascade,
  subscription_id text,
  claimed_at timestamptz not null default now(),
  released_at timestamptz,
  primary key (promo_id, tenant_id)
);
alter table builder.promo_claims enable row level security;
revoke all on builder.promo_claims from anon, authenticated;

alter table builder.subscriptions add column promo_id text references builder.billing_promos(id);

insert into builder.billing_promos (id, label, active, max_claims, free_until)
values ('founders', 'Founding 20', true, 20, date '2027-01-31')
on conflict (id) do nothing;

-- ---------------------------------------------------------------- claim a spot
-- At "Continue to PayPal". Returns true when this business holds a spot (new or already its own).
-- A spot that never becomes a paid plan is released by release_stale_promo_claims after a day.
create or replace function builder.claim_promo(p_promo text, p_tenant uuid)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare p record; v_used int;
begin
  select * into p from builder.billing_promos where id = p_promo for update;
  if not found or not p.active or current_date > p.free_until then return false; end if;
  if exists (select 1 from builder.promo_claims where promo_id = p_promo and tenant_id = p_tenant and released_at is null) then return true; end if;
  select count(*) into v_used from builder.promo_claims where promo_id = p_promo and released_at is null;
  if v_used >= p.max_claims then return false; end if;
  insert into builder.promo_claims (promo_id, tenant_id) values (p_promo, p_tenant)
  on conflict (promo_id, tenant_id) do update set released_at = null, claimed_at = now(), subscription_id = null;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (p_tenant, null, 'system', 'billing.promo_claim', p_promo, jsonb_build_object('used', v_used + 1, 'max', p.max_claims));
  return true;
end $$;

-- Link a claimed spot to the subscription started with it (after the pending subscription exists).
create or replace function builder.attach_promo(p_promo text, p_tenant uuid, p_sub_id text)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
begin
  update builder.subscriptions set promo_id = p_promo where tenant_id = p_tenant and provider = 'paypal' and provider_subscription_id = p_sub_id;
  if not found then return false; end if;
  update builder.promo_claims set subscription_id = p_sub_id where promo_id = p_promo and tenant_id = p_tenant and released_at is null;
  return found;
end $$;

-- Spots held for a day without a paid plan go back to the pool.
create or replace function builder.release_stale_promo_claims()
returns int
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare n int;
begin
  update builder.promo_claims c set released_at = now()
   where c.released_at is null and c.claimed_at < now() - interval '1 day'
     and not exists (select 1 from builder.subscriptions s where s.tenant_id = c.tenant_id and s.promo_id = c.promo_id
                       and s.status in ('active','past_due','canceled'));
  get diagnostics n = row_count;
  return n;
end $$;

-- ---------------------------------------------------------------- operator settings
create or replace function builder.set_promo(p_promo text, p_active boolean, p_max int, p_free_until date, p_user uuid)
returns void
language plpgsql security definer set search_path = pg_catalog, builder as $$
begin
  update builder.billing_promos set active = p_active, max_claims = p_max, free_until = p_free_until, updated_at = now() where id = p_promo;
  if not found then raise exception 'promo_not_found' using errcode = 'P0002'; end if;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (null, p_user, 'operator', 'billing.promo', p_promo, jsonb_build_object('active', p_active, 'max', p_max, 'free_until', p_free_until));
end $$;

-- ---------------------------------------------------------------- grants: server only
do $$
declare f text;
begin
  foreach f in array array[
    'builder.claim_promo(text, uuid)',
    'builder.attach_promo(text, uuid, text)',
    'builder.release_stale_promo_claims()',
    'builder.set_promo(text, boolean, int, date, uuid)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
grant select, insert, update on builder.billing_promos, builder.promo_claims to service_role;
