-- VIZIONZ SANKOFA · Employee handbooks (HR batch 2 of 3)
-- A handbook has numbered versions, each either written in the app (body) or an
-- uploaded file in the private vs-hr-files bucket. Versions never change once
-- published. Executives/operators assign a handbook to staff or to an open
-- invite; each person's "read" and signed acknowledgement is recorded per
-- version through two functions only. Idempotent; paste as one file.

CREATE TABLE IF NOT EXISTS public.vs_handbooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 200),
  description text,
  archived_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.vs_handbook_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id uuid NOT NULL REFERENCES public.vs_handbooks(id) ON DELETE CASCADE,
  version integer NOT NULL DEFAULT 0,
  body text,
  storage_path text,
  file_name text,
  file_size bigint,
  mime_type text,
  change_note text,
  published_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (handbook_id, version),
  CONSTRAINT vs_handbook_versions_content CHECK (nullif(btrim(body), '') IS NOT NULL OR storage_path IS NOT NULL),
  CONSTRAINT vs_handbook_versions_path CHECK (storage_path IS NULL OR storage_path LIKE 'handbooks/' || handbook_id::text || '/%')
);

CREATE TABLE IF NOT EXISTS public.vs_handbook_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  handbook_id uuid NOT NULL REFERENCES public.vs_handbooks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.vs_operators(user_id) ON DELETE CASCADE,
  invite_id uuid REFERENCES public.vs_invites(id) ON DELETE CASCADE,
  assigned_by uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  CONSTRAINT vs_handbook_assignments_who CHECK (user_id IS NOT NULL OR invite_id IS NOT NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS vs_handbook_assignments_active_user
  ON public.vs_handbook_assignments (handbook_id, user_id) WHERE ended_at IS NULL AND user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS vs_handbook_assignments_active_invite
  ON public.vs_handbook_assignments (handbook_id, invite_id) WHERE ended_at IS NULL AND invite_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.vs_handbook_acks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.vs_handbook_versions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz,
  signed_at timestamptz,
  signed_name text,
  UNIQUE (version_id, user_id),
  CONSTRAINT vs_handbook_acks_signed CHECK (signed_at IS NULL OR (nullif(btrim(signed_name), '') IS NOT NULL AND read_at IS NOT NULL))
);

-- Is this handbook assigned to the signed-in person?
CREATE OR REPLACE FUNCTION public.vs_hr_has_handbook(p_handbook uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.vs_handbook_assignments a
                 WHERE a.handbook_id = p_handbook AND a.ended_at IS NULL AND public.vs_hr_is_me(a.user_id, a.invite_id))
