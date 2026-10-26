-- MOMMA SALLY'S OFFICE · RLS tests (FAKE data). Each check raises on failure.
-- Core promise under test: crew can't read ANY money table, by any route.
\set ON_ERROR_STOP on
SET client_min_messages = notice;

CREATE SCHEMA ms_test;
GRANT USAGE ON SCHEMA ms_test TO anon, authenticated;
CREATE FUNCTION ms_test.ok(cond boolean, label text) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF cond IS NOT TRUE THEN RAISE EXCEPTION 'FAIL: %', label; END IF;
  RAISE NOTICE 'PASS: %', label;
END $$;
CREATE FUNCTION ms_test.login(p_uid uuid) RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', json_build_object('sub', p_uid, 'role', 'authenticated')::text, false);
$$;
CREATE FUNCTION ms_test.logout() RETURNS void LANGUAGE sql AS $$
  SELECT set_config('request.jwt.claims', '', false);
$$;
-- Every table + view in public that isn't crew-safe, for the loops below.
CREATE TABLE ms_test.protected AS
  SELECT c.table_name FROM ms_table_classes c WHERE c.class IN ('money', 'owner_only', 'service_only')
  UNION ALL SELECT 'ms_price_book_current';
-- Try to read every protected relation as the current role. Returns the
-- relations where at least one row came back (should be none).
CREATE FUNCTION ms_test.leaks() RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE t text; n bigint; out text[] := '{}';
BEGIN
  FOR t IN SELECT table_name FROM ms_test.protected LOOP
    BEGIN
      EXECUTE format('SELECT count(*) FROM public.%I', t) INTO n;
      IF n > 0 THEN out := out || (t || '=' || n); END IF;
    EXCEPTION WHEN insufficient_privilege THEN NULL;  -- denied outright: also not a leak
    END;
  END LOOP;
  RETURN out;
END $$;
-- Try to change every protected table. Returns tables where a write landed.
CREATE FUNCTION ms_test.writes() RETURNS text[] LANGUAGE plpgsql AS $$
DECLARE t text; col text; n bigint; out text[] := '{}';
BEGIN
  FOR t IN SELECT p.table_name FROM ms_test.protected p
           JOIN pg_class c ON c.relname = p.table_name AND c.relkind = 'r' LOOP
    SELECT a.attname INTO col FROM pg_attribute a WHERE a.attrelid = ('public.' || t)::regclass
      AND a.attnum > 0 AND NOT a.attisdropped AND a.attidentity = '' ORDER BY a.attnum LIMIT 1;
    BEGIN
      EXECUTE format('UPDATE public.%I SET %I = %I', t, col, col);
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN out := out || ('update:' || t); END IF;
    EXCEPTION WHEN insufficient_privilege OR raise_exception THEN NULL;
    END;
    BEGIN
      EXECUTE format('DELETE FROM public.%I', t);
      GET DIAGNOSTICS n = ROW_COUNT;
      IF n > 0 THEN out := out || ('delete:' || t); END IF;
    EXCEPTION WHEN insufficient_privilege OR raise_exception OR foreign_key_violation THEN NULL;
    END;
  END LOOP;
  RETURN out;
END $$;
CREATE FUNCTION ms_test.raises(p_sql text) RETURNS boolean LANGUAGE plpgsql AS $$
BEGIN
  EXECUTE p_sql;
  RETURN false;
EXCEPTION WHEN OTHERS THEN RETURN true;
END $$;
GRANT SELECT ON ms_test.protected TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA ms_test TO anon, authenticated;

-- ── Schema guarantees (as DB owner) ───────────────────────────────────────
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity),
  'every table in public has RLS enabled');
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname NOT IN (SELECT table_name FROM ms_table_classes)),
  'every table in public is classified in ms_table_classes (new tables can''t skip the money decision)');
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM ms_table_classes t WHERE t.class IN ('money', 'owner_only', 'service_only')
    AND EXISTS (SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = t.table_name
                AND p.qual NOT LIKE '%ms_is_owner()%')),
  'every policy on a money/owner-only table requires ms_is_owner()');
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_policies p WHERE p.schemaname = 'public' AND p.tablename = 'ms_square_tokens'),
  'ms_square_tokens has no policies at all');
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.proname LIKE 'ms\_%' AND has_function_privilege('anon', p.oid, 'EXECUTE')),
  'no office function is callable by anonymous visitors');
