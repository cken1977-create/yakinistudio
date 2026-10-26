-- MOMMA SALLY'S OFFICE · 3/3 · Receipts → reviewed line items → price book
--
-- OWNER ONLY. Nothing reaches the price book until the owner approves a
-- receipt; ms_approve_receipt() is the only writer of ms_price_book and of
-- learned item mappings (ms_item_aliases).
-- NOT APPLIED to any live database.

CREATE TABLE public.ms_ingredients (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  base_unit   text NOT NULL CHECK (base_unit IN ('lb', 'oz', 'g', 'kg', 'each', 'gal', 'qt', 'floz', 'l', 'ml')),
  category    text NOT NULL DEFAULT 'food' CHECK (category IN ('food', 'packaging', 'supplies', 'other')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name)
);

CREATE TABLE public.ms_receipts (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status           text NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'needs_review', 'approved', 'rejected')),
  vendor           text,
  receipt_date     date,
  receipt_number   text,
  subtotal_cents   bigint,
  tax_cents        bigint,
  total_cents      bigint,
  category         text NOT NULL DEFAULT 'food' CHECK (category IN ('food', 'packaging', 'supplies', 'fuel', 'other')),
  event_tag        text,
  image_paths      text[] NOT NULL DEFAULT '{}',
  extractor        text,
  flags            jsonb NOT NULL DEFAULT '[]'::jsonb,
  duplicate_of     uuid REFERENCES public.ms_receipts(id) ON DELETE SET NULL,
  created_by       uuid DEFAULT auth.uid(),
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  approved_at      timestamptz,
  approved_by      uuid
);
CREATE INDEX ms_receipts_dupe_idx ON public.ms_receipts (lower(vendor), receipt_date, total_cents);

CREATE TABLE public.ms_receipt_lines (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id          uuid NOT NULL REFERENCES public.ms_receipts(id) ON DELETE CASCADE,
  line_no             int NOT NULL,
  raw_text            text NOT NULL DEFAULT '',
  quantity            numeric,
  unit_price_cents    bigint,
  line_total_cents    bigint,
  discount_cents      bigint NOT NULL DEFAULT 0,
  -- What one purchased unit contains, e.g. a case of 10 lb → pack_qty 10, pack_unit 'lb'.
  pack_qty            numeric,
  pack_unit           text,
  ingredient_id       uuid REFERENCES public.ms_ingredients(id) ON DELETE SET NULL,
  mapped_by           text NOT NULL DEFAULT 'none' CHECK (mapped_by IN ('none', 'alias', 'owner')),
  ignored             boolean NOT NULL DEFAULT false,
  flags               jsonb NOT NULL DEFAULT '[]'::jsonb,
  cost_per_base_cents numeric,
  UNIQUE (receipt_id, line_no)
);

CREATE TABLE public.ms_item_aliases (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_key     text NOT NULL,
  raw_key        text NOT NULL,
  ingredient_id  uuid NOT NULL REFERENCES public.ms_ingredients(id) ON DELETE CASCADE,
  pack_qty       numeric,
  pack_unit      text,
  times_used     int NOT NULL DEFAULT 1,
  last_used_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (vendor_key, raw_key)
);

CREATE TABLE public.ms_price_book (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id        uuid NOT NULL REFERENCES public.ms_ingredients(id) ON DELETE CASCADE,
  receipt_id           uuid NOT NULL REFERENCES public.ms_receipts(id) ON DELETE CASCADE,
  receipt_line_id      uuid NOT NULL UNIQUE REFERENCES public.ms_receipt_lines(id) ON DELETE CASCADE,
  vendor               text,
  observed_on          date NOT NULL,
  base_unit            text NOT NULL,
  base_qty             numeric NOT NULL CHECK (base_qty > 0),
  cost_cents           bigint NOT NULL CHECK (cost_cents >= 0),
  cost_per_base_cents  numeric NOT NULL,
  created_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ms_price_book_ing_idx ON public.ms_price_book (ingredient_id, observed_on DESC);

-- Latest approved price per ingredient (invoker view → base-table RLS applies).
CREATE VIEW public.ms_price_book_current WITH (security_invoker = true) AS
SELECT DISTINCT ON (pb.ingredient_id)
       pb.ingredient_id, i.name AS ingredient_name, i.base_unit, i.category,
       pb.cost_per_base_cents, pb.observed_on, pb.vendor, pb.receipt_id,
       (SELECT count(*) FROM public.ms_price_book p2 WHERE p2.ingredient_id = pb.ingredient_id) AS observations
FROM public.ms_price_book pb JOIN public.ms_ingredients i ON i.id = pb.ingredient_id
ORDER BY pb.ingredient_id, pb.observed_on DESC, pb.created_at DESC;

-- ─── RLS ────────────────────────────────────────────────────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ms_ingredients','ms_receipts','ms_receipt_lines','ms_item_aliases'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.ms_is_owner()) WITH CHECK (public.ms_is_owner())',
                   t || '_owner_all', t);
  END LOOP;
