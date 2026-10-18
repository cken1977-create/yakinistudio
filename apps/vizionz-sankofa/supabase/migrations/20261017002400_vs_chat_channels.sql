-- VIZIONZ SANKOFA · Inter-office chat: channels and members (chat 1 of 3)
-- Fully in-house. Only active VS staff (a non-pending vs_operators row with an
-- access role) can see chat. Office channels are open to all active staff;
-- direct messages (kind 'dm') are visible only to their two members and are
-- created only through vs_chat_open_dm(). Idempotent; paste as one file.

CREATE OR REPLACE FUNCTION public.vs_chat_active()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.vs_current_access_role() IS NOT NULL
$$;
REVOKE ALL ON FUNCTION public.vs_chat_active() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_chat_active() TO authenticated;

CREATE TABLE IF NOT EXISTS public.vs_chat_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL DEFAULT 'channel' CHECK (kind IN ('channel', 'dm')),
  slug text,
  name text,
  topic text,
  dm_key text,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT vs_chat_channels_shape CHECK (
    (kind = 'channel' AND nullif(btrim(name), '') IS NOT NULL AND slug ~ '^[a-z0-9][a-z0-9-]{0,40}$' AND dm_key IS NULL)
    OR (kind = 'dm' AND dm_key IS NOT NULL AND slug IS NULL))
);
CREATE UNIQUE INDEX IF NOT EXISTS vs_chat_channels_slug ON public.vs_chat_channels (slug) WHERE slug IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vs_chat_channels_dm_key ON public.vs_chat_channels (dm_key) WHERE dm_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.vs_chat_members (
  channel_id uuid NOT NULL REFERENCES public.vs_chat_channels(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.vs_operators(user_id) ON DELETE CASCADE,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz NOT NULL DEFAULT now(),
  muted boolean NOT NULL DEFAULT false,
  PRIMARY KEY (channel_id, user_id)
);
CREATE INDEX IF NOT EXISTS vs_chat_members_user ON public.vs_chat_members (user_id);

-- Can the signed-in person see this channel (and so its messages and files)?
CREATE OR REPLACE FUNCTION public.vs_chat_can_see(p_channel uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.vs_chat_active() AND EXISTS (
    SELECT 1 FROM public.vs_chat_channels c WHERE c.id = p_channel AND (
      c.kind = 'channel'
      OR EXISTS (SELECT 1 FROM public.vs_chat_members m WHERE m.channel_id = c.id AND m.user_id = auth.uid())))
$$;
-- Can they post there? Visible, not archived; DMs need membership (implied by visibility).
CREATE OR REPLACE FUNCTION public.vs_chat_can_post(p_channel uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT public.vs_chat_can_see(p_channel)
     AND EXISTS (SELECT 1 FROM public.vs_chat_channels c WHERE c.id = p_channel AND c.archived_at IS NULL)
$$;
REVOKE ALL ON FUNCTION public.vs_chat_can_see(uuid), public.vs_chat_can_post(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_chat_can_see(uuid), public.vs_chat_can_post(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION vs_private.chat_channel_stamp() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := coalesce(auth.uid(), NEW.created_by);
  ELSE
    NEW.kind := OLD.kind; NEW.dm_key := OLD.dm_key; NEW.created_by := OLD.created_by; NEW.created_at := OLD.created_at;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_chat_channel_stamp ON public.vs_chat_channels;
CREATE TRIGGER vs_chat_channel_stamp BEFORE INSERT OR UPDATE ON public.vs_chat_channels
  FOR EACH ROW EXECUTE FUNCTION vs_private.chat_channel_stamp();

ALTER TABLE public.vs_chat_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_chat_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vs_chat_channels_select ON public.vs_chat_channels;
CREATE POLICY vs_chat_channels_select ON public.vs_chat_channels FOR SELECT TO authenticated
  USING (public.vs_chat_can_see(id));
DROP POLICY IF EXISTS vs_chat_channels_insert ON public.vs_chat_channels;
CREATE POLICY vs_chat_channels_insert ON public.vs_chat_channels FOR INSERT TO authenticated
  WITH CHECK (kind = 'channel' AND public.vs_has_role('executive', 'operator'));
DROP POLICY IF EXISTS vs_chat_channels_update ON public.vs_chat_channels;
CREATE POLICY vs_chat_channels_update ON public.vs_chat_channels FOR UPDATE TO authenticated
  USING (kind = 'channel' AND public.vs_has_role('executive', 'operator'))
  WITH CHECK (kind = 'channel' AND public.vs_has_role('executive', 'operator'));

DROP POLICY IF EXISTS vs_chat_members_select ON public.vs_chat_members;
CREATE POLICY vs_chat_members_select ON public.vs_chat_members FOR SELECT TO authenticated
  USING (public.vs_chat_can_see(channel_id));
DROP POLICY IF EXISTS vs_chat_members_insert ON public.vs_chat_members;
CREATE POLICY vs_chat_members_insert ON public.vs_chat_members FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.vs_chat_channels c WHERE c.id = channel_id AND c.kind = 'channel' AND c.archived_at IS NULL)
  AND public.vs_chat_active()
  AND (user_id = auth.uid() OR public.vs_has_role('executive', 'operator')));
DROP POLICY IF EXISTS vs_chat_members_update ON public.vs_chat_members;
CREATE POLICY vs_chat_members_update ON public.vs_chat_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS vs_chat_members_delete ON public.vs_chat_members;
CREATE POLICY vs_chat_members_delete ON public.vs_chat_members FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.vs_chat_channels c WHERE c.id = channel_id AND c.kind = 'channel')
  AND (user_id = auth.uid() OR public.vs_has_role('executive', 'operator')));

REVOKE ALL ON public.vs_chat_channels, public.vs_chat_members FROM anon, authenticated;
GRANT SELECT, INSERT ON public.vs_chat_channels TO authenticated;
GRANT UPDATE (name, topic, archived_at) ON public.vs_chat_channels TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vs_chat_members TO authenticated;
GRANT UPDATE (last_read_at, muted) ON public.vs_chat_members TO authenticated;

DROP TRIGGER IF EXISTS vs_audit ON public.vs_chat_channels;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_chat_channels
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
-- Joins and leaves are audited; read markers are not (they change constantly).
DROP TRIGGER IF EXISTS vs_audit ON public.vs_chat_members;
CREATE TRIGGER vs_audit AFTER INSERT OR DELETE ON public.vs_chat_members
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

INSERT INTO public.vs_chat_channels (kind, slug, name, topic)
VALUES ('channel', 'office', 'Office', 'Everyday coordination for the VS team. No client details here.')
ON CONFLICT DO NOTHING;