SELECT ms_test.ok((SELECT count(*) FROM ms_test.protected) >= 20, 'protected list covers all money/owner tables');
SELECT ms_test.ok(
  (SELECT count(*) FROM ms_table_classes WHERE class = 'money') = 7,
  'seven money tables registered (orders, order lines, payments, menu prices, receipts, receipt lines, price book)');

-- ── Crew (invite accepted on first sign-in) ──────────────────────────────
SET ROLE authenticated;
SELECT ms_test.login('00000000-0000-0000-0000-0000000000c1');
SELECT ms_test.ok(ms_current_role() IS NULL, 'crew has no role before accepting the invite');
SELECT ms_test.ok(ms_accept_invite() = 'crew', 'crew invite is accepted by verified email');
SELECT ms_test.ok((SELECT role FROM ms_me()) = 'crew', 'ms_me() says crew');
SELECT ms_test.ok(cardinality(ms_test.leaks()) = 0,
  'CREW READS ZERO ROWS FROM EVERY MONEY / OWNER-ONLY TABLE AND VIEW: ' || array_to_string(ms_test.leaks(), ', '));
SELECT ms_test.ok(cardinality(ms_test.writes()) = 0,
  'crew can''t update or delete any protected table: ' || array_to_string(ms_test.writes(), ', '));
SELECT ms_test.ok(ms_test.raises($$INSERT INTO ms_orders (id) VALUES ('X')$$), 'crew can''t insert orders');
SELECT ms_test.ok(ms_test.raises($$INSERT INTO ms_receipts (vendor) VALUES ('X')$$), 'crew can''t insert receipts');
SELECT ms_test.ok(ms_test.raises($$INSERT INTO ms_price_book (ingredient_id, receipt_id, receipt_line_id, observed_on, base_unit, base_qty, cost_cents, cost_per_base_cents)
  VALUES ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-00000000b000','00000000-0000-0000-0000-00000000c000','2026-01-01','lb',1,1,1)$$),
  'crew can''t write the price book');
SELECT ms_test.ok(ms_test.raises($$SELECT * FROM ms_daily_sales('2026-10-01', '2026-10-31')$$), 'crew can''t run the daily sales report');
SELECT ms_test.ok(ms_test.raises($$SELECT * FROM ms_item_sales('2026-10-01', '2026-10-31')$$), 'crew can''t run item sales');
SELECT ms_test.ok(ms_test.raises($$SELECT ms_approve_receipt('00000000-0000-0000-0000-00000000b001', true)$$), 'crew can''t approve receipts');
SELECT ms_test.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'ms-receipts') = 0, 'crew can''t see receipt photos');
SELECT ms_test.ok(ms_test.raises($$INSERT INTO storage.objects (bucket_id, name) VALUES ('ms-receipts', 'x/1.jpg')$$),
  'crew can''t upload receipt photos');
SELECT ms_test.ok((SELECT count(*) FROM ms_members) = 1, 'crew sees only their own login row');
SELECT ms_test.ok(ms_test.raises($$INSERT INTO ms_members (email, role) VALUES ('evil@example.test', 'owner')$$),
  'crew can''t create an owner login');
UPDATE ms_members SET role = 'owner' WHERE user_id = auth.uid();
SELECT ms_test.ok(ms_current_role() = 'crew', 'crew can''t promote themselves');
SELECT ms_test.ok((SELECT count(*) FROM ms_crew_menu()) = 1, 'crew gets menu names through ms_crew_menu()');
RESET ROLE;
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_proc p WHERE p.proname = 'ms_crew_menu'
    AND (pg_get_function_result(p.oid) ILIKE '%cents%' OR pg_get_function_result(p.oid) ILIKE '%price%')),
  'ms_crew_menu() returns no price columns');
-- Crew-callable SECURITY DEFINER functions must not return money columns.
SELECT ms_test.ok(NOT EXISTS (
  SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname = 'public' AND p.prosecdef AND has_function_privilege('authenticated', p.oid, 'EXECUTE')
    AND p.proname NOT IN ('ms_approve_receipt')  -- owner-checked, returns a count
    AND (pg_get_function_result(p.oid) ILIKE '%cents%' OR pg_get_function_result(p.oid) ILIKE '%price%'
         OR pg_get_function_result(p.oid) ILIKE '%fee%' OR pg_get_function_result(p.oid) ILIKE '%total%')),
  'no definer function callable by signed-in users returns money columns');

