-- VIZIONZ SANKOFA · Inter-office chat: messages and files (chat 2 of 3)
-- Staff can only add messages. Editing and deleting go through
-- vs_chat_edit_message / vs_chat_delete_message (next file); a delete blanks the
-- message in place, and the audit log keeps what it said (append-only).
-- Files live in the private vs-chat-files bucket under <channel_id>/...
-- Idempotent; paste as one file.

CREATE TABLE IF NOT EXISTS public.vs_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid NOT NULL REFERENCES public.vs_chat_channels(id) ON DELETE CASCADE,
  author_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 4000),
  mentions uuid[] NOT NULL DEFAULT '{}',
  attachment_path text,
  attachment_name text,
  attachment_size bigint,
  attachment_mime text,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  CONSTRAINT vs_chat_messages_content CHECK (deleted_at IS NOT NULL OR btrim(body) <> '' OR attachment_path IS NOT NULL),
  CONSTRAINT vs_chat_messages_path CHECK (attachment_path IS NULL OR attachment_path LIKE channel_id::text || '/%')
);
CREATE INDEX IF NOT EXISTS vs_chat_messages_channel ON public.vs_chat_messages (channel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS vs_chat_messages_mentions ON public.vs_chat_messages USING gin (mentions);

-- Who wrote it is decided by the database; mentions are limited to active staff.
CREATE OR REPLACE FUNCTION vs_private.chat_message_stamp() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  NEW.author_id := auth.uid();
  SELECT coalesce(nullif(btrim(o.display_name), ''), split_part(o.email, '@', 1)) INTO NEW.author_name
    FROM public.vs_operators o WHERE o.user_id = auth.uid();
  NEW.created_at := now(); NEW.edited_at := NULL; NEW.deleted_at := NULL; NEW.deleted_by := NULL;
  NEW.mentions := coalesce(ARRAY(
    SELECT DISTINCT o.user_id FROM public.vs_operators o
    WHERE o.user_id = ANY (NEW.mentions) AND o.revoked_at IS NULL AND o.role <> 'pending' AND o.access_role IS NOT NULL
    LIMIT 50), '{}');
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_chat_message_stamp ON public.vs_chat_messages;
CREATE TRIGGER vs_chat_message_stamp BEFORE INSERT ON public.vs_chat_messages
  FOR EACH ROW EXECUTE FUNCTION vs_private.chat_message_stamp();

ALTER TABLE public.vs_chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS vs_chat_messages_select ON public.vs_chat_messages;
CREATE POLICY vs_chat_messages_select ON public.vs_chat_messages FOR SELECT TO authenticated
  USING (public.vs_chat_can_see(channel_id));
DROP POLICY IF EXISTS vs_chat_messages_insert ON public.vs_chat_messages;
CREATE POLICY vs_chat_messages_insert ON public.vs_chat_messages FOR INSERT TO authenticated
  WITH CHECK (public.vs_chat_can_post(channel_id));

REVOKE ALL ON public.vs_chat_messages FROM anon, authenticated;
GRANT SELECT, INSERT ON public.vs_chat_messages TO authenticated;

DROP TRIGGER IF EXISTS vs_audit ON public.vs_chat_messages;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_chat_messages
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

CREATE OR REPLACE FUNCTION public.vs_chat_path_ok(p_name text, p_write boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id text := split_part(p_name, '/', 1);
BEGIN
  IF v_id !~ '^[0-9a-fA-F-]{36}$' OR split_part(p_name, '/', 2) = '' THEN RETURN false; END IF;
  IF p_write THEN RETURN public.vs_chat_can_post(v_id::uuid); END IF;
  RETURN public.vs_chat_can_see(v_id::uuid);
END $$;
REVOKE ALL ON FUNCTION public.vs_chat_path_ok(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_chat_path_ok(text, boolean) TO authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping vs-chat-files bucket';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-chat-files', 'vs-chat-files', false, 26214400)
  ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;
  EXECUTE 'DROP POLICY IF EXISTS vs_chat_files_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_chat_files_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_chat_files_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_chat_files_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'vs-chat-files' AND public.vs_chat_path_ok(name, false))$p$;
  EXECUTE $p$CREATE POLICY vs_chat_files_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vs-chat-files' AND public.vs_chat_path_ok(name, true))$p$;
  EXECUTE $p$CREATE POLICY vs_chat_files_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vs-chat-files' AND public.vs_chat_path_ok(name, false)
           AND (owner = auth.uid() OR public.vs_has_role('executive', 'operator')))$p$;
END $$;
