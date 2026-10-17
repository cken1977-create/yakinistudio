-- VIZIONZ SANKOFA · Self-service profile + operator activity
-- Anyone signed in can change their own display name and mark themselves
-- active; executives/operators see per-person activity from the audit log.

CREATE OR REPLACE FUNCTION public.vs_update_my_profile(p_display_name text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'must be signed in'; END IF;
  UPDATE public.vs_operators SET display_name = nullif(left(btrim(p_display_name), 80), '')
   WHERE user_id = auth.uid();
END $$;

CREATE OR REPLACE FUNCTION public.vs_touch_last_active()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = '' AS $$
  UPDATE public.vs_operators SET last_active_at = now() WHERE user_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.vs_update_my_profile(text), public.vs_touch_last_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_update_my_profile(text), public.vs_touch_last_active() TO authenticated;

-- Last 30 days per person. security_invoker: the audit log's own RLS
-- applies, so only executives and operators get rows.
CREATE OR REPLACE VIEW public.vs_operator_activity WITH (security_invoker = true) AS
SELECT actor_user_id,
       max(actor_email) AS actor_email,
       count(*) FILTER (WHERE occurred_at > now() - interval '7 days') AS actions_7d,
       count(*) AS actions_30d,
       count(*) FILTER (WHERE action = 'INSERT' AND table_name IN ('case_notes', 'services_delivered')) AS contacts_30d,
       count(*) FILTER (WHERE action = 'INTELLIGENCE_QUERY') AS questions_30d,
       count(*) FILTER (WHERE action = 'EXPORT') AS exports_30d,
       max(occurred_at) AS last_action_at
FROM public.vs_audit_log
WHERE occurred_at > now() - interval '30 days' AND actor_user_id IS NOT NULL
GROUP BY actor_user_id;
REVOKE ALL ON public.vs_operator_activity FROM anon;
GRANT SELECT ON public.vs_operator_activity TO authenticated;
