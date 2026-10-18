-- VIZIONZ SANKOFA · Inter-office chat: DMs, unread, edit/delete, Realtime (chat 3 of 3)
-- Idempotent; paste as one file.

-- Open (or reuse) the direct-message conversation with another active staff member.
CREATE OR REPLACE FUNCTION public.vs_chat_open_dm(p_other uuid)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE me uuid := auth.uid(); k text; cid uuid;
BEGIN
  IF NOT public.vs_chat_active() THEN RAISE EXCEPTION 'chat is for active VS staff' USING ERRCODE = '42501'; END IF;
  IF p_other IS NULL OR p_other = me OR NOT EXISTS (
    SELECT 1 FROM public.vs_operators o WHERE o.user_id = p_other AND o.revoked_at IS NULL AND o.role <> 'pending' AND o.access_role IS NOT NULL) THEN
    RAISE EXCEPTION 'pick an active staff member' USING ERRCODE = '22023';
  END IF;
  k := least(me::text, p_other::text) || ':' || greatest(me::text, p_other::text);
  INSERT INTO public.vs_chat_channels (kind, dm_key) VALUES ('dm', k) ON CONFLICT DO NOTHING;
  SELECT id INTO cid FROM public.vs_chat_channels WHERE dm_key = k;
  INSERT INTO public.vs_chat_members (channel_id, user_id) VALUES (cid, me), (cid, p_other) ON CONFLICT DO NOTHING;
  RETURN cid;
END $$;

-- Mark a conversation read (joins an office channel the first time).
CREATE OR REPLACE FUNCTION public.vs_chat_mark_read(p_channel uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  IF NOT public.vs_chat_can_see(p_channel) THEN RAISE EXCEPTION 'not your conversation' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.vs_chat_members (channel_id, user_id) VALUES (p_channel, auth.uid())
  ON CONFLICT (channel_id, user_id) DO UPDATE SET last_read_at = now();
END $$;

-- Unread and @mention counts per conversation for the signed-in person (RLS applies).
CREATE OR REPLACE FUNCTION public.vs_chat_unread()
RETURNS TABLE (channel_id uuid, unread integer, mentions integer)
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT c.id,
         (count(m.id) FILTER (WHERE mem.user_id IS NOT NULL))::int,
         (count(m.id) FILTER (WHERE auth.uid() = ANY (m.mentions)))::int
  FROM public.vs_chat_channels c
  LEFT JOIN public.vs_chat_members mem ON mem.channel_id = c.id AND mem.user_id = auth.uid()
  JOIN public.vs_chat_messages m ON m.channel_id = c.id AND m.deleted_at IS NULL
       AND m.author_id IS DISTINCT FROM auth.uid() AND m.created_at > coalesce(mem.last_read_at, '-infinity'::timestamptz)
  WHERE c.archived_at IS NULL AND (mem.user_id IS NOT NULL OR c.kind = 'channel')
  GROUP BY c.id
$$;

CREATE OR REPLACE FUNCTION public.vs_chat_edit_message(p_message uuid, p_body text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.vs_chat_messages;
BEGIN
  SELECT * INTO m FROM public.vs_chat_messages WHERE id = p_message;
  IF m.id IS NULL OR m.deleted_at IS NOT NULL OR m.author_id IS DISTINCT FROM auth.uid() OR NOT public.vs_chat_can_post(m.channel_id) THEN
    RAISE EXCEPTION 'you can only edit your own messages' USING ERRCODE = '42501';
  END IF;
  IF (nullif(btrim(p_body), '') IS NULL AND m.attachment_path IS NULL) OR length(p_body) > 4000 THEN
    RAISE EXCEPTION 'message is empty or too long' USING ERRCODE = '22023';
  END IF;
  UPDATE public.vs_chat_messages SET body = p_body, edited_at = now() WHERE id = p_message;
END $$;

-- Delete = blank in place. The audit row (UPDATE, with before_json) keeps the original.
-- Returns the file path, if any, so the app can remove the stored file.
CREATE OR REPLACE FUNCTION public.vs_chat_delete_message(p_message uuid)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE m public.vs_chat_messages;
BEGIN
  SELECT * INTO m FROM public.vs_chat_messages WHERE id = p_message;
  IF m.id IS NULL OR m.deleted_at IS NOT NULL OR NOT public.vs_chat_can_see(m.channel_id)
     OR NOT (coalesce(m.author_id = auth.uid(), false) OR public.vs_has_role('executive', 'operator')) THEN
    RAISE EXCEPTION 'you can only delete your own messages' USING ERRCODE = '42501';
  END IF;
  UPDATE public.vs_chat_messages
     SET body = '', mentions = '{}', attachment_path = NULL, attachment_name = NULL, attachment_size = NULL,
         attachment_mime = NULL, deleted_at = now(), deleted_by = auth.uid()
   WHERE id = p_message;
  RETURN m.attachment_path;
END $$;

REVOKE ALL ON FUNCTION public.vs_chat_open_dm(uuid), public.vs_chat_mark_read(uuid), public.vs_chat_unread(),
  public.vs_chat_edit_message(uuid, text), public.vs_chat_delete_message(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_chat_open_dm(uuid), public.vs_chat_mark_read(uuid), public.vs_chat_unread(),
  public.vs_chat_edit_message(uuid, text), public.vs_chat_delete_message(uuid) TO authenticated;

-- Live updates over Supabase Realtime (which applies the RLS above per subscriber).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (SELECT 1 FROM pg_publication_tables
                     WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'vs_chat_messages') THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.vs_chat_messages';
  ELSE
    RAISE NOTICE 'supabase_realtime publication missing or already has vs_chat_messages';
  END IF;
END $$;