-- ── Revoked crew, signed-in stranger, unverified email, anon ─────────────
SET ROLE authenticated;
SELECT ms_test.login('00000000-0000-0000-0000-0000000000c2');
SELECT ms_test.ok(ms_current_role() IS NULL AND NOT ms_is_member(), 'revoked crew has no role');
SELECT ms_test.ok(cardinality(ms_test.leaks()) = 0, 'revoked crew reads nothing protected');
SELECT ms_test.ok((SELECT count(*) FROM ms_crew_menu()) = 0, 'revoked crew gets no menu');
SELECT ms_test.login('00000000-0000-0000-0000-0000000000d1');
SELECT ms_test.ok(ms_accept_invite() IS NULL, 'stranger with no invite gets no role');
SELECT ms_test.ok(cardinality(ms_test.leaks()) = 0 AND (SELECT count(*) FROM ms_members) = 0, 'stranger reads nothing');
SELECT ms_test.login('00000000-0000-0000-0000-0000000000e1');
SELECT ms_test.ok(ms_accept_invite() IS NULL, 'an unverified email can''t claim an invite');
RESET ROLE;
SET ROLE anon;
SELECT ms_test.logout();
SELECT ms_test.ok(cardinality(ms_test.leaks()) = 0, 'anon reads nothing protected');
SELECT ms_test.ok(ms_test.raises($$SELECT count(*) FROM ms_members$$), 'anon can''t touch logins');
SELECT ms_test.ok(ms_test.raises($$SELECT * FROM ms_crew_menu()$$), 'anon can''t call ms_crew_menu()');
RESET ROLE;

-- ── Owner ────────────────────────────────────────────────────────────────
SET ROLE authenticated;
SELECT ms_test.login('00000000-0000-0000-0000-0000000000a1');
SELECT ms_test.ok(ms_is_owner(), 'owner is owner');
SELECT ms_test.ok((SELECT count(*) FROM ms_orders) = 3 AND (SELECT count(*) FROM ms_payments) = 2
                  AND (SELECT count(*) FROM ms_price_book) = 1, 'owner reads money tables');
SELECT ms_test.ok(ms_test.raises($$SELECT count(*) FROM ms_square_tokens$$), 'even the owner can''t read the token table');
SELECT ms_test.ok(ms_test.raises($$UPDATE ms_orders SET total_cents = 1 WHERE id = 'ORD1'$$)
                  AND (SELECT total_cents FROM ms_orders WHERE id = 'ORD1') = 2706,
  'synced Square data is read-only for the owner too');
SELECT ms_test.ok((SELECT row(orders, gross_sales_cents, discount_cents, net_sales_cents, tax_cents, tip_cents,
                              fee_cents, card_cents, cash_cents, items_sold)::text
                   FROM ms_daily_sales('2026-10-20', '2026-10-20')) = '(2,4500,500,4000,206,300,85,2706,1500,4)',
  'daily sales: Central-time buckets, open orders excluded, fees/tips/cash vs card correct');
SELECT ms_test.ok((SELECT count(*) FROM ms_daily_sales('2026-10-14', '2026-10-20')) = 7, 'daily sales returns one row per day');
SELECT ms_test.ok((SELECT quantity FROM ms_item_sales('2026-10-20', '2026-10-20') WHERE item_name = 'Soda') = 2, 'item sales');

-- Receipt approval rules.
SELECT ms_test.ok(ms_test.raises($$UPDATE ms_receipts SET status = 'approved' WHERE id = '00000000-0000-0000-0000-00000000b001'$$),
  'a receipt can''t be approved by a plain update');
UPDATE ms_receipts SET flags = '[{"code":"subtotal_mismatch"}]' WHERE id = '00000000-0000-0000-0000-00000000b001';
SELECT ms_test.ok(ms_test.raises($$SELECT ms_approve_receipt('00000000-0000-0000-0000-00000000b001')$$),
  'flags block approval until acknowledged');
UPDATE ms_receipt_lines SET ingredient_id = NULL WHERE receipt_id = '00000000-0000-0000-0000-00000000b001' AND line_no = 2;
SELECT ms_test.ok(ms_test.raises($$SELECT ms_approve_receipt('00000000-0000-0000-0000-00000000b001', true)$$),
  'an unmapped line blocks approval even with flags acknowledged');
