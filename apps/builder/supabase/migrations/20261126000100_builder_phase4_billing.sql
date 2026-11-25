-- YAKINI BUILDER · Phase 4: billing with PayPal (docs/spec/phase-4.md).
-- Repo only: Clarence applies it. Renames the empty Stripe-named columns to provider-neutral names,
-- adds the plan table and the server-only billing functions. Every change is one transaction with
-- its own audit row.

-- ---------------------------------------------------------------- audit actions
alter table builder.audit_log drop constraint audit_log_action_check;
alter table builder.audit_log add constraint audit_log_action_check check (action in (
  'publish','rollback','domain.add','domain.remove','brand.colors.change','override.publish','handoff.start',
  'member.invite','delete.soft','restore','review.approve','review.reject','takedown','takedown.auto_hold',
  'takedown.lift','report.dismiss','report.actioned','share.create','share.revoke','export.create',
  'export.download','forms.csv','today.post','today.clear','fleet.release','fleet.stage','fleet.halt',
  'fleet.rollback','runtime_link.create','runtime_link.rotate','schema.check',
  'unpublish','report.create',
  'billing.change','billing.lapse','billing.plans','indexing.change'));

-- ---------------------------------------------------------------- provider-neutral names
alter table builder.tenants rename column stripe_customer_id to billing_customer_id;
alter table builder.subscriptions rename column stripe_subscription_id to provider_subscription_id;
alter table builder.subscriptions rename column stripe_price_ids to provider_plan_ids;
alter table builder.subscriptions add column provider text not null default 'paypal' check (provider in ('paypal'));
alter table builder.subscriptions add column paid_through timestamptz;
alter table builder.subscriptions add column past_due_since timestamptz;
alter table builder.subscriptions add constraint subscriptions_status_check
  check (status in ('pending','active','past_due','canceled'));
alter table builder.stripe_events rename to billing_events;
alter table builder.billing_events add column provider text not null default 'paypal' check (provider in ('paypal'));

