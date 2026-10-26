-- FAKE data for local tests only. No real people, no real Square data.
INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.test', now()),
  ('00000000-0000-0000-0000-0000000000c1', 'crew@example.test', now()),
  ('00000000-0000-0000-0000-0000000000c2', 'revoked@example.test', now()),
  ('00000000-0000-0000-0000-0000000000d1', 'stranger@example.test', now()),
  ('00000000-0000-0000-0000-0000000000e1', 'unverified@example.test', NULL);

INSERT INTO ms_members (user_id, email, role, activated_at) VALUES
  ('00000000-0000-0000-0000-0000000000a1', 'owner@example.test', 'owner', now());
-- Crew invite waiting for first sign-in (user_id NULL).
INSERT INTO ms_members (email, role) VALUES ('crew@example.test', 'crew'), ('unverified@example.test', 'crew');
INSERT INTO ms_members (user_id, email, role, revoked_at) VALUES
  ('00000000-0000-0000-0000-0000000000c2', 'revoked@example.test', 'crew', now());

INSERT INTO ms_square_connection (environment, merchant_id, business_name, scopes, status, connected_at)
VALUES ('sandbox', 'MERCHANT_TEST', 'Test Kitchen', ARRAY['ORDERS_READ'], 'connected', now());
INSERT INTO ms_square_tokens (access_token_enc, refresh_token_enc) VALUES ('v1:fake-cipher', 'v1:fake-cipher');
INSERT INTO ms_square_locations (id, name, timezone, status) VALUES ('LOC1', 'Truck', 'America/Chicago', 'ACTIVE');
INSERT INTO ms_square_webhook_events (event_id, type) VALUES ('evt-1', 'order.created');
INSERT INTO ms_sync_runs (kind, trigger, status) VALUES ('orders', 'test', 'ok');

-- Oct 20 2026 18:00 UTC = 1:00 PM Central → day 2026-10-20.
INSERT INTO ms_orders (id, location_id, state, sq_created_at, closed_at, total_cents, tax_cents, discount_cents,
                       tip_cents, gross_sales_cents, returns_cents)
VALUES ('ORD1', 'LOC1', 'COMPLETED', '2026-10-20T18:00:00Z', '2026-10-20T18:01:00Z', 2706, 206, 0, 300, 2500, 0),
       ('ORD2', 'LOC1', 'COMPLETED', '2026-10-21T04:30:00Z', '2026-10-21T04:31:00Z', 1500, 0, 500, 0, 2000, 0),
       ('ORD3', 'LOC1', 'OPEN',      '2026-10-20T19:00:00Z', NULL, 9999, 0, 0, 0, 9999, 0);
-- ORD2 is 11:30 PM Central on Oct 20 → still Oct 20.
INSERT INTO ms_order_lines (order_id, uid, name, variation_name, catalog_object_id, quantity, base_price_cents,
                            gross_sales_cents, discount_cents, total_cents)
VALUES ('ORD1', 'l1', '2 Meat Plate', 'Regular', 'VAR1', 1, 2500, 2500, 0, 2500),
       ('ORD2', 'l1', '1 Meat Plate', 'Regular', 'VAR2', 1, 1500, 1500, 500, 1000),
       ('ORD2', 'l2', 'Soda', NULL, 'VAR3', 2, 250, 500, 0, 500);
INSERT INTO ms_payments (id, order_id, location_id, status, source_type, sq_created_at, amount_cents, tip_cents,
                         total_cents, processing_fee_cents, refunded_cents)
VALUES ('PAY1', 'ORD1', 'LOC1', 'COMPLETED', 'CARD', '2026-10-20T18:01:00Z', 2406, 300, 2706, 85, 0),
       ('PAY2', 'ORD2', 'LOC1', 'COMPLETED', 'CASH', '2026-10-21T04:31:00Z', 1500, 0, 1500, 0, 0);

INSERT INTO ms_catalog_items (id, name, category_name) VALUES ('ITEM1', '2 Meat Plate', 'Meat Plates');
INSERT INTO ms_catalog_variations (id, item_id, name, price_cents) VALUES ('VAR1', 'ITEM1', 'Regular', 2500);
INSERT INTO ms_customers (id, given_name, email) VALUES ('CUST1', 'Test', 'cust@example.test');
INSERT INTO ms_team_members (id, given_name, status) VALUES ('TM1', 'Test Crew', 'ACTIVE');

INSERT INTO ms_ingredients (id, name, base_unit) VALUES
  ('00000000-0000-0000-0000-00000000f001', 'Brisket', 'lb'),
  ('00000000-0000-0000-0000-00000000f002', 'Clamshell 9in', 'each');
INSERT INTO ms_receipts (id, status, vendor, receipt_date, subtotal_cents, tax_cents, total_cents, image_paths)
VALUES ('00000000-0000-0000-0000-00000000b001', 'needs_review', 'Test Supplier', '2026-10-19', 9000, 0, 9000,
        ARRAY['00000000-0000-0000-0000-00000000b001/1.jpg']);
INSERT INTO ms_receipt_lines (receipt_id, line_no, raw_text, quantity, unit_price_cents, line_total_cents,
                              pack_qty, pack_unit, ingredient_id, mapped_by)
VALUES ('00000000-0000-0000-0000-00000000b001', 1, 'BEEF BRSKT CHOICE 10LB', 2, 4000, 8000, 10, 'lb',
        '00000000-0000-0000-0000-00000000f001', 'owner'),
       ('00000000-0000-0000-0000-00000000b001', 2, 'CLAMSHELL 9IN 200CT', 1, 1000, 1000, 200, 'each',
        '00000000-0000-0000-0000-00000000f002', 'owner');
INSERT INTO ms_item_aliases (vendor_key, raw_key, ingredient_id) VALUES
  ('seedvendor', 'SEED ITEM', '00000000-0000-0000-0000-00000000f001');
-- One already-approved receipt so ms_price_book has a row (inserted as superuser).
INSERT INTO ms_receipts (id, status, vendor, receipt_date, total_cents, approved_at)
VALUES ('00000000-0000-0000-0000-00000000b000', 'approved', 'Seed Vendor', '2026-10-01', 500, now());
INSERT INTO ms_receipt_lines (id, receipt_id, line_no, raw_text, quantity, line_total_cents, pack_qty, pack_unit, ingredient_id)
VALUES ('00000000-0000-0000-0000-00000000c000', '00000000-0000-0000-0000-00000000b000', 1, 'SEED ITEM', 1, 500, 1, 'lb',
        '00000000-0000-0000-0000-00000000f001');
INSERT INTO ms_price_book (ingredient_id, receipt_id, receipt_line_id, vendor, observed_on, base_unit, base_qty, cost_cents, cost_per_base_cents)
VALUES ('00000000-0000-0000-0000-00000000f001', '00000000-0000-0000-0000-00000000b000',
        '00000000-0000-0000-0000-00000000c000', 'Seed Vendor', '2026-10-01', 'lb', 1, 500, 500);
INSERT INTO storage.objects (bucket_id, name, owner) VALUES
  ('ms-receipts', '00000000-0000-0000-0000-00000000b001/1.jpg', '00000000-0000-0000-0000-0000000000a1');
INSERT INTO ms_audit_log (action) VALUES ('seed');
