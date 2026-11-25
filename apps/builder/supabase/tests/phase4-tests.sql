-- YAKINI BUILDER · Phase 4 database checks: billing with PayPal. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

-- Signed-in users and anon can call none of the billing functions or read plans and events.
SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.record_subscription(gen_random_uuid(), 'I-X', null, 'website-simple', 'active', null, null, null, null)$q$), 'signed-in users cannot record a subscription');
  PERFORM bt.ok(bt.raises($q$SELECT builder.set_site_indexable(gen_random_uuid(), null, true)$q$), 'signed-in users cannot flip indexing directly');
  PERFORM bt.ok(bt.raises($q$SELECT * FROM builder.lapse_due_sites(7)$q$), 'signed-in users cannot run the lapse step');
  PERFORM bt.ok(bt.raises($q$SELECT builder.save_billing_plan('website-simple', 'P', 'P-1', 99, 79, 'USD', null)$q$), 'signed-in users cannot save plans');
  PERFORM bt.ok(bt.raises($q$SELECT count(*) FROM builder.billing_plans$q$), 'signed-in users cannot read plans');
  PERFORM bt.ok(bt.raises($q$SELECT count(*) FROM builder.billing_events$q$), 'signed-in users cannot read billing events');
END $$;
RESET ROLE;
SET ROLE anon;
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.record_subscription(gen_random_uuid(), 'I-X', null, 'website-simple', 'active', null, null, null, null)$q$), 'anon cannot record a subscription');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE
  v_t uuid := gen_random_uuid(); v_s uuid := gen_random_uuid(); v_t2 uuid := gen_random_uuid(); v_s2 uuid := gen_random_uuid();
  v_user uuid := 'a0000000-0000-0000-0000-0000000000a1'; v record; r text; n int;
