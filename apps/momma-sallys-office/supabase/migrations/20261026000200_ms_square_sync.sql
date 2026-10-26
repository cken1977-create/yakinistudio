-- MOMMA SALLY'S OFFICE · 2/3 · Read-only Square sync + owner daily sales
--
-- Everything here is OWNER ONLY. Crew has no policy on any of these tables.
-- Money is stored as integer cents (Square's own unit), never floats.
-- OAuth tokens live in ms_square_tokens: AES-256-GCM ciphertext written by the
-- server, no policies at all, and table privileges revoked from the API roles,
-- so only the service role can touch them.
-- NOT APPLIED to any live database.

-- ─── Connection status (no secrets) ─────────────────────────────────────────
CREATE TABLE public.ms_square_connection (
  id                 int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  environment        text NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox')),
  merchant_id        text,
  business_name      text,
  scopes             text[] NOT NULL DEFAULT '{}',
  status             text NOT NULL DEFAULT 'disconnected'
                       CHECK (status IN ('disconnected', 'connected', 'revoked', 'error')),
  connected_at       timestamptz,
  access_expires_at  timestamptz,
  last_refresh_at    timestamptz,
  last_sync_at       timestamptz,
  last_error         text,
  updated_at         timestamptz NOT NULL DEFAULT now()
);
COMMENT ON COLUMN public.ms_square_connection.environment IS
  'Slice 1 is sandbox-only by design. Production needs a new migration and Clarence''s OK.';

CREATE TABLE public.ms_square_tokens (
  id                 int PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  access_token_enc   text NOT NULL,
  refresh_token_enc  text NOT NULL,
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ms_square_locations (
  id          text PRIMARY KEY,
  name        text,
  timezone    text,
  status      text,
  synced_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ms_square_webhook_events (
  event_id      text PRIMARY KEY,
  type          text NOT NULL,
  merchant_id   text,
  object_id     text,
  received_at   timestamptz NOT NULL DEFAULT now(),
  processed_at  timestamptz,
  status        text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processed', 'ignored', 'error')),
  error         text
);

CREATE TABLE public.ms_sync_runs (
  id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind         text NOT NULL,
  trigger      text NOT NULL,
  started_at   timestamptz NOT NULL DEFAULT now(),
  finished_at  timestamptz,
  status       text NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'ok', 'error')),
  counts       jsonb NOT NULL DEFAULT '{}'::jsonb,
  error        text
);

-- ─── Sales ──────────────────────────────────────────────────────────────────
CREATE TABLE public.ms_orders (
  id                     text PRIMARY KEY,
  location_id            text,
  state                  text,
  source_name            text,
  customer_id            text,
  sq_created_at          timestamptz,
  sq_updated_at          timestamptz,
  closed_at              timestamptz,
  total_cents            bigint NOT NULL DEFAULT 0,
  tax_cents              bigint NOT NULL DEFAULT 0,
  discount_cents         bigint NOT NULL DEFAULT 0,
  tip_cents              bigint NOT NULL DEFAULT 0,
  service_charge_cents   bigint NOT NULL DEFAULT 0,
  gross_sales_cents      bigint NOT NULL DEFAULT 0,
  returns_cents          bigint NOT NULL DEFAULT 0,
  currency               text NOT NULL DEFAULT 'USD',
  synced_at              timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ms_orders_closed_idx ON public.ms_orders (closed_at);

CREATE TABLE public.ms_order_lines (
  order_id            text NOT NULL REFERENCES public.ms_orders(id) ON DELETE CASCADE,
  uid                 text NOT NULL,
  name                text,
  variation_name      text,
  catalog_object_id   text,
  quantity            numeric NOT NULL DEFAULT 0,
  base_price_cents    bigint NOT NULL DEFAULT 0,
  gross_sales_cents   bigint NOT NULL DEFAULT 0,
  discount_cents      bigint NOT NULL DEFAULT 0,
  total_cents         bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (order_id, uid)
);

CREATE TABLE public.ms_payments (
  id                    text PRIMARY KEY,
  order_id              text,
  location_id           text,
  status                text,
  source_type           text,
  card_brand            text,
  sq_created_at         timestamptz,
  sq_updated_at         timestamptz,
  amount_cents          bigint NOT NULL DEFAULT 0,
  tip_cents             bigint NOT NULL DEFAULT 0,
  total_cents           bigint NOT NULL DEFAULT 0,
  processing_fee_cents  bigint NOT NULL DEFAULT 0,
  refunded_cents        bigint NOT NULL DEFAULT 0,
  currency              text NOT NULL DEFAULT 'USD',
  synced_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ms_payments_created_idx ON public.ms_payments (sq_created_at);
CREATE INDEX ms_payments_order_idx ON public.ms_payments (order_id);

-- ─── Menu (Catalog), customers, team ───────────────────────────────────────
CREATE TABLE public.ms_catalog_items (
  id             text PRIMARY KEY,
  name           text NOT NULL,
  description    text,
  category_id    text,
  category_name  text,
  is_deleted     boolean NOT NULL DEFAULT false,
  sq_updated_at  timestamptz,
  synced_at      timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.ms_catalog_variations (
  id             text PRIMARY KEY,
  item_id        text NOT NULL REFERENCES public.ms_catalog_items(id) ON DELETE CASCADE,
  name           text,
  price_cents    bigint,
  is_deleted     boolean NOT NULL DEFAULT false,
  synced_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ms_customers (
  id             text PRIMARY KEY,
  given_name     text,
  family_name    text,
  company_name   text,
  email          text,
  phone          text,
  sq_created_at  timestamptz,
  sq_updated_at  timestamptz,
  is_deleted     boolean NOT NULL DEFAULT false,
  synced_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ms_team_members (
  id             text PRIMARY KEY,
  given_name     text,
  family_name    text,
  email          text,
  phone          text,
  status         text,
  is_owner       boolean NOT NULL DEFAULT false,
  synced_at      timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ms_team_members IS 'Square team list. Wages are never synced.';

-- ─── RLS: owner only (tokens: nobody but service role) ─────────────────────
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ms_square_connection','ms_square_locations','ms_square_webhook_events',
                           'ms_sync_runs','ms_orders','ms_order_lines','ms_payments','ms_catalog_items',
                           'ms_catalog_variations','ms_customers','ms_team_members'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', t);
    -- Writes come from the server's sync (service role). The owner only reads.
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.%I FROM authenticated', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.ms_is_owner())',
                   t || '_owner_read', t);
  END LOOP;
END $$;

ALTER TABLE public.ms_square_tokens ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_square_tokens FROM anon, authenticated;

INSERT INTO public.ms_table_classes VALUES
  ('ms_square_connection',     'owner_only',   'connection status, no secrets'),
  ('ms_square_tokens',         'service_only', 'encrypted OAuth tokens'),
  ('ms_square_locations',      'owner_only',   NULL),
  ('ms_square_webhook_events', 'owner_only',   'webhook de-dupe log'),
  ('ms_sync_runs',             'owner_only',   NULL),
  ('ms_orders',                'money',        NULL),
  ('ms_order_lines',           'money',        NULL),
  ('ms_payments',              'money',        'includes processing fees'),
  ('ms_catalog_items',         'owner_only',   'crew gets names via ms_crew_menu()'),
  ('ms_catalog_variations',    'money',        'menu prices'),
  ('ms_customers',             'owner_only',   'customer contact details'),
  ('ms_team_members',          'owner_only',   NULL);

-- ─── Crew-safe menu: names only, no prices (long-tree "no money" pattern) ───
CREATE OR REPLACE FUNCTION public.ms_crew_menu()
RETURNS TABLE (item_name text, variation_name text, category_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT i.name, v.name, i.category_name
  FROM public.ms_catalog_items i
  LEFT JOIN public.ms_catalog_variations v ON v.item_id = i.id AND NOT v.is_deleted
  WHERE public.ms_is_member() AND NOT i.is_deleted
  ORDER BY i.category_name NULLS LAST, i.name, v.name
$$;
REVOKE ALL ON FUNCTION public.ms_crew_menu() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_crew_menu() TO authenticated;

-- ─── Owner daily sales ──────────────────────────────────────────────────────
-- Day buckets use the business time zone (Abilene, TX is US Central).
CREATE OR REPLACE FUNCTION public.ms_daily_sales(p_from date, p_to date, p_tz text DEFAULT 'America/Chicago')
RETURNS TABLE (
  day date, orders bigint, gross_sales_cents bigint, discount_cents bigint, returns_cents bigint,
  net_sales_cents bigint, tax_cents bigint, tip_cents bigint, fee_cents bigint,
  card_cents bigint, cash_cents bigint, other_cents bigint, refunded_cents bigint, items_sold numeric
)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.ms_is_owner() THEN
    RAISE EXCEPTION 'owner only' USING ERRCODE = '42501';
  END IF;
  IF p_to < p_from OR p_to - p_from > 400 THEN
    RAISE EXCEPTION 'date range must be 0 to 400 days';
  END IF;
  RETURN QUERY
  WITH days AS (
    SELECT d::date AS day FROM generate_series(p_from, p_to, interval '1 day') d
  ), o AS (
    SELECT (coalesce(x.closed_at, x.sq_created_at) AT TIME ZONE p_tz)::date AS day,
           count(*) AS orders,
           sum(x.gross_sales_cents) AS gross, sum(x.discount_cents) AS disc,
           sum(x.returns_cents) AS ret, sum(x.tax_cents) AS tax
    FROM public.ms_orders x
    WHERE x.state = 'COMPLETED'
      AND (coalesce(x.closed_at, x.sq_created_at) AT TIME ZONE p_tz)::date BETWEEN p_from AND p_to
    GROUP BY 1
  ), l AS (
    SELECT (coalesce(x.closed_at, x.sq_created_at) AT TIME ZONE p_tz)::date AS day, sum(ol.quantity) AS qty
    FROM public.ms_orders x JOIN public.ms_order_lines ol ON ol.order_id = x.id
    WHERE x.state = 'COMPLETED'
      AND (coalesce(x.closed_at, x.sq_created_at) AT TIME ZONE p_tz)::date BETWEEN p_from AND p_to
    GROUP BY 1
  ), p AS (
    SELECT (y.sq_created_at AT TIME ZONE p_tz)::date AS day,
           sum(y.tip_cents) AS tips, sum(y.processing_fee_cents) AS fees,
           sum(y.total_cents) FILTER (WHERE y.source_type IN ('CARD', 'WALLET', 'SQUARE_ACCOUNT', 'CASH_APP')) AS card,
           sum(y.total_cents) FILTER (WHERE y.source_type = 'CASH') AS cash,
           sum(y.total_cents) FILTER (WHERE y.source_type IS NULL
                                       OR y.source_type NOT IN ('CARD', 'WALLET', 'SQUARE_ACCOUNT', 'CASH_APP', 'CASH')) AS other,
           sum(y.refunded_cents) AS refunded
    FROM public.ms_payments y
    WHERE y.status = 'COMPLETED'
      AND (y.sq_created_at AT TIME ZONE p_tz)::date BETWEEN p_from AND p_to
    GROUP BY 1
  )
  SELECT d.day,
         coalesce(o.orders, 0)::bigint,
         coalesce(o.gross, 0)::bigint,
         coalesce(o.disc, 0)::bigint,
         coalesce(o.ret, 0)::bigint,
         (coalesce(o.gross, 0) - coalesce(o.disc, 0) - coalesce(o.ret, 0))::bigint,
         coalesce(o.tax, 0)::bigint,
         coalesce(p.tips, 0)::bigint,
         coalesce(p.fees, 0)::bigint,
         coalesce(p.card, 0)::bigint,
         coalesce(p.cash, 0)::bigint,
         coalesce(p.other, 0)::bigint,
         coalesce(p.refunded, 0)::bigint,
         coalesce(l.qty, 0)
  FROM days d
  LEFT JOIN o ON o.day = d.day
  LEFT JOIN p ON p.day = d.day
  LEFT JOIN l ON l.day = d.day
  ORDER BY d.day DESC;
END $$;
REVOKE ALL ON FUNCTION public.ms_daily_sales(date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_daily_sales(date, date, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.ms_item_sales(p_from date, p_to date, p_tz text DEFAULT 'America/Chicago')
RETURNS TABLE (item_name text, variation_name text, quantity numeric, gross_sales_cents bigint, net_cents bigint)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
BEGIN
  IF NOT public.ms_is_owner() THEN
    RAISE EXCEPTION 'owner only' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT coalesce(ol.name, '(unnamed)'), ol.variation_name, sum(ol.quantity),
         sum(ol.gross_sales_cents)::bigint, sum(ol.gross_sales_cents - ol.discount_cents)::bigint
  FROM public.ms_orders x JOIN public.ms_order_lines ol ON ol.order_id = x.id
  WHERE x.state = 'COMPLETED'
    AND (coalesce(x.closed_at, x.sq_created_at) AT TIME ZONE p_tz)::date BETWEEN p_from AND p_to
  GROUP BY 1, 2
  ORDER BY 4 DESC;
END $$;
REVOKE ALL ON FUNCTION public.ms_item_sales(date, date, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_item_sales(date, date, text) TO authenticated;

-- Audit connection changes (never the tokens).
CREATE OR REPLACE FUNCTION ms_private.audit_square_connection()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' OR NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.ms_audit_log(action, table_name, row_id, detail)
    VALUES ('square_' || NEW.status, 'ms_square_connection', '1',
            jsonb_build_object('environment', NEW.environment, 'merchant_id', NEW.merchant_id));
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER ms_square_connection_audit AFTER INSERT OR UPDATE ON public.ms_square_connection
  FOR EACH ROW EXECUTE FUNCTION ms_private.audit_square_connection();