SELECT ms_test.ok((SELECT count(*) FROM ms_price_book) = 1, 'nothing reached the price book before approval');
UPDATE ms_receipt_lines SET ingredient_id = '00000000-0000-0000-0000-00000000f002'
  WHERE receipt_id = '00000000-0000-0000-0000-00000000b001' AND line_no = 2;
SELECT ms_test.ok(ms_approve_receipt('00000000-0000-0000-0000-00000000b001', true) = 2, 'owner approves: 2 lines counted');
SELECT ms_test.ok((SELECT cost_per_base_cents FROM ms_price_book_current WHERE ingredient_name = 'Brisket') = 400,
  'brisket: 2 cases x 10 lb for $80.00 = 400 cents/lb in the price book');
SELECT ms_test.ok((SELECT cost_per_base_cents FROM ms_price_book_current WHERE ingredient_name = 'Clamshell 9in') = 5,
  'clamshells: 200 for $10.00 = 5 cents each');
SELECT ms_test.ok((SELECT ingredient_id FROM ms_item_aliases WHERE vendor_key = 'testsupplier'
                   AND raw_key = ms_alias_key('beef  brskt choice 10lb')) = '00000000-0000-0000-0000-00000000f001',
  'the mapping was learned (vendor + normalized line text)');
SELECT ms_test.ok(ms_test.raises($$UPDATE ms_receipts SET total_cents = 1 WHERE id = '00000000-0000-0000-0000-00000000b001'$$),
  'an approved receipt is frozen');
SELECT ms_test.ok(ms_test.raises($$UPDATE ms_receipt_lines SET line_total_cents = 1 WHERE receipt_id = '00000000-0000-0000-0000-00000000b001'$$),
  'an approved receipt''s lines are frozen');
SELECT ms_test.ok(ms_test.raises($$DELETE FROM ms_receipts WHERE id = '00000000-0000-0000-0000-00000000b001'$$),
  'an approved receipt can''t be deleted');
SELECT ms_test.ok(ms_test.raises($$SELECT ms_approve_receipt('00000000-0000-0000-0000-00000000b001', true)$$),
  'a receipt can''t be approved twice');
SELECT ms_test.ok(ms_test.raises($$INSERT INTO ms_price_book (ingredient_id, receipt_id, receipt_line_id, observed_on, base_unit, base_qty, cost_cents, cost_per_base_cents)
  VALUES ('00000000-0000-0000-0000-00000000f001','00000000-0000-0000-0000-00000000b000','00000000-0000-0000-0000-00000000c000','2026-01-01','lb',1,1,1)$$),
  'the owner can''t write the price book directly either');
SELECT ms_test.ok((SELECT count(*) FROM storage.objects WHERE bucket_id = 'ms-receipts') = 1, 'owner sees receipt photos');
SELECT ms_test.ok(ms_test.raises($$UPDATE ms_members SET revoked_at = now() WHERE role = 'owner'$$),
  'the last owner can''t be revoked');
SELECT ms_test.ok((SELECT count(*) FROM ms_audit_log WHERE action = 'receipt_approved') = 1, 'approval is audited');
RESET ROLE;

-- Crew still sees none of the new price-book rows after approval.
SET ROLE authenticated;
SELECT ms_test.login('00000000-0000-0000-0000-0000000000c1');
SELECT ms_test.ok(cardinality(ms_test.leaks()) = 0, 'after approval, crew still reads zero money rows');
RESET ROLE;

-- Parity with lib/receipts/normalize.ts aliasKey() (same cases in receipts.test.ts).
SELECT ms_test.ok(public.ms_alias_key('  beef brisket,  choice 10lb* ') = 'BEEF BRISKET CHOICE 10LB'
              AND public.ms_alias_key('Clamshell 9x9 (200 ct)') = 'CLAMSHELL 9X9 200 CT',
                  'SQL alias key matches the app''s aliasKey()');
-- Parity with lib/receipts/normalize.ts unitFactor().
SELECT ms_test.ok(abs(ms_private.unit_factor('lb', 'oz') - 16) < 0.000001
              AND abs(ms_private.unit_factor('gal', 'qt') - 4) < 0.000001
              AND ms_private.unit_factor('lb', 'gal') IS NULL,
                  'SQL unit conversion matches the app''s unitFactor()');

SELECT 'ALL RLS TESTS PASSED' AS result;