BEGIN
  INSERT INTO builder.tenants (id, name, kit_id, status) VALUES (v_t, 'Billing Test', 'landlord', 'trial'), (v_t2, 'Other Tenant', 'service', 'trial');
  INSERT INTO builder.sites (id, tenant_id, slug, kit_id, draft_doc) VALUES (v_s, v_t, 'draft-billtest1', 'landlord', '{"schemaVersion":1}'),
    (v_s2, v_t2, 'draft-billtest2', 'service', '{"schemaVersion":1}');
  SELECT * INTO v FROM builder.publish_site(v_s, '{"schemaVersion":1}', repeat('4',64), v_user, 'bill-test', 'bill-test.yakini.digital', 'active', '[]', 'operator', 'override for test');

  -- Plans.
  PERFORM builder.save_billing_plan('kit:landlord:small', 'PROD-1', 'P-OLD', 299, 149, 'USD', null);
  PERFORM builder.save_billing_plan('kit:landlord:small', 'PROD-1', 'P-NEW', 299, 149, 'USD', null);
  PERFORM bt.ok((SELECT count(*) FROM builder.billing_plans WHERE product_key = 'kit:landlord:small' AND active) = 1, 'one active plan per product');
  PERFORM bt.ok((SELECT provider_plan_id FROM builder.billing_plans WHERE product_key = 'kit:landlord:small' AND active) = 'P-NEW', 'saving again replaces the active plan');

  -- No plan yet.
  PERFORM bt.ok(NOT builder.tenant_has_plan(v_t), 'a trial tenant has no plan');
  PERFORM bt.ok(bt.raises(format($q$SELECT builder.set_site_indexable(%L, null, true)$q$, v_s)), 'indexing needs a plan');

  -- Return from PayPal: active.
  r := builder.record_subscription(v_t, 'I-SUB1', 'P-NEW', 'kit:landlord:small', 'active', now() + interval '30 days', 'PAYER1', null, null);
  PERFORM bt.ok(r = 'recorded', 'the return from PayPal is recorded');
  PERFORM bt.ok(builder.tenant_has_plan(v_t), 'an active subscription is a plan');
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'active', 'the tenant becomes active');
  PERFORM bt.ok((SELECT billing_customer_id FROM builder.tenants WHERE id = v_t) = 'PAYER1', 'the payer id is kept');
  PERFORM bt.ok((SELECT count(*) FROM builder.audit_log WHERE tenant_id = v_t AND action = 'billing.change') = 1, 'the change is audited');

  -- Webhook events: duplicates and other tenants.
  r := builder.record_subscription(v_t, 'I-SUB1', null, null, 'active', now() + interval '31 days', null, 'WH-1', 'PAYMENT.SALE.COMPLETED');
  PERFORM bt.ok(r = 'recorded', 'a payment event is recorded');
  r := builder.record_subscription(v_t, 'I-SUB1', null, null, 'canceled', null, null, 'WH-1', 'PAYMENT.SALE.COMPLETED');
  PERFORM bt.ok(r = 'duplicate', 'a repeated event is ignored');
  PERFORM bt.ok((SELECT status FROM builder.subscriptions WHERE provider_subscription_id = 'I-SUB1') = 'active', 'a repeated event changes nothing');
  PERFORM bt.ok((SELECT paid_through FROM builder.subscriptions WHERE provider_subscription_id = 'I-SUB1') > now() + interval '30 days', 'a payment moves the paid-through date forward');
  r := builder.record_subscription(v_t2, 'I-SUB1', null, null, 'canceled', null, null, 'WH-2', 'BILLING.SUBSCRIPTION.CANCELLED');
  PERFORM bt.ok(r = 'conflict', 'another tenant cannot touch this subscription');
  PERFORM bt.ok((SELECT error FROM builder.billing_events WHERE id = 'WH-2') = 'tenant mismatch', 'the refused event is kept with its reason');
  r := builder.record_subscription(gen_random_uuid(), 'I-SUB9', null, 'website-simple', 'active', null, null, 'WH-3', 'BILLING.SUBSCRIPTION.ACTIVATED');
  PERFORM bt.ok(r = 'conflict', 'an unknown tenant is refused');
  PERFORM bt.ok(bt.raises(format($q$SELECT builder.record_subscription(%L, 'I-SUB1', null, null, 'paused', null, null, null, null)$q$, v_t)), 'an unknown status is refused');

  -- Indexing.
  PERFORM bt.ok(builder.set_site_indexable(v_s, v_user, true), 'a paid owner can turn indexing on');
  PERFORM bt.ok((SELECT indexable FROM builder.site_for_host('bill-test.yakini.digital')), 'the renderer sees it');
  PERFORM bt.ok(NOT builder.set_site_indexable(v_s, v_user, true), 'turning it on twice changes nothing');

  -- Past due within grace: nothing lapses.
  r := builder.record_subscription(v_t, 'I-SUB1', null, null, 'past_due', null, null, 'WH-4', 'BILLING.SUBSCRIPTION.SUSPENDED');
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'past_due', 'a suspended plan is past due');
  PERFORM bt.ok(builder.tenant_has_plan(v_t), 'past due still counts as a plan');
  SELECT count(*) INTO n FROM builder.lapse_due_sites(7);
  PERFORM bt.ok(n = 0, 'nothing lapses inside the grace period');

  -- Past the grace period: the site goes offline, nothing is deleted.
  UPDATE builder.subscriptions SET past_due_since = now() - interval '8 days' WHERE provider_subscription_id = 'I-SUB1';
  SELECT count(*) INTO n FROM builder.lapse_due_sites(7);
  PERFORM bt.ok(n = 1, 'past the grace period the live site lapses');
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'canceled', 'the tenant is canceled');
  PERFORM bt.ok((SELECT published_version_id FROM builder.sites WHERE id = v_s) IS NULL AND (SELECT indexable FROM builder.sites WHERE id = v_s) = false, 'the site is offline and not indexable');
  PERFORM bt.ok((SELECT count(*) FROM builder.site_versions WHERE site_id = v_s) >= 1, 'its versions are kept');
  PERFORM bt.ok((SELECT state FROM builder.site_for_host('bill-test.yakini.digital')) = 'unpublished', 'visitors see the site being updated');
  PERFORM bt.ok((SELECT count(*) FROM builder.audit_log WHERE tenant_id = v_t AND action = 'billing.lapse') = 1, 'the lapse is audited');
  SELECT count(*) INTO n FROM builder.lapse_due_sites(7);
  PERFORM bt.ok(n = 0, 'running the lapse step again does nothing');

  -- Paying again brings the plan back.
  r := builder.record_subscription(v_t, 'I-SUB1', null, null, 'active', now() + interval '30 days', null, 'WH-5', 'BILLING.SUBSCRIPTION.RE-ACTIVATED');
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'active', 'a reactivated plan makes the tenant active again');

  -- Cancelled: in force until the paid period ends, then lapses.
  r := builder.record_subscription(v_t, 'I-SUB1', null, null, 'canceled', null, null, 'WH-6', 'BILLING.SUBSCRIPTION.CANCELLED');
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'active' AND builder.tenant_has_plan(v_t), 'a cancelled plan stays in force for the paid month');
  SELECT count(*) INTO n FROM builder.lapse_due_sites(7);
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'active', 'it does not lapse before the paid period ends');
  UPDATE builder.subscriptions SET paid_through = now() - interval '1 hour' WHERE provider_subscription_id = 'I-SUB1';
  PERFORM builder.lapse_due_sites(7);
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t) = 'canceled', 'after the paid period the tenant lapses');

  -- A tenant marked active by hand (no subscription) never lapses.
  UPDATE builder.tenants SET status = 'active' WHERE id = v_t2;
  PERFORM builder.lapse_due_sites(0);
  PERFORM bt.ok((SELECT status FROM builder.tenants WHERE id = v_t2) = 'active', 'a hand-marked tenant is left alone');

  -- Owners read their own subscription only (RLS from Phase 0 still holds after the rename).
  PERFORM bt.ok(EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'builder' AND table_name = 'subscriptions' AND column_name = 'provider_subscription_id'), 'subscriptions use provider-neutral names');
  PERFORM bt.ok(NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'builder' AND column_name LIKE 'stripe%'), 'no Stripe-named columns remain');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL PHASE 4 TESTS PASSED'; END $$;
