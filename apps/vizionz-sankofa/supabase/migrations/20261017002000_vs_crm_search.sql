-- VIZIONZ SANKOFA · Office CRM 7/7 · Global search
--
-- vs_global_search(q): one search box across people, organizations,
-- participants (name only), donors, grants, tasks and documents.
-- SECURITY INVOKER on purpose: every table's own row-level security
-- applies, so each person only finds what they are already allowed to see
-- (a case manager finds only their own clients and no donors or grants).

CREATE OR REPLACE FUNCTION public.vs_global_search(p_query text, p_limit integer DEFAULT 8)
RETURNS TABLE (kind text, id uuid, title text, subtitle text)
LANGUAGE plpgsql STABLE SECURITY INVOKER SET search_path = '' AS $$
DECLARE
  q text := '%' || replace(replace(replace(trim(coalesce(p_query, '')), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  n integer := least(greatest(coalesce(p_limit, 8), 1), 25);
BEGIN
  IF length(trim(coalesce(p_query, ''))) < 2 OR public.vs_current_access_role() IS NULL THEN
    RETURN;
  END IF;
  RETURN QUERY (SELECT 'contact'::text, c.id, c.display_name, concat_ws(' · ', c.title, c.kind)
    FROM public.vs_contacts c
    WHERE c.archived_at IS NULL AND (c.display_name ILIKE q OR c.email ILIKE q OR c.title ILIKE q)
    ORDER BY c.display_name LIMIT n);
  RETURN QUERY (SELECT 'organization'::text, o.id, o.name, concat_ws(' · ', o.relationship_kind::text, o.type::text)
    FROM public.organizations o
    WHERE o.name ILIKE q OR o.short_name ILIKE q OR o.primary_contact_name ILIKE q
    ORDER BY o.name LIMIT n);
  RETURN QUERY (SELECT 'participant'::text, p.id,
      concat_ws(' ', coalesce(nullif(p.preferred_name, ''), p.first_name), p.last_name), p.status::text
    FROM public.participants p
    WHERE p.first_name ILIKE q OR p.last_name ILIKE q OR p.preferred_name ILIKE q
       OR concat_ws(' ', p.first_name, p.last_name) ILIKE q
    ORDER BY p.last_name, p.first_name LIMIT n);
  RETURN QUERY (SELECT 'donor'::text, d.id, d.display_name, d.donor_type::text
    FROM public.donors d
    WHERE d.display_name ILIKE q OR d.email ILIKE q
    ORDER BY d.display_name LIMIT n);
  RETURN QUERY (SELECT 'grant'::text, g.id, g.name, g.status::text
    FROM public.grants g
    WHERE g.name ILIKE q OR g.external_grant_id ILIKE q
    ORDER BY g.name LIMIT n);
  RETURN QUERY (SELECT 'task'::text, t.id, t.title,
      concat_ws(' · ', t.status, CASE WHEN t.due_on IS NOT NULL THEN 'due ' || t.due_on::text END)
    FROM public.vs_tasks t
    WHERE t.title ILIKE q OR t.notes ILIKE q
    ORDER BY (t.status = 'open') DESC, t.due_on NULLS LAST LIMIT n);
  RETURN QUERY (SELECT 'document'::text, v.id, v.title, v.category::text
    FROM public.vs_documents v
    WHERE v.title ILIKE q OR v.file_name ILIKE q
    ORDER BY v.uploaded_at DESC LIMIT n);
END $$;
REVOKE ALL ON FUNCTION public.vs_global_search(text, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.vs_global_search(text, integer) TO authenticated;
