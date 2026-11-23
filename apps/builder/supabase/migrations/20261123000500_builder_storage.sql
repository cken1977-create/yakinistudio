-- Yakini Builder, Phase 0: private storage buckets + storage RLS (9.3).
-- Writes are server-only (service role bypasses RLS). Clients may only READ objects whose first
-- path folder is a tenant they belong to (site-assets) or own (site-exports). Downloads of
-- exports use 24-hour signed URLs issued by the server to the owner or an operator.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('site-assets', 'site-assets', false, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/gif']),
  ('site-exports', 'site-exports', false, 524288000, array['application/zip'])
on conflict (id) do update set public = false;

create policy builder_site_assets_read on storage.objects for select to authenticated
  using (bucket_id = 'site-assets'
         and (builder.is_member(builder.path_tenant(name)) or builder.is_operator()));

create policy builder_site_exports_read on storage.objects for select to authenticated
  using (bucket_id = 'site-exports'
         and (builder.has_role(builder.path_tenant(name), array['owner']) or builder.is_operator()));