END $$;
-- Aliases and the price book are written only by ms_approve_receipt().
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ms_item_aliases FROM authenticated;
GRANT DELETE ON public.ms_item_aliases TO authenticated;  -- owner may forget a bad mapping

ALTER TABLE public.ms_price_book ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_price_book FROM anon;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.ms_price_book FROM authenticated;
CREATE POLICY ms_price_book_owner_read ON public.ms_price_book FOR SELECT TO authenticated
  USING (public.ms_is_owner());
REVOKE ALL ON public.ms_price_book_current FROM anon;

INSERT INTO public.ms_table_classes VALUES
  ('ms_ingredients',   'owner_only', 'ingredient list'),
  ('ms_receipts',      'money',      'supplier receipts'),
  ('ms_receipt_lines', 'money',      'receipt line items'),
  ('ms_item_aliases',  'owner_only', 'learned mappings'),
  ('ms_price_book',    'money',      'approved ingredient costs');

-- An approved receipt is frozen for API users. Only ms_approve_receipt()
-- (SECURITY DEFINER, so current_user is the function owner) may set status
-- to approved or touch an approved receipt's lines.
CREATE OR REPLACE FUNCTION ms_private.freeze_approved()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
DECLARE
  v_status text;
  v_api    boolean := current_user IN ('authenticated', 'anon');
BEGIN
  IF TG_TABLE_NAME = 'ms_receipts' THEN
    IF TG_OP = 'DELETE' THEN
      IF v_api AND OLD.status = 'approved' THEN RAISE EXCEPTION 'Approved receipts can''t be deleted'; END IF;
      RETURN OLD;
    END IF;
    IF v_api AND OLD.status = 'approved' THEN
      RAISE EXCEPTION 'Approved receipts can''t be edited';
    END IF;
    IF v_api AND NEW.status = 'approved' THEN
      RAISE EXCEPTION 'Use ms_approve_receipt() to approve';
    END IF;
    NEW.updated_at = now();
    RETURN NEW;
  END IF;
  SELECT r.status INTO v_status FROM public.ms_receipts r WHERE r.id = coalesce(NEW.receipt_id, OLD.receipt_id);
  IF v_api AND v_status = 'approved' THEN
    RAISE EXCEPTION 'Approved receipts can''t be edited';
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER ms_receipts_freeze BEFORE UPDATE OR DELETE ON public.ms_receipts
  FOR EACH ROW EXECUTE FUNCTION ms_private.freeze_approved();
CREATE TRIGGER ms_receipt_lines_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.ms_receipt_lines
  FOR EACH ROW EXECUTE FUNCTION ms_private.freeze_approved();

-- ─── Unit conversion (mirrors lib/receipts/normalize.ts) ───────────────────
CREATE OR REPLACE FUNCTION ms_private.unit_factor(p_from text, p_to text)
RETURNS numeric LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  WITH u(unit, dim, f) AS (VALUES
    ('lb','mass',453.59237::numeric), ('oz','mass',28.349523125), ('g','mass',1), ('kg','mass',1000),
    ('each','count',1), ('gal','vol',3785.411784), ('qt','vol',946.352946), ('floz','vol',29.5735295625),
    ('l','vol',1000), ('ml','vol',1))
  SELECT a.f / b.f FROM u a, u b WHERE a.unit = p_from AND b.unit = p_to AND a.dim = b.dim
$$;

-- ─── Approve: the only way lines become costs ──────────────────────────────
-- Refuses if: not owner; not in review; any counted line lacks an ingredient,
-- a quantity, a line total, or a pack size convertible to the ingredient's
-- base unit; or there are math/duplicate flags the owner hasn't acknowledged.
CREATE OR REPLACE FUNCTION public.ms_approve_receipt(p_receipt_id uuid, p_acknowledge_flags boolean DEFAULT false)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  r         public.ms_receipts%ROWTYPE;
  ln        record;
  v_factor  numeric;
  v_base    numeric;
  v_cost    bigint;
  v_n       int := 0;
  v_vendor_key text;