$$;
REVOKE ALL ON FUNCTION public.vs_hr_has_handbook(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_hr_has_handbook(uuid) TO authenticated;

-- Next version number, publisher stamp.
CREATE OR REPLACE FUNCTION vs_private.hr_handbook_version_stamp() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  PERFORM 1 FROM public.vs_handbooks WHERE id = NEW.handbook_id FOR UPDATE;
  SELECT coalesce(max(version), 0) + 1 INTO NEW.version FROM public.vs_handbook_versions WHERE handbook_id = NEW.handbook_id;
  NEW.published_by := coalesce(auth.uid(), NEW.published_by); NEW.published_at := now();
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_hr_handbook_version_stamp ON public.vs_handbook_versions;
CREATE TRIGGER vs_hr_handbook_version_stamp BEFORE INSERT ON public.vs_handbook_versions
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_handbook_version_stamp();

DROP TRIGGER IF EXISTS vs_handbooks_updated_at ON public.vs_handbooks;
CREATE TRIGGER vs_handbooks_updated_at BEFORE UPDATE ON public.vs_handbooks
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

CREATE OR REPLACE FUNCTION vs_private.hr_handbook_assignment_stamp() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.assigned_by := coalesce(auth.uid(), NEW.assigned_by); NEW.assigned_at := now();
  ELSE
    NEW.handbook_id := OLD.handbook_id; NEW.assigned_by := OLD.assigned_by; NEW.assigned_at := OLD.assigned_at;
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS vs_hr_handbook_assignment_stamp ON public.vs_handbook_assignments;
CREATE TRIGGER vs_hr_handbook_assignment_stamp BEFORE INSERT OR UPDATE ON public.vs_handbook_assignments
  FOR EACH ROW EXECUTE FUNCTION vs_private.hr_handbook_assignment_stamp();

-- Staff record "I opened it" and "I sign" only through these.
CREATE OR REPLACE FUNCTION public.vs_handbook_mark_read(p_version uuid)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE h uuid; t timestamptz;
BEGIN
  SELECT handbook_id INTO h FROM public.vs_handbook_versions WHERE id = p_version;
  IF h IS NULL OR NOT public.vs_hr_has_handbook(h) THEN
    RAISE EXCEPTION 'handbook not assigned to you' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.vs_handbook_acks (version_id, user_id, read_at) VALUES (p_version, auth.uid(), now())
  ON CONFLICT (version_id, user_id) DO UPDATE SET read_at = coalesce(public.vs_handbook_acks.read_at, EXCLUDED.read_at)
  RETURNING read_at INTO t;
  RETURN t;
END $$;
CREATE OR REPLACE FUNCTION public.vs_handbook_sign(p_version uuid, p_signed_name text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
DECLARE h uuid; t timestamptz := now();
BEGIN
  SELECT handbook_id INTO h FROM public.vs_handbook_versions WHERE id = p_version;
  IF h IS NULL OR NOT public.vs_hr_has_handbook(h) THEN
    RAISE EXCEPTION 'handbook not assigned to you' USING ERRCODE = '42501';
  END IF;
  IF nullif(btrim(p_signed_name), '') IS NULL THEN
    RAISE EXCEPTION 'type your full name to sign' USING ERRCODE = '22023';
  END IF;
  INSERT INTO public.vs_handbook_acks (version_id, user_id, read_at, signed_at, signed_name)
  VALUES (p_version, auth.uid(), t, t, left(btrim(p_signed_name), 200))
  ON CONFLICT (version_id, user_id) DO UPDATE
    SET read_at = coalesce(public.vs_handbook_acks.read_at, t),
        signed_at = coalesce(public.vs_handbook_acks.signed_at, t),
        signed_name = coalesce(public.vs_handbook_acks.signed_name, EXCLUDED.signed_name);
  SELECT signed_at INTO t FROM public.vs_handbook_acks WHERE version_id = p_version AND user_id = auth.uid();
  RETURN t;
END $$;
REVOKE ALL ON FUNCTION public.vs_handbook_mark_read(uuid), public.vs_handbook_sign(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_handbook_mark_read(uuid), public.vs_handbook_sign(uuid, text) TO authenticated;

ALTER TABLE public.vs_handbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_handbook_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_handbook_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_handbook_acks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS vs_handbooks_select ON public.vs_handbooks;
CREATE POLICY vs_handbooks_select ON public.vs_handbooks FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR public.vs_hr_has_handbook(id));
DROP POLICY IF EXISTS vs_handbooks_write ON public.vs_handbooks;
CREATE POLICY vs_handbooks_write ON public.vs_handbooks FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'));

DROP POLICY IF EXISTS vs_handbook_versions_select ON public.vs_handbook_versions;
CREATE POLICY vs_handbook_versions_select ON public.vs_handbook_versions FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR public.vs_hr_has_handbook(handbook_id));
DROP POLICY IF EXISTS vs_handbook_versions_insert ON public.vs_handbook_versions;
CREATE POLICY vs_handbook_versions_insert ON public.vs_handbook_versions FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator'));
DROP POLICY IF EXISTS vs_handbook_versions_delete ON public.vs_handbook_versions;
CREATE POLICY vs_handbook_versions_delete ON public.vs_handbook_versions FOR DELETE TO authenticated
  USING (public.vs_has_role('executive') AND NOT EXISTS (SELECT 1 FROM public.vs_handbook_acks k WHERE k.version_id = vs_handbook_versions.id));

DROP POLICY IF EXISTS vs_handbook_assign_select ON public.vs_handbook_assignments;
CREATE POLICY vs_handbook_assign_select ON public.vs_handbook_assignments FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR public.vs_hr_is_me(user_id, invite_id));
DROP POLICY IF EXISTS vs_handbook_assign_write ON public.vs_handbook_assignments;
CREATE POLICY vs_handbook_assign_write ON public.vs_handbook_assignments FOR ALL TO authenticated
  USING (public.vs_has_role('executive', 'operator')) WITH CHECK (public.vs_has_role('executive', 'operator'));

