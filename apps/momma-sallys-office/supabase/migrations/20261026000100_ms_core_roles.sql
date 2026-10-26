-- MOMMA SALLY'S OFFICE · 1/3 · Members, roles, audit
--
-- Two roles only (Clarence, Oct 25 2026):
--   owner  Nicole. Everything, including all money data.
--   crew   Staff. Sees their own login row and the crew-safe RPCs only.
--          No table that holds money (sales, fees, prices, receipts, costs)
--          has any policy that crew can match. Deny by default.
--
-- Patterns ported from apps/vizionz-sankofa (SECURITY DEFINER role helpers
-- with a pinned search_path, invite-by-email accepted on first sign-in,
-- audit trail) and from long-tree-demo (crew gets purpose-built reads that
-- carry no money columns instead of row access to money tables).
--
-- Designed for a dedicated Supabase project for Momma Sally's. NOT APPLIED
-- to any live database. Apply only with Clarence's OK.

CREATE SCHEMA IF NOT EXISTS ms_private;
REVOKE ALL ON SCHEMA ms_private FROM PUBLIC;
DO $$ BEGIN
  EXECUTE 'REVOKE ALL ON SCHEMA ms_private FROM anon, authenticated';
EXCEPTION WHEN undefined_object THEN NULL; END $$;

-- ─── Members ────────────────────────────────────────────────────────────────
CREATE TABLE public.ms_members (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  email         text NOT NULL UNIQUE CHECK (email = lower(btrim(email)) AND email LIKE '%@%'),
  display_name  text,
  role          text NOT NULL CHECK (role IN ('owner', 'crew')),
  invited_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz,
  revoked_at    timestamptz,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
COMMENT ON TABLE public.ms_members IS
  'Office logins. role = owner | crew. A row with user_id NULL is an invite waiting for first sign-in.';

-- ─── Role helpers ───────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.ms_current_role()
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.role FROM public.ms_members m
  WHERE m.user_id = auth.uid() AND m.revoked_at IS NULL
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.ms_is_owner()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT coalesce(public.ms_current_role() = 'owner', false)
$$;

CREATE OR REPLACE FUNCTION public.ms_is_member()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.ms_current_role() IS NOT NULL
$$;

REVOKE ALL ON FUNCTION public.ms_current_role(), public.ms_is_owner(), public.ms_is_member() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_current_role(), public.ms_is_owner(), public.ms_is_member() TO authenticated;

-- First sign-in: link the auth user to the invite row with the same VERIFIED email.
CREATE OR REPLACE FUNCTION public.ms_accept_invite()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  v_email text;
  v_role  text;
BEGIN
  IF auth.uid() IS NULL THEN RETURN NULL; END IF;
  SELECT lower(u.email) INTO v_email FROM auth.users u
   WHERE u.id = auth.uid() AND u.email_confirmed_at IS NOT NULL;
  IF v_email IS NULL THEN RETURN NULL; END IF;
  UPDATE public.ms_members m
     SET user_id = auth.uid(), activated_at = coalesce(m.activated_at, now()), updated_at = now()
   WHERE m.email = v_email AND m.user_id IS NULL AND m.revoked_at IS NULL
  RETURNING m.role INTO v_role;
  RETURN coalesce(v_role, public.ms_current_role());
END $$;
REVOKE ALL ON FUNCTION public.ms_accept_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_accept_invite() TO authenticated;

-- Who am I (safe for any signed-in user; returns nothing for non-members).
CREATE OR REPLACE FUNCTION public.ms_me()
RETURNS TABLE (member_id uuid, email text, display_name text, role text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT m.id, m.email, m.display_name, m.role FROM public.ms_members m
  WHERE m.user_id = auth.uid() AND m.revoked_at IS NULL
$$;
REVOKE ALL ON FUNCTION public.ms_me() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ms_me() TO authenticated;

ALTER TABLE public.ms_members ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_members FROM anon;
CREATE POLICY ms_members_owner_all ON public.ms_members FOR ALL TO authenticated
  USING (public.ms_is_owner()) WITH CHECK (public.ms_is_owner());
CREATE POLICY ms_members_self_read ON public.ms_members FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- An owner can't lock everyone out: the last active owner can't be demoted or revoked.
CREATE OR REPLACE FUNCTION ms_private.keep_one_owner()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF (TG_OP = 'DELETE' AND OLD.role = 'owner' AND OLD.revoked_at IS NULL)
     OR (TG_OP = 'UPDATE' AND OLD.role = 'owner' AND OLD.revoked_at IS NULL
         AND (NEW.role <> 'owner' OR NEW.revoked_at IS NOT NULL)) THEN
    IF NOT EXISTS (SELECT 1 FROM public.ms_members m
                    WHERE m.role = 'owner' AND m.revoked_at IS NULL AND m.id <> OLD.id) THEN
      RAISE EXCEPTION 'At least one active owner must remain';
    END IF;
  END IF;
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER ms_members_keep_one_owner BEFORE UPDATE OR DELETE ON public.ms_members
  FOR EACH ROW EXECUTE FUNCTION ms_private.keep_one_owner();

-- ─── Audit log (owner reads; written only by triggers / definer functions) ──
CREATE TABLE public.ms_audit_log (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  at          timestamptz NOT NULL DEFAULT now(),
  actor       uuid DEFAULT auth.uid(),
  action      text NOT NULL,
  table_name  text,
  row_id      text,
  detail      jsonb NOT NULL DEFAULT '{}'::jsonb
);
ALTER TABLE public.ms_audit_log ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_audit_log FROM anon, authenticated;
GRANT SELECT ON public.ms_audit_log TO authenticated;
CREATE POLICY ms_audit_owner_read ON public.ms_audit_log FOR SELECT TO authenticated
  USING (public.ms_is_owner());

CREATE OR REPLACE FUNCTION ms_private.audit_members()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.ms_audit_log(action, table_name, row_id, detail)
  VALUES (lower(TG_OP), 'ms_members', coalesce(NEW.id, OLD.id)::text,
          jsonb_build_object('email', coalesce(NEW.email, OLD.email),
                             'role_before', CASE WHEN TG_OP <> 'INSERT' THEN OLD.role END,
                             'role_after',  CASE WHEN TG_OP <> 'DELETE' THEN NEW.role END,
                             'revoked', CASE WHEN TG_OP <> 'DELETE' THEN NEW.revoked_at IS NOT NULL END));
  RETURN coalesce(NEW, OLD);
END $$;
CREATE TRIGGER ms_members_audit AFTER INSERT OR UPDATE OR DELETE ON public.ms_members
  FOR EACH ROW EXECUTE FUNCTION ms_private.audit_members();

CREATE OR REPLACE FUNCTION ms_private.touch_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER ms_members_touch BEFORE UPDATE ON public.ms_members
  FOR EACH ROW EXECUTE FUNCTION ms_private.touch_updated_at();

-- ─── Money-table registry ───────────────────────────────────────────────────
-- Every table in public must be listed here. The RLS test suite fails if a
-- table is missing, so a new table can't ship without someone deciding
-- whether crew may see it.
CREATE TABLE public.ms_table_classes (
  table_name text PRIMARY KEY,
  class      text NOT NULL CHECK (class IN ('money', 'owner_only', 'service_only', 'members')),
  note       text
);
ALTER TABLE public.ms_table_classes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.ms_table_classes FROM anon, authenticated;
INSERT INTO public.ms_table_classes VALUES
  ('ms_members',       'members',      'crew reads own row only'),
  ('ms_audit_log',     'owner_only',   'who did what'),
  ('ms_table_classes', 'service_only', 'this registry');
