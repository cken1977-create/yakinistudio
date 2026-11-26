-- YAKINI BUILDER · Founding offer database checks. FAKE data.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

SET ROLE authenticated;
SELECT bt.login('a0000000-0000-0000-0000-0000000000a1');
DO $$ BEGIN
  PERFORM bt.ok(bt.raises($q$SELECT builder.claim_promo('founders', gen_random_uuid())$q$), 'signed-in users cannot claim a spot directly');
  PERFORM bt.ok(bt.raises($q$SELECT count(*) FROM builder.billing_promos$q$), 'signed-in users cannot read the offer table');
  PERFORM bt.ok(bt.raises($q$SELECT count(*) FROM builder.promo_claims$q$), 'signed-in users cannot read who claimed');
  PERFORM bt.ok(bt.raises($q$SELECT builder.set_promo('founders', true, 999, date '2030-01-01', null)$q$), 'signed-in users cannot change the offer');
END $$;
RESET ROLE;

SET ROLE service_role;
DO $$
DECLARE t uuid[] := array[]::uuid[]; v uuid; i int; ok boolean;
BEGIN
  PERFORM bt.ok((SELECT max_claims FROM builder.billing_promos WHERE id = 'founders') = 20 AND (SELECT free_until FROM builder.billing_promos WHERE id = 'founders') = date '2027-01-31', 'the Founding 20 offer is seeded: 20 spots until 2027-01-31');
  -- Use a small test offer so the real one is untouched.
  INSERT INTO builder.billing_promos (id, label, active, max_claims, free_until) VALUES ('test-offer', 'Test', true, 3, current_date + 30);
  FOR i IN 1..4 LOOP
    v := gen_random_uuid(); t := t || v;
    INSERT INTO builder.tenants (id, name, kit_id, status) VALUES (v, 'Promo ' || i, 'service', 'trial');
  END LOOP;
  PERFORM bt.ok(builder.claim_promo('test-offer', t[1]) AND builder.claim_promo('test-offer', t[2]) AND builder.claim_promo('test-offer', t[3]), 'the first three businesses get a spot');
  PERFORM bt.ok(NOT builder.claim_promo('test-offer', t[4]), 'the fourth does not');
  PERFORM bt.ok(builder.claim_promo('test-offer', t[1]), 'claiming again keeps your own spot');
  PERFORM bt.ok((SELECT count(*) FROM builder.promo_claims WHERE promo_id = 'test-offer' AND released_at IS NULL) = 3, 'still exactly three spots used');

  -- A spot never paid for goes back after a day.
  UPDATE builder.promo_claims SET claimed_at = now() - interval '2 days' WHERE promo_id = 'test-offer' AND tenant_id = t[2];
  PERFORM bt.ok(builder.release_stale_promo_claims() = 1, 'an unpaid spot is released after a day');
  PERFORM bt.ok(builder.claim_promo('test-offer', t[4]), 'and the next business can take it');

  -- A paid spot is kept.
  INSERT INTO builder.subscriptions (tenant_id, provider_subscription_id, product_key, status) VALUES (t[1], 'I-PROMO1', 'website-simple', 'active');
  PERFORM bt.ok(builder.attach_promo('test-offer', t[1], 'I-PROMO1'), 'the spot is linked to its subscription');
  PERFORM bt.ok((SELECT promo_id FROM builder.subscriptions WHERE provider_subscription_id = 'I-PROMO1') = 'test-offer', 'the subscription records the offer');
  UPDATE builder.promo_claims SET claimed_at = now() - interval '2 days' WHERE promo_id = 'test-offer' AND tenant_id = t[1];
  PERFORM builder.release_stale_promo_claims();
  PERFORM bt.ok((SELECT released_at FROM builder.promo_claims WHERE promo_id = 'test-offer' AND tenant_id = t[1]) IS NULL, 'a paid spot is never released');

  -- Off, or past the end date: no new spots.
  PERFORM builder.set_promo('test-offer', false, 10, current_date + 30, null);
  PERFORM bt.ok(NOT builder.claim_promo('test-offer', t[2]), 'no spots while the offer is off');
  PERFORM builder.set_promo('test-offer', true, 10, current_date - 1, null);
  PERFORM bt.ok(NOT builder.claim_promo('test-offer', t[2]), 'no spots after the end date');
  PERFORM bt.ok((SELECT count(*) FROM builder.audit_log WHERE action = 'billing.promo' AND target_id = 'test-offer') = 2, 'offer changes are audited');
  PERFORM bt.ok(bt.raises($q$SELECT builder.set_promo('nope', true, 1, current_date, null)$q$), 'an unknown offer is refused');
END $$;
RESET ROLE;

DO $$ BEGIN RAISE NOTICE 'ALL FOUNDING OFFER TESTS PASSED'; END $$;