-- ---------------------------------------------------------------- plans (service role only)
create table builder.billing_plans (
  id uuid primary key default gen_random_uuid(),
  product_key text not null check (product_key ~ '^(website-simple|kit:[a-z0-9-]+:(small|growing|larger))$'),
  provider text not null default 'paypal' check (provider in ('paypal')),
  provider_product_id text not null check (char_length(provider_product_id) between 1 and 100),
  provider_plan_id text not null unique check (char_length(provider_plan_id) between 1 and 100),
  setup_amount numeric(10,2) not null check (setup_amount >= 0),
  monthly_amount numeric(10,2) not null check (monthly_amount > 0),
  currency text not null default 'USD' check (currency ~ '^[A-Z]{3}$'),
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index billing_plans_one_active on builder.billing_plans (provider, product_key) where active;
alter table builder.billing_plans enable row level security;
revoke all on builder.billing_plans from anon, authenticated;

-- ---------------------------------------------------------------- plan check
-- A plan counts while a subscription is active or past_due, or while the tenant is marked active
-- or past_due (an operator can do that by hand). A cancelled subscription keeps the tenant active
-- until its paid period ends; lapse_due_sites then marks the tenant canceled.
create or replace function builder.tenant_has_plan(p_tenant uuid) returns boolean
language sql stable security definer set search_path = pg_catalog, builder as $$
  select exists (select 1 from builder.tenants t where t.id = p_tenant and t.status in ('active','past_due'))
      or exists (select 1 from builder.subscriptions s where s.tenant_id = p_tenant and s.status in ('active','past_due'))
$$;

-- ---------------------------------------------------------------- save a plan made in PayPal
create or replace function builder.save_billing_plan(p_product_key text, p_product_id text, p_plan_id text,
  p_setup numeric, p_monthly numeric, p_currency text, p_user uuid)
returns uuid
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare v_id uuid;
begin
  update builder.billing_plans set active = false where provider = 'paypal' and product_key = p_product_key and active;
  insert into builder.billing_plans (product_key, provider_product_id, provider_plan_id, setup_amount, monthly_amount, currency)
  values (p_product_key, p_product_id, p_plan_id, p_setup, p_monthly, p_currency) returning id into v_id;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (null, p_user, 'operator', 'billing.plans', p_product_key,
          jsonb_build_object('plan', p_plan_id, 'setup', p_setup, 'monthly', p_monthly));
  return v_id;
end $$;

-- ---------------------------------------------------------------- record a subscription change
-- Called for the return from PayPal (p_event_id null) and for each verified webhook event.
-- Returns 'recorded', 'duplicate' (event already seen) or 'conflict' (the subscription belongs to
-- another tenant). The tenant's status follows its subscriptions.
create or replace function builder.record_subscription(p_tenant uuid, p_sub_id text, p_plan_id text, p_product_key text,
  p_status text, p_paid_through timestamptz, p_customer_id text, p_event_id text, p_event_type text)
returns text
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare
  v_owner uuid; v_old record; v_tenant_status text; v_new_status text;
begin
  if p_status not in ('pending','active','past_due','canceled') then raise exception 'bad status'; end if;
  if p_event_id is not null then
    insert into builder.billing_events (id, type, provider) values (p_event_id, left(coalesce(p_event_type, 'unknown'), 100), 'paypal')
    on conflict (id) do nothing;
    if not found then return 'duplicate'; end if;
  end if;

  select status into v_tenant_status from builder.tenants where id = p_tenant for update;
  if not found then
    if p_event_id is not null then update builder.billing_events set error = 'unknown tenant', processed_at = now() where id = p_event_id; end if;
    return 'conflict';
  end if;

  select * into v_old from builder.subscriptions where provider = 'paypal' and provider_subscription_id = p_sub_id for update;
  if found and v_old.tenant_id <> p_tenant then
    if p_event_id is not null then update builder.billing_events set error = 'tenant mismatch', processed_at = now() where id = p_event_id; end if;
    return 'conflict';
  end if;

  if found then
    update builder.subscriptions set
      status = p_status,
      provider_plan_ids = case when p_plan_id is null then provider_plan_ids else array[p_plan_id] end,
      product_key = coalesce(p_product_key, product_key),
      paid_through = greatest(paid_through, p_paid_through),
      current_period_end = greatest(paid_through, p_paid_through),
      cancel_at_period_end = (p_status = 'canceled'),
      past_due_since = case when p_status = 'past_due' then coalesce(past_due_since, now()) else null end,
      updated_at = now()
    where id = v_old.id;
  else
    if p_product_key is null then raise exception 'product_key required for a new subscription'; end if;
    insert into builder.subscriptions (tenant_id, provider, provider_subscription_id, provider_plan_ids, product_key, status,
                                       paid_through, current_period_end, cancel_at_period_end, past_due_since)
    values (p_tenant, 'paypal', p_sub_id, case when p_plan_id is null then '{}' else array[p_plan_id] end, p_product_key, p_status,
            p_paid_through, p_paid_through, p_status = 'canceled', case when p_status = 'past_due' then now() end);
  end if;

  -- The tenant follows its best subscription. A cancelled one keeps the tenant as it is until
  -- lapse_due_sites runs after the paid period.
  v_new_status := case
    when exists (select 1 from builder.subscriptions where tenant_id = p_tenant and status = 'active') then 'active'
    when exists (select 1 from builder.subscriptions where tenant_id = p_tenant and status = 'past_due') then 'past_due'
    else v_tenant_status end;
  update builder.tenants set status = v_new_status, updated_at = now(),
         billing_customer_id = coalesce(p_customer_id, billing_customer_id)
   where id = p_tenant;

  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (p_tenant, null, 'system', 'billing.change', p_sub_id,
          jsonb_build_object('status', p_status, 'product', p_product_key, 'event', p_event_type, 'tenant_status', v_new_status));
  if p_event_id is not null then update builder.billing_events set processed_at = now() where id = p_event_id; end if;
  return 'recorded';
end $$;

-- ---------------------------------------------------------------- search engines switch
create or replace function builder.set_site_indexable(p_site uuid, p_user uuid, p_on boolean)
returns boolean
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare s record;
begin
  select * into s from builder.sites where id = p_site for update;
  if not found or s.deleted_at is not null then raise exception 'site_not_found' using errcode = 'P0002'; end if;
  if p_on and not builder.tenant_has_plan(s.tenant_id) then raise exception 'no_plan' using errcode = 'P0001'; end if;
  if s.indexable = p_on then return false; end if;
  update builder.sites set indexable = p_on where id = p_site;
  insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
  values (s.tenant_id, p_user, 'owner', 'indexing.change', p_site::text, jsonb_build_object('on', p_on));
  return true;
end $$;

-- ---------------------------------------------------------------- lapsed plans (nightly cleanup)
-- A tenant lapses when it has no active subscription and either a past_due one older than the
-- grace period, or only cancelled ones whose paid period is over. Tenants marked active by hand
-- (no subscriptions at all) never lapse here. Its live sites go offline; nothing is deleted.
create or replace function builder.lapse_due_sites(p_grace_days int)
returns table (tenant_id uuid, site_id uuid)
language plpgsql security definer set search_path = pg_catalog, builder as $$
declare t record; s record;
begin
  for t in
    select tn.id from builder.tenants tn
     where tn.status in ('active','past_due')
       and exists (select 1 from builder.subscriptions x where x.tenant_id = tn.id)
       and not exists (select 1 from builder.subscriptions x where x.tenant_id = tn.id and x.status = 'active')
       and (
         exists (select 1 from builder.subscriptions x where x.tenant_id = tn.id and x.status = 'past_due'
                   and x.past_due_since < now() - make_interval(days => greatest(p_grace_days, 0)))
         or (not exists (select 1 from builder.subscriptions x where x.tenant_id = tn.id and x.status = 'past_due')
             and coalesce((select max(x.paid_through) from builder.subscriptions x where x.tenant_id = tn.id), '-infinity') < now())
       )
     for update of tn
  loop
    update builder.tenants set status = 'canceled', updated_at = now() where id = t.id;
    update builder.sites set indexable = false where builder.sites.tenant_id = t.id;
    for s in select id from builder.sites where builder.sites.tenant_id = t.id and published_version_id is not null and deleted_at is null loop
      update builder.sites set published_version_id = null where id = s.id;
      insert into builder.audit_log (tenant_id, actor_user_id, actor_kind, action, target_id, details)
      values (t.id, null, 'system', 'billing.lapse', s.id::text, '{}'::jsonb);
      tenant_id := t.id; site_id := s.id; return next;
    end loop;
  end loop;
end $$;

-- ---------------------------------------------------------------- grants: server only
do $$
declare f text;
begin
  foreach f in array array[
    'builder.tenant_has_plan(uuid)',
    'builder.save_billing_plan(text, text, text, numeric, numeric, text, uuid)',
    'builder.record_subscription(uuid, text, text, text, text, timestamptz, text, text, text)',
    'builder.set_site_indexable(uuid, uuid, boolean)',
    'builder.lapse_due_sites(int)'
  ] loop
    execute format('revoke all on function %s from public, anon, authenticated', f);
    execute format('grant execute on function %s to service_role', f);
  end loop;
end $$;
grant select, insert, update on builder.billing_plans to service_role;
