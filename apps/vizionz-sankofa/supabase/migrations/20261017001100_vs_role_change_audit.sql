-- VIZIONZ SANKOFA · Role-change audit
-- Every change to a staff account's role, access role or revoked state
-- writes a ROLE_CHANGE row (who, whose account, from, to) to vs_audit_log.

ALTER TABLE public.vs_audit_log DROP CONSTRAINT IF EXISTS vs_audit_log_action_check;
ALTER TABLE public.vs_audit_log ADD CONSTRAINT vs_audit_log_action_check CHECK (action IN (
  'INSERT', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'INTELLIGENCE_QUERY', 'REVEAL_SENSITIVE', 'LOGIN',
  'ROLE_CHANGE'));

CREATE OR REPLACE FUNCTION vs_private.audit_role_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.role IS DISTINCT FROM OLD.role
     OR NEW.access_role IS DISTINCT FROM OLD.access_role
     OR (NEW.revoked_at IS NULL) <> (OLD.revoked_at IS NULL) THEN
    INSERT INTO public.vs_audit_log
      (actor_email, actor_user_id, actor_role, action, table_name, record_id, details)
    VALUES (vs_private.audit_actor_email(), auth.uid(), public.vs_current_access_role(),
      'ROLE_CHANGE', 'vs_operators', NEW.user_id::text, jsonb_build_object(
        'email', NEW.email,
        'from', CASE WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('role', OLD.role,
                  'access_role', OLD.access_role, 'revoked', OLD.revoked_at IS NOT NULL) END,
        'to', jsonb_build_object('role', NEW.role, 'access_role', NEW.access_role,
                'revoked', NEW.revoked_at IS NOT NULL),
        'via_invite', nullif(current_setting('vs.invite_accept', true), '')));
  END IF;
  RETURN NULL;
END $$;

DROP TRIGGER IF EXISTS vs_role_change_audit ON public.vs_operators;
CREATE TRIGGER vs_role_change_audit AFTER INSERT OR UPDATE ON public.vs_operators
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_role_change();
