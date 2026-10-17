-- VIZIONZ SANKOFA · Office CRM 3/7 · People (contacts) + who-can-see helpers
--
-- vs_contacts: the people VS works with who are not participants: partner
-- and agency staff, funder program officers, donors' contacts, vendors,
-- volunteers. Optionally linked to an organization and/or a donor record.
-- Participants are NOT stored here; they stay in participants under the
-- existing caseload rules.
--
-- Who sees what:
--   executive / operator   read + write all
--   leadership_readonly    read all, write nothing
--   case_manager           read + write partner, agency, volunteer, vendor and
--                          other contacts; never funder or donor contacts
--
-- vs_crm_can_see / vs_crm_can_write answer "may the signed-in user see /
-- write CRM records (timeline, tasks, files) attached to this record?" for
-- contact, organization, grant, donor and participant records.

CREATE TABLE IF NOT EXISTS public.vs_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text,
  last_name text,
  display_name text NOT NULL CHECK (length(trim(display_name)) > 0),
  kind text NOT NULL DEFAULT 'partner' CHECK (kind IN (
    'partner', 'agency', 'funder', 'donor', 'vendor', 'volunteer', 'other')),
  title text,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  donor_id uuid REFERENCES public.donors(id) ON DELETE SET NULL,
  email text,
  phone text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  archived_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vs_contacts_org_idx ON public.vs_contacts (organization_id);
CREATE INDEX IF NOT EXISTS vs_contacts_name_idx ON public.vs_contacts (lower(display_name));

DROP TRIGGER IF EXISTS set_updated_at_vs_contacts ON public.vs_contacts;
CREATE TRIGGER set_updated_at_vs_contacts BEFORE UPDATE ON public.vs_contacts
  FOR EACH ROW EXECUTE FUNCTION public.trigger_set_updated_at();

-- Contact kinds a case manager may see / edit.
CREATE OR REPLACE FUNCTION public.vs_crm_cm_contact_kind(p_kind text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = '' AS $$
  SELECT p_kind IN ('partner', 'agency', 'volunteer', 'vendor', 'other')
$$;

ALTER TABLE public.vs_contacts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vs_contacts FROM anon;
DROP POLICY IF EXISTS vs_contacts_select ON public.vs_contacts;
DROP POLICY IF EXISTS vs_contacts_insert ON public.vs_contacts;
DROP POLICY IF EXISTS vs_contacts_update ON public.vs_contacts;
DROP POLICY IF EXISTS vs_contacts_delete ON public.vs_contacts;
CREATE POLICY vs_contacts_select ON public.vs_contacts FOR SELECT TO authenticated
  USING (public.vs_has_role('executive', 'operator', 'leadership_readonly')
         OR (public.vs_has_role('case_manager') AND public.vs_crm_cm_contact_kind(kind)));
CREATE POLICY vs_contacts_insert ON public.vs_contacts FOR INSERT TO authenticated
  WITH CHECK (public.vs_has_role('executive', 'operator')
              OR (public.vs_has_role('case_manager') AND public.vs_crm_cm_contact_kind(kind) AND donor_id IS NULL));
CREATE POLICY vs_contacts_update ON public.vs_contacts FOR UPDATE TO authenticated
  USING (public.vs_has_role('executive', 'operator')
         OR (public.vs_has_role('case_manager') AND public.vs_crm_cm_contact_kind(kind)))
  WITH CHECK (public.vs_has_role('executive', 'operator')
              OR (public.vs_has_role('case_manager') AND public.vs_crm_cm_contact_kind(kind) AND donor_id IS NULL));
CREATE POLICY vs_contacts_delete ON public.vs_contacts FOR DELETE TO authenticated
  USING (public.vs_has_role('executive', 'operator'));

DROP TRIGGER IF EXISTS vs_audit ON public.vs_contacts;
CREATE TRIGGER vs_audit AFTER INSERT OR UPDATE OR DELETE ON public.vs_contacts
  FOR EACH ROW EXECUTE FUNCTION vs_private.audit_row_change();

-- ─── Who may see / write CRM records attached to a record ───────────────────

CREATE OR REPLACE FUNCTION public.vs_crm_can_see(p_type text, p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE
    WHEN p_id IS NULL THEN false
    WHEN p_type = 'participant' THEN public.vs_can_see_participant(p_id)
    WHEN public.vs_has_role('executive', 'operator', 'leadership_readonly') THEN
      CASE p_type
        WHEN 'contact' THEN EXISTS (SELECT 1 FROM public.vs_contacts c WHERE c.id = p_id)
        WHEN 'organization' THEN EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = p_id)
        WHEN 'grant' THEN EXISTS (SELECT 1 FROM public.grants g WHERE g.id = p_id)
        WHEN 'donor' THEN EXISTS (SELECT 1 FROM public.donors d WHERE d.id = p_id)
        ELSE false END
    WHEN public.vs_has_role('case_manager') THEN
      CASE p_type
        WHEN 'contact' THEN EXISTS (SELECT 1 FROM public.vs_contacts c
                                    WHERE c.id = p_id AND public.vs_crm_cm_contact_kind(c.kind))
        WHEN 'organization' THEN EXISTS (SELECT 1 FROM public.organizations o
                                         WHERE o.id = p_id AND o.relationship_kind::text IN ('partner', 'agency'))
        ELSE false END
    ELSE false
  END
$$;

CREATE OR REPLACE FUNCTION public.vs_crm_can_write(p_type text, p_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT CASE
    WHEN p_id IS NULL THEN false
    WHEN p_type = 'participant' THEN public.vs_can_write_participant(p_id)
    WHEN public.vs_has_role('executive', 'operator') THEN public.vs_crm_can_see(p_type, p_id)
    WHEN public.vs_has_role('case_manager') THEN p_type IN ('contact', 'organization') AND public.vs_crm_can_see(p_type, p_id)
    ELSE false
  END
$$;

REVOKE ALL ON FUNCTION public.vs_crm_can_see(text, uuid), public.vs_crm_can_write(text, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_crm_can_see(text, uuid), public.vs_crm_can_write(text, uuid) TO authenticated;
