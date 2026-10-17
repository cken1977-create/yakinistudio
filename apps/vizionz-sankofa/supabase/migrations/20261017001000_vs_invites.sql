-- VIZIONZ SANKOFA · Staff invites with the access role chosen up front
-- An executive/operator invites an email with a role. When that person
-- signs in with the magic link, vs_accept_invite() gives them the role.

CREATE TABLE IF NOT EXISTS public.vs_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL CHECK (email = lower(btrim(email)) AND email LIKE '%_@_%'),
  display_name text,
  access_role text NOT NULL
    CHECK (access_role IN ('executive', 'operator', 'case_manager', 'leadership_readonly')),
  staff_id uuid REFERENCES public.staff(id) ON DELETE SET NULL,
  invited_by uuid DEFAULT auth.uid(),
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  accepted_user_id uuid,
  revoked_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS vs_invites_open_email ON public.vs_invites (email)
  WHERE accepted_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.vs_invites ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_invites FROM anon;
REVOKE DELETE, TRUNCATE ON public.vs_invites FROM authenticated;
DROP POLICY IF EXISTS vs_invites_manage ON public.vs_invites;
CREATE POLICY vs_invites_manage ON public.vs_invites FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator'))
  WITH CHECK (public.vs_has_role('executive', 'operator'));

DROP TRIGGER IF EXISTS vs_audit ON public.vs_invites;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_invites
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- The access_role guard also lets an open invite apply its own role.
CREATE OR REPLACE FUNCTION vs_private.guard_access_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NEW.access_role IS DISTINCT FROM OLD.access_role
     AND auth.uid() IS NOT NULL
     AND NOT public.vs_has_role('operator', 'executive')
     AND NOT EXISTS (SELECT 1 FROM public.vs_invites i
       WHERE i.id::text = current_setting('vs.invite_accept', true)
         AND i.email = lower(NEW.email) AND i.access_role = NEW.access_role
         AND i.accepted_at IS NULL AND i.revoked_at IS NULL) THEN
    RAISE EXCEPTION 'Only an operator or executive can change access_role';
  END IF;
  RETURN NEW;
END $$;

-- Called by the app right after magic-link sign-in. Uses only the signed-in
-- user's own id and email. Returns the role granted, or NULL.
CREATE OR REPLACE FUNCTION public.vs_accept_invite()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE
  i public.vs_invites%ROWTYPE;
  v_email text := lower(nullif(auth.jwt()->>'email', ''));
BEGIN
  IF auth.uid() IS NULL OR v_email IS NULL THEN RETURN NULL; END IF;
  SELECT * INTO i FROM public.vs_invites
   WHERE email = v_email AND accepted_at IS NULL AND revoked_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RETURN NULL; END IF;
  IF EXISTS (SELECT 1 FROM public.vs_operators
             WHERE user_id = auth.uid() AND revoked_at IS NOT NULL) THEN
    RETURN NULL;  -- revoked accounts are restored by an operator, not an invite
  END IF;

  PERFORM set_config('vs.invite_accept', i.id::text, true);
  INSERT INTO public.vs_operators
    (user_id, email, display_name, role, access_role, invited_by, invited_at, activated_at)
  VALUES (auth.uid(), v_email, i.display_name,
    (CASE WHEN i.access_role IN ('executive', 'operator') THEN 'operator' ELSE 'employee' END)::public.vs_operator_role,
    i.access_role, i.invited_by, i.invited_at, now())
  ON CONFLICT (user_id) DO UPDATE SET
    role = EXCLUDED.role, access_role = EXCLUDED.access_role,
    display_name = coalesce(public.vs_operators.display_name, EXCLUDED.display_name),
    activated_at = coalesce(public.vs_operators.activated_at, now());
  IF i.staff_id IS NOT NULL THEN
    UPDATE public.staff SET auth_user_id = auth.uid()
     WHERE id = i.staff_id AND auth_user_id IS NULL;
  END IF;
  UPDATE public.vs_invites SET accepted_at = now(), accepted_user_id = auth.uid() WHERE id = i.id;
  PERFORM set_config('vs.invite_accept', '', true);
  RETURN i.access_role;
END $$;
REVOKE ALL ON FUNCTION public.vs_accept_invite() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_accept_invite() TO authenticated;