DROP POLICY IF EXISTS vs_handbook_acks_select ON public.vs_handbook_acks;
CREATE POLICY vs_handbook_acks_select ON public.vs_handbook_acks FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator') OR user_id = auth.uid());

REVOKE ALL ON public.vs_handbooks, public.vs_handbook_versions, public.vs_handbook_assignments, public.vs_handbook_acks FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vs_handbooks, public.vs_handbook_assignments TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.vs_handbook_versions TO authenticated;
GRANT SELECT ON public.vs_handbook_acks TO authenticated;

DROP TRIGGER IF EXISTS vs_audit ON public.vs_handbooks;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_handbooks FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
DROP TRIGGER IF EXISTS vs_audit ON public.vs_handbook_versions;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_handbook_versions FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
DROP TRIGGER IF EXISTS vs_audit ON public.vs_handbook_assignments;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_handbook_assignments FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();
DROP TRIGGER IF EXISTS vs_audit ON public.vs_handbook_acks;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_handbook_acks FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- Private bucket: handbooks/<handbook_id>/<file>. Exec/op upload; assignees can read.
CREATE OR REPLACE FUNCTION public.vs_hr_path_ok(p_name text, p_write boolean)
RETURNS boolean LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = '' AS $$
DECLARE v_id text := split_part(p_name, '/', 2);
BEGIN
  IF split_part(p_name, '/', 1) <> 'handbooks' OR v_id !~ '^[0-9a-fA-F-]{36}$' OR split_part(p_name, '/', 3) = '' THEN
    RETURN false;
  END IF;
  IF public.vs_has_role('executive', 'operator') THEN RETURN true; END IF;
  RETURN NOT p_write AND public.vs_hr_has_handbook(v_id::uuid);
END $$;
REVOKE ALL ON FUNCTION public.vs_hr_path_ok(text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_hr_path_ok(text, boolean) TO authenticated;

DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NULL OR to_regclass('storage.objects') IS NULL THEN
    RAISE NOTICE 'storage schema not present; skipping vs-hr-files bucket';
    RETURN;
  END IF;
  INSERT INTO storage.buckets (id, name, public, file_size_limit)
  VALUES ('vs-hr-files', 'vs-hr-files', false, 26214400)
  ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit;
  EXECUTE 'DROP POLICY IF EXISTS vs_hr_files_select ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_hr_files_insert ON storage.objects';
  EXECUTE 'DROP POLICY IF EXISTS vs_hr_files_delete ON storage.objects';
  EXECUTE $p$CREATE POLICY vs_hr_files_select ON storage.objects FOR SELECT TO authenticated
    USING (bucket_id = 'vs-hr-files' AND public.vs_hr_path_ok(name, false))$p$;
  EXECUTE $p$CREATE POLICY vs_hr_files_insert ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'vs-hr-files' AND public.vs_hr_path_ok(name, true))$p$;
  EXECUTE $p$CREATE POLICY vs_hr_files_delete ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'vs-hr-files' AND public.vs_hr_path_ok(name, true))$p$;
END $$;