BEGIN
  IF NOT public.ms_is_owner() THEN RAISE EXCEPTION 'owner only' USING ERRCODE = '42501'; END IF;
  SELECT * INTO r FROM public.ms_receipts WHERE id = p_receipt_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'receipt not found'; END IF;
  IF r.status <> 'needs_review' THEN RAISE EXCEPTION 'receipt is %, not needs_review', r.status; END IF;
  IF r.vendor IS NULL OR btrim(r.vendor) = '' OR r.receipt_date IS NULL OR r.total_cents IS NULL THEN
    RAISE EXCEPTION 'vendor, date and total are required';
  END IF;
  IF jsonb_array_length(r.flags) > 0 AND NOT p_acknowledge_flags THEN
    RAISE EXCEPTION 'receipt has flags; review them and acknowledge to approve';
  END IF;
  IF EXISTS (SELECT 1 FROM public.ms_receipt_lines l WHERE l.receipt_id = r.id AND NOT l.ignored
              AND jsonb_array_length(l.flags) > 0) AND NOT p_acknowledge_flags THEN
    RAISE EXCEPTION 'some lines have flags; review them and acknowledge to approve';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.ms_receipt_lines l WHERE l.receipt_id = r.id AND NOT l.ignored) THEN
    RAISE EXCEPTION 'no lines to count; ignore the receipt instead';
  END IF;

  v_vendor_key := regexp_replace(lower(r.vendor), '[^a-z0-9]+', '', 'g');

  FOR ln IN
    SELECT l.*, i.base_unit FROM public.ms_receipt_lines l
    LEFT JOIN public.ms_ingredients i ON i.id = l.ingredient_id
    WHERE l.receipt_id = r.id AND NOT l.ignored ORDER BY l.line_no
  LOOP
    IF ln.ingredient_id IS NULL THEN RAISE EXCEPTION 'line % has no ingredient', ln.line_no; END IF;
    IF ln.quantity IS NULL OR ln.quantity <= 0 THEN RAISE EXCEPTION 'line % needs a quantity', ln.line_no; END IF;
    IF ln.line_total_cents IS NULL OR ln.line_total_cents < 0 THEN RAISE EXCEPTION 'line % needs a total', ln.line_no; END IF;
    IF ln.pack_qty IS NULL OR ln.pack_qty <= 0 OR ln.pack_unit IS NULL THEN
      RAISE EXCEPTION 'line % needs a pack size (how much is in one)', ln.line_no;
    END IF;
    v_factor := ms_private.unit_factor(ln.pack_unit, ln.base_unit);
    IF v_factor IS NULL THEN
      RAISE EXCEPTION 'line %: % can''t convert to %', ln.line_no, ln.pack_unit, ln.base_unit;
    END IF;
    v_base := ln.quantity * ln.pack_qty * v_factor;
    v_cost := ln.line_total_cents - coalesce(ln.discount_cents, 0);
    IF v_cost < 0 THEN RAISE EXCEPTION 'line % discount exceeds total', ln.line_no; END IF;

    UPDATE public.ms_receipt_lines SET cost_per_base_cents = round(v_cost / v_base, 4) WHERE id = ln.id;
    INSERT INTO public.ms_price_book(ingredient_id, receipt_id, receipt_line_id, vendor, observed_on,
                                     base_unit, base_qty, cost_cents, cost_per_base_cents)
    VALUES (ln.ingredient_id, r.id, ln.id, r.vendor, r.receipt_date, ln.base_unit, v_base, v_cost,
            round(v_cost / v_base, 4));

    -- Learn the mapping for next time (vendor + normalized line text).
    IF btrim(ln.raw_text) <> '' THEN
      INSERT INTO public.ms_item_aliases(vendor_key, raw_key, ingredient_id, pack_qty, pack_unit)
      VALUES (v_vendor_key, public.ms_alias_key(ln.raw_text), ln.ingredient_id, ln.pack_qty, ln.pack_unit)
      ON CONFLICT (vendor_key, raw_key) DO UPDATE
        SET ingredient_id = EXCLUDED.ingredient_id, pack_qty = EXCLUDED.pack_qty, pack_unit = EXCLUDED.pack_unit,
            times_used = public.ms_item_aliases.times_used + 1, last_used_at = now();
    END IF;
    v_n := v_n + 1;
  END LOOP;

  UPDATE public.ms_receipts SET status = 'approved', approved_at = now(), approved_by = auth.uid() WHERE id = r.id;
  INSERT INTO public.ms_audit_log(action, table_name, row_id, detail)
  VALUES ('receipt_approved', 'ms_receipts', r.id::text,
          jsonb_build_object('lines', v_n, 'acknowledged_flags', p_acknowledge_flags));
  RETURN v_n;
END $$;

-- Same normalization as lib/receipts/normalize.ts aliasKey().
CREATE OR REPLACE FUNCTION public.ms_alias_key(p_raw text)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT btrim(regexp_replace(regexp_replace(upper(p_raw), '[^A-Z0-9#/. ]+', ' ', 'g'), '\s+', ' ', 'g'))
$$;
REVOKE ALL ON FUNCTION public.ms_alias_key(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_alias_key(text) TO authenticated;

REVOKE ALL ON FUNCTION public.ms_approve_receipt(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_approve_receipt(uuid, boolean) TO authenticated;

-- ─── Private storage for receipt photos (owner only) ───────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('ms-receipts', 'ms-receipts', false, 15728640,
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY ms_receipts_files_owner_read ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ms-receipts' AND public.ms_is_owner());
CREATE POLICY ms_receipts_files_owner_insert ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ms-receipts' AND public.ms_is_owner());
CREATE POLICY ms_receipts_files_owner_delete ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ms-receipts' AND public.ms_is_owner());
