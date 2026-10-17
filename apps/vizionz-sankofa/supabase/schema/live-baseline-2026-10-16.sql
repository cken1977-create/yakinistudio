-- VIZIONZ SANKOFA · Live schema snapshot (schema only, NO data)
-- Captured read-only from Supabase project iksilqmhrgbxhxweymst on 2026-10-16.
-- The live project has no recorded migrations; this file is the reference
-- baseline used by supabase/tests/run-local.sh to test the pilot migrations
-- against a local Postgres. Do NOT apply this to the live project.
SET check_function_bodies = off;

-- enums
CREATE TYPE public.vs_operator_role AS ENUM ('operator','employee','pending','principal');
CREATE TYPE public.vs_document_category AS ENUM ('grant_application','grant_award','budget','bank_statement','financial_report','tax_form','board_minutes','mou','contract','program_documentation','policy','correspondence','other');
CREATE TYPE public.donor_type AS ENUM ('individual','family','foundation','corporation','anonymous');
CREATE TYPE public.donor_status AS ENUM ('active','lapsed','declined_contact','deceased');
CREATE TYPE public.gift_method AS ENUM ('cash','check','card','ach','in_kind','stock','grant','other');
CREATE TYPE public.staff_role AS ENUM ('admin','director','case_manager','program_lead','viewer');
CREATE TYPE public.participant_status AS ENUM ('intake','assessed','active','on_hold','graduated','inactive','follow_up','closed');
CREATE TYPE public.referral_source AS ENUM ('self','court','parole_probation','family','community_org','school','social_services','other_program','walk_in','event','social_media','other','hmis','acs','refugee_agency');
CREATE TYPE public.cohort_status AS ENUM ('planned','recruiting','active','completed','cancelled');
CREATE TYPE public.enrollment_status AS ENUM ('enrolled','active','completed','withdrew','transferred');
CREATE TYPE public.service_outcome AS ENUM ('completed','partial','no_show','cancelled','in_progress');
CREATE TYPE public.assessment_interval AS ENUM ('baseline','3_month','6_month','12_month','exit','follow_up');
CREATE TYPE public.contact_method AS ENUM ('in_person','phone','text','email','video','home_visit','court','group_session','referral');
CREATE TYPE public.organization_relationship_kind AS ENUM ('funder','partner','both');
CREATE TYPE public.organization_type AS ENUM ('federal','state','county','city','foundation','corporate','coalition','nonprofit','united_way','faith_based','other');
CREATE TYPE public.organization_status AS ENUM ('active','prospect','lapsed','inactive');
CREATE TYPE public.grant_status AS ENUM ('drafting','submitted','awarded','declined','withdrawn','closed');
-- tables
CREATE TABLE public.assessment_scores (id uuid DEFAULT gen_random_uuid() NOT NULL, assessment_id uuid NOT NULL, domain text NOT NULL, score numeric(3,1) NOT NULL, sub_scores jsonb, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.assessments (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, administered_by_id uuid, assessed_at date DEFAULT CURRENT_DATE NOT NULL, "interval" assessment_interval NOT NULL, related_cohort_id uuid, instrument_name text DEFAULT 'VS Baseline (Wave 3)'::text, instrument_version text DEFAULT '1.0'::text, composite_score numeric(5,2), notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.case_notes (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, staff_id uuid NOT NULL, occurred_at timestamp with time zone DEFAULT now() NOT NULL, duration_minutes integer, contact_method contact_method NOT NULL, related_cohort_id uuid, subject text, content text NOT NULL, next_action text, next_action_due date, next_action_completed boolean DEFAULT false, is_confidential boolean DEFAULT false, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.cohorts (id uuid DEFAULT gen_random_uuid() NOT NULL, program_id uuid NOT NULL, name text NOT NULL, slug text, cohort_number integer, start_date date NOT NULL, end_date date, meeting_schedule text, capacity integer DEFAULT 15, status cohort_status DEFAULT 'planned'::cohort_status NOT NULL, primary_facilitator_id uuid, internal_notes text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.donor_gifts (id uuid DEFAULT gen_random_uuid() NOT NULL, donor_id uuid NOT NULL, amount_cents bigint NOT NULL, gift_date date NOT NULL, method gift_method DEFAULT 'other'::gift_method NOT NULL, designation text, notes text, recorded_by uuid, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.donors (id uuid DEFAULT gen_random_uuid() NOT NULL, first_name text, last_name text, display_name text NOT NULL, email text, phone text, address_line1 text, address_line2 text, city text, state text, postal_code text, donor_type donor_type DEFAULT 'individual'::donor_type NOT NULL, status donor_status DEFAULT 'active'::donor_status NOT NULL, tags text[] DEFAULT '{}'::text[] NOT NULL, notes text, first_gift_date date, last_gift_date date, total_lifetime_amount_cents bigint DEFAULT 0 NOT NULL, total_gifts_count integer DEFAULT 0 NOT NULL, recurring boolean DEFAULT false NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, created_by uuid);
CREATE TABLE public.enrollments (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, cohort_id uuid NOT NULL, status enrollment_status DEFAULT 'enrolled'::enrollment_status NOT NULL, enrolled_at date DEFAULT CURRENT_DATE NOT NULL, completed_at date, withdrew_at date, withdrawal_reason text, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.funder_access_tokens (id uuid DEFAULT gen_random_uuid() NOT NULL, organization_id uuid NOT NULL, token text NOT NULL, generated_at timestamp with time zone DEFAULT now() NOT NULL, generated_by_id uuid, last_viewed_at timestamp with time zone, view_count integer DEFAULT 0 NOT NULL, is_revoked boolean DEFAULT false NOT NULL, revoked_at timestamp with time zone, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.google_oauth_connections (id uuid DEFAULT gen_random_uuid() NOT NULL, google_email text NOT NULL, google_user_id text NOT NULL, access_token text NOT NULL, refresh_token text NOT NULL, token_expires_at timestamp with time zone NOT NULL, scopes text NOT NULL, connected_by_id uuid, connected_at timestamp with time zone DEFAULT now() NOT NULL, last_used_at timestamp with time zone, is_active boolean DEFAULT true NOT NULL, revoked_at timestamp with time zone, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.google_sheet_mappings (id uuid DEFAULT gen_random_uuid() NOT NULL, connection_id uuid NOT NULL, spreadsheet_id text NOT NULL, spreadsheet_name text NOT NULL, sheet_name text NOT NULL, entity_type text NOT NULL, field_mappings jsonb DEFAULT '{}'::jsonb NOT NULL, header_row integer DEFAULT 1 NOT NULL, last_synced_at timestamp with time zone, last_sync_row_count integer, last_sync_imported_count integer, last_sync_skipped_count integer, last_sync_error text, is_active boolean DEFAULT true NOT NULL, created_by_id uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.grants (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, slug text NOT NULL, funder_id uuid, program_id uuid, cohort_id uuid, status grant_status DEFAULT 'drafting'::grant_status NOT NULL, amount_requested numeric, amount_awarded numeric, amount_spent numeric DEFAULT 0, application_opens_at date, application_due_at date, submitted_at date, decided_at date, period_start date, period_end date, next_report_due date, description text, proposal_summary text, decline_reason text, internal_notes text, external_grant_id text, primary_owner_id uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.historical_archive (id uuid DEFAULT gen_random_uuid() NOT NULL, source_program text NOT NULL, source_tab text NOT NULL, record_type text NOT NULL, participant_name text, participant_id uuid, record_date date, raw_content jsonb NOT NULL, searchable_text text, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.intake_requests (id uuid DEFAULT gen_random_uuid() NOT NULL, full_name text NOT NULL, email text NOT NULL, phone text, request_type text NOT NULL, details text, consent_given boolean DEFAULT false NOT NULL, status text DEFAULT 'new'::text NOT NULL, notes text, contacted_at timestamp with time zone, assigned_to uuid, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, legacyline_participant_id text, legacyline_registry_id text, legacyline_promoted_at timestamp with time zone, legacyline_error text, legacyline_status text, legacyline_status_synced_at timestamp with time zone);
CREATE TABLE public.media_items (id uuid DEFAULT gen_random_uuid() NOT NULL, storage_path text NOT NULL, kind text NOT NULL, caption text, event_date date, display_order integer DEFAULT 0 NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, created_by text);
CREATE TABLE public.migration_log (id uuid DEFAULT gen_random_uuid() NOT NULL, migration_batch_id uuid NOT NULL, source_file text NOT NULL, source_tab text NOT NULL, source_row_number integer, target_table text NOT NULL, target_record_id uuid, status text NOT NULL, notes text, raw_row_json jsonb, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.organizations (id uuid DEFAULT gen_random_uuid() NOT NULL, name text NOT NULL, short_name text, slug text NOT NULL, relationship_kind organization_relationship_kind NOT NULL, type organization_type NOT NULL, level text, status organization_status DEFAULT 'active'::organization_status, primary_contact_name text, primary_contact_email text, primary_contact_phone text, primary_contact_role text, website text, notes text, next_touch_due date, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.participant_addresses (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, address_line1 text NOT NULL, address_line2 text, city text, state text, zip text, address_type text DEFAULT 'current'::text, effective_date date, end_date date, source_notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.participant_documents (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, uploaded_by_id uuid, filename text NOT NULL, storage_path text NOT NULL, file_size_bytes bigint, mime_type text, category text, description text, is_confidential boolean DEFAULT true, uploaded_at timestamp with time zone DEFAULT now() NOT NULL, expires_at date, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.participant_family_members (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, member_name text NOT NULL, relationship text, date_of_birth date, country_of_origin text, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.participant_identifiers (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, identifier_type text NOT NULL, identifier_value text NOT NULL, issuing_program text, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.participants (id uuid DEFAULT gen_random_uuid() NOT NULL, first_name text NOT NULL, last_name text NOT NULL, preferred_name text, date_of_birth date, phone_primary text, phone_secondary text, email text, address_line1 text, address_line2 text, city text, state text DEFAULT 'NM'::text, zip text, gender text, race_ethnicity text[], primary_language text DEFAULT 'English'::text, veteran_status boolean, disability_status boolean, household_size integer, children_in_household integer, household_income_range text, intake_date date DEFAULT CURRENT_DATE NOT NULL, referral_source referral_source DEFAULT 'self'::referral_source, referral_source_detail text, status participant_status DEFAULT 'intake'::participant_status NOT NULL, primary_case_manager_id uuid, consent_to_services boolean DEFAULT false, consent_to_share_data boolean DEFAULT false, consent_to_photos boolean DEFAULT false, consent_signed_at timestamp with time zone, intake_notes text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL, created_by uuid, legacyline_subject_id text, legacyline_pushed_at timestamp with time zone, legacyline_consent_signed boolean DEFAULT false, country_of_origin text, demographic_legacy text, legacy_source_tabs jsonb DEFAULT '[]'::jsonb);
CREATE TABLE public.programs (id uuid DEFAULT gen_random_uuid() NOT NULL, slug text NOT NULL, name text NOT NULL, short_name text, is_public boolean DEFAULT true NOT NULL, public_description text, public_long_description text, who_we_serve text, eligibility_criteria text, duration_description text, apply_cta_label text DEFAULT 'Apply Now'::text, apply_url text, hero_image_url text, icon_emoji text, display_order integer DEFAULT 100, program_lead_id uuid, cohort_capacity integer DEFAULT 15, primary_outcome_domains text[], is_active boolean DEFAULT true NOT NULL, launched_at date, retired_at date, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.service_types (id uuid DEFAULT gen_random_uuid() NOT NULL, slug text NOT NULL, name text NOT NULL, description text, category text, countable_unit text DEFAULT 'session'::text, is_active boolean DEFAULT true NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.services_delivered (id uuid DEFAULT gen_random_uuid() NOT NULL, participant_id uuid NOT NULL, service_type_id uuid NOT NULL, delivered_by_id uuid, delivered_at timestamp with time zone DEFAULT now() NOT NULL, units integer DEFAULT 1, outcome service_outcome DEFAULT 'completed'::service_outcome, related_cohort_id uuid, notes text, cost_amount numeric(10,2), cost_funded_by text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.staff (id uuid DEFAULT gen_random_uuid() NOT NULL, auth_user_id uuid, first_name text NOT NULL, last_name text NOT NULL, email text NOT NULL, phone text, role staff_role DEFAULT 'case_manager'::staff_role NOT NULL, title text, is_active boolean DEFAULT true NOT NULL, hired_at date, bio text, photo_url text, credentials text, specialty text, caseload_capacity integer DEFAULT 25, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.vs_audit_log (id uuid DEFAULT gen_random_uuid() NOT NULL, actor_email text NOT NULL, action text NOT NULL, table_name text NOT NULL, record_id text, before_json jsonb, after_json jsonb, occurred_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.vs_authorizations (id uuid DEFAULT gen_random_uuid() NOT NULL, principal_name text NOT NULL, principal_email text NOT NULL, principal_role text NOT NULL, authorization_text text NOT NULL, authorized_at timestamp with time zone DEFAULT now() NOT NULL, authorized_by_email text NOT NULL, notes text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.vs_document_chunks (id uuid DEFAULT gen_random_uuid() NOT NULL, document_id uuid NOT NULL, chunk_index integer NOT NULL, content text NOT NULL, embedding vector(1536), token_count integer, source_ref text, created_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.vs_documents (id uuid DEFAULT gen_random_uuid() NOT NULL, title text NOT NULL, category vs_document_category DEFAULT 'other'::vs_document_category NOT NULL, description text, document_date date, storage_path text NOT NULL, file_name text NOT NULL, file_size_bytes bigint NOT NULL, mime_type text NOT NULL, processing_status text DEFAULT 'pending'::text NOT NULL, processing_error text, processed_at timestamp with time zone, chunk_count integer DEFAULT 0 NOT NULL, related_program text, related_donor uuid, related_intake uuid, uploaded_by uuid NOT NULL, uploaded_at timestamp with time zone DEFAULT now() NOT NULL, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
CREATE TABLE public.vs_operators (user_id uuid NOT NULL, email text NOT NULL, display_name text, role vs_operator_role DEFAULT 'pending'::vs_operator_role NOT NULL, invited_by uuid, invited_at timestamp with time zone DEFAULT now() NOT NULL, activated_at timestamp with time zone, last_active_at timestamp with time zone, revoked_at timestamp with time zone, revoked_reason text, created_at timestamp with time zone DEFAULT now() NOT NULL, updated_at timestamp with time zone DEFAULT now() NOT NULL);
-- constraints
ALTER TABLE public.assessment_scores ADD CONSTRAINT assessment_scores_assessment_id_domain_key UNIQUE (assessment_id, domain);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_participant_id_cohort_id_key UNIQUE (participant_id, cohort_id);
ALTER TABLE public.funder_access_tokens ADD CONSTRAINT funder_access_tokens_token_key UNIQUE (token);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
ALTER TABLE public.programs ADD CONSTRAINT programs_slug_key UNIQUE (slug);
ALTER TABLE public.service_types ADD CONSTRAINT service_types_slug_key UNIQUE (slug);
ALTER TABLE public.staff ADD CONSTRAINT staff_email_key UNIQUE (email);
ALTER TABLE public.vs_document_chunks ADD CONSTRAINT vs_document_chunks_document_id_chunk_index_key UNIQUE (document_id, chunk_index);
ALTER TABLE public.vs_documents ADD CONSTRAINT vs_documents_storage_path_key UNIQUE (storage_path);
ALTER TABLE public.assessment_scores ADD CONSTRAINT assessment_scores_pkey PRIMARY KEY (id);
ALTER TABLE public.assessments ADD CONSTRAINT assessments_pkey PRIMARY KEY (id);
ALTER TABLE public.case_notes ADD CONSTRAINT case_notes_pkey PRIMARY KEY (id);
ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_pkey PRIMARY KEY (id);
ALTER TABLE public.donor_gifts ADD CONSTRAINT donor_gifts_pkey PRIMARY KEY (id);
ALTER TABLE public.donors ADD CONSTRAINT donors_pkey PRIMARY KEY (id);
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_pkey PRIMARY KEY (id);
ALTER TABLE public.funder_access_tokens ADD CONSTRAINT funder_access_tokens_pkey PRIMARY KEY (id);
ALTER TABLE public.google_oauth_connections ADD CONSTRAINT google_oauth_connections_pkey PRIMARY KEY (id);
ALTER TABLE public.google_sheet_mappings ADD CONSTRAINT google_sheet_mappings_pkey PRIMARY KEY (id);
ALTER TABLE public.grants ADD CONSTRAINT grants_pkey PRIMARY KEY (id);
ALTER TABLE public.historical_archive ADD CONSTRAINT historical_archive_pkey PRIMARY KEY (id);
ALTER TABLE public.intake_requests ADD CONSTRAINT intake_requests_pkey PRIMARY KEY (id);
ALTER TABLE public.media_items ADD CONSTRAINT media_items_pkey PRIMARY KEY (id);
ALTER TABLE public.migration_log ADD CONSTRAINT migration_log_pkey PRIMARY KEY (id);
ALTER TABLE public.organizations ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
ALTER TABLE public.participant_addresses ADD CONSTRAINT participant_addresses_pkey PRIMARY KEY (id);
ALTER TABLE public.participant_documents ADD CONSTRAINT participant_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.participant_family_members ADD CONSTRAINT participant_family_members_pkey PRIMARY KEY (id);
ALTER TABLE public.participant_identifiers ADD CONSTRAINT participant_identifiers_pkey PRIMARY KEY (id);
ALTER TABLE public.participants ADD CONSTRAINT participants_pkey PRIMARY KEY (id);
ALTER TABLE public.programs ADD CONSTRAINT programs_pkey PRIMARY KEY (id);
ALTER TABLE public.service_types ADD CONSTRAINT service_types_pkey PRIMARY KEY (id);
ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_pkey PRIMARY KEY (id);
ALTER TABLE public.staff ADD CONSTRAINT staff_pkey PRIMARY KEY (id);
ALTER TABLE public.vs_audit_log ADD CONSTRAINT vs_audit_log_pkey PRIMARY KEY (id);
ALTER TABLE public.vs_authorizations ADD CONSTRAINT vs_authorizations_pkey PRIMARY KEY (id);
ALTER TABLE public.vs_document_chunks ADD CONSTRAINT vs_document_chunks_pkey PRIMARY KEY (id);
ALTER TABLE public.vs_documents ADD CONSTRAINT vs_documents_pkey PRIMARY KEY (id);
ALTER TABLE public.vs_operators ADD CONSTRAINT vs_operators_pkey PRIMARY KEY (user_id);
ALTER TABLE public.assessment_scores ADD CONSTRAINT assessment_scores_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_administered_by_id_fkey FOREIGN KEY (administered_by_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_related_cohort_id_fkey FOREIGN KEY (related_cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE public.assessments ADD CONSTRAINT assessments_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.case_notes ADD CONSTRAINT case_notes_related_cohort_id_fkey FOREIGN KEY (related_cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE public.case_notes ADD CONSTRAINT case_notes_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.case_notes ADD CONSTRAINT case_notes_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE;
ALTER TABLE public.cohorts ADD CONSTRAINT cohorts_primary_facilitator_id_fkey FOREIGN KEY (primary_facilitator_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.donor_gifts ADD CONSTRAINT donor_gifts_donor_id_fkey FOREIGN KEY (donor_id) REFERENCES donors(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.enrollments ADD CONSTRAINT enrollments_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES cohorts(id) ON DELETE CASCADE;
ALTER TABLE public.funder_access_tokens ADD CONSTRAINT funder_access_tokens_generated_by_id_fkey FOREIGN KEY (generated_by_id) REFERENCES staff(id);
ALTER TABLE public.funder_access_tokens ADD CONSTRAINT funder_access_tokens_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE public.google_oauth_connections ADD CONSTRAINT google_oauth_connections_connected_by_id_fkey FOREIGN KEY (connected_by_id) REFERENCES staff(id);
ALTER TABLE public.google_sheet_mappings ADD CONSTRAINT google_sheet_mappings_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES staff(id);
ALTER TABLE public.google_sheet_mappings ADD CONSTRAINT google_sheet_mappings_connection_id_fkey FOREIGN KEY (connection_id) REFERENCES google_oauth_connections(id) ON DELETE CASCADE;
ALTER TABLE public.grants ADD CONSTRAINT grants_primary_owner_id_fkey FOREIGN KEY (primary_owner_id) REFERENCES staff(id);
ALTER TABLE public.grants ADD CONSTRAINT grants_funder_id_fkey FOREIGN KEY (funder_id) REFERENCES organizations(id);
ALTER TABLE public.grants ADD CONSTRAINT grants_program_id_fkey FOREIGN KEY (program_id) REFERENCES programs(id);
ALTER TABLE public.grants ADD CONSTRAINT grants_cohort_id_fkey FOREIGN KEY (cohort_id) REFERENCES cohorts(id);
ALTER TABLE public.historical_archive ADD CONSTRAINT historical_archive_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL;
ALTER TABLE public.intake_requests ADD CONSTRAINT intake_requests_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES auth.users(id);
ALTER TABLE public.participant_addresses ADD CONSTRAINT participant_addresses_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.participant_documents ADD CONSTRAINT participant_documents_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.participant_documents ADD CONSTRAINT participant_documents_uploaded_by_id_fkey FOREIGN KEY (uploaded_by_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.participant_family_members ADD CONSTRAINT participant_family_members_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.participant_identifiers ADD CONSTRAINT participant_identifiers_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.participants ADD CONSTRAINT participants_created_by_fkey FOREIGN KEY (created_by) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.participants ADD CONSTRAINT participants_primary_case_manager_id_fkey FOREIGN KEY (primary_case_manager_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.programs ADD CONSTRAINT programs_program_lead_id_fkey FOREIGN KEY (program_lead_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_delivered_by_id_fkey FOREIGN KEY (delivered_by_id) REFERENCES staff(id) ON DELETE SET NULL;
ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_service_type_id_fkey FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE RESTRICT;
ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_related_cohort_id_fkey FOREIGN KEY (related_cohort_id) REFERENCES cohorts(id) ON DELETE SET NULL;
ALTER TABLE public.services_delivered ADD CONSTRAINT services_delivered_participant_id_fkey FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE;
ALTER TABLE public.staff ADD CONSTRAINT staff_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.vs_document_chunks ADD CONSTRAINT vs_document_chunks_document_id_fkey FOREIGN KEY (document_id) REFERENCES vs_documents(id) ON DELETE CASCADE;
ALTER TABLE public.vs_documents ADD CONSTRAINT vs_documents_related_intake_fkey FOREIGN KEY (related_intake) REFERENCES intake_requests(id) ON DELETE SET NULL;
ALTER TABLE public.vs_documents ADD CONSTRAINT vs_documents_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
ALTER TABLE public.vs_operators ADD CONSTRAINT vs_operators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vs_operators ADD CONSTRAINT vs_operators_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.donor_gifts ADD CONSTRAINT donor_gifts_amount_cents_check CHECK ((amount_cents > 0));
ALTER TABLE public.intake_requests ADD CONSTRAINT intake_requests_status_check CHECK ((status = ANY (ARRAY['new'::text, 'contacted'::text, 'in_progress'::text, 'resolved'::text, 'promoted_to_legacyline'::text, 'closed_no_response'::text])));
ALTER TABLE public.intake_requests ADD CONSTRAINT intake_requests_request_type_check CHECK ((request_type = ANY (ARRAY['food_assistance'::text, 'family_support'::text, 'refugee_immigrant_services'::text, 'education'::text, 'housing'::text, 'other'::text])));
ALTER TABLE public.media_items ADD CONSTRAINT media_items_kind_check CHECK ((kind = ANY (ARRAY['photo'::text, 'video'::text])));
ALTER TABLE public.migration_log ADD CONSTRAINT migration_log_status_check CHECK ((status = ANY (ARRAY['success'::text, 'skipped'::text, 'error'::text, 'duplicate_merged'::text])));
ALTER TABLE public.vs_audit_log ADD CONSTRAINT vs_audit_log_action_check CHECK ((action = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])));
ALTER TABLE public.vs_documents ADD CONSTRAINT vs_documents_processing_status_check CHECK ((processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'ready'::text, 'error'::text])));
ALTER TABLE public.vs_operators ADD CONSTRAINT vs_operators_revoked_reason_required CHECK ((((revoked_at IS NULL) AND (revoked_reason IS NULL)) OR (revoked_at IS NOT NULL)));
-- indexes
CREATE INDEX media_items_display_order_idx ON public.media_items USING btree (display_order);
CREATE INDEX media_items_kind_idx ON public.media_items USING btree (kind);
CREATE INDEX participant_family_participant_idx ON public.participant_family_members USING btree (participant_id);
CREATE INDEX intake_requests_status_idx ON public.intake_requests USING btree (status);
CREATE INDEX intake_requests_created_at_idx ON public.intake_requests USING btree (created_at DESC);
CREATE INDEX intake_requests_assigned_to_idx ON public.intake_requests USING btree (assigned_to);
CREATE INDEX intake_requests_promoted_idx ON public.intake_requests USING btree (legacyline_promoted_at DESC) WHERE (legacyline_promoted_at IS NOT NULL);
CREATE INDEX intake_requests_legacyline_participant_idx ON public.intake_requests USING btree (legacyline_participant_id) WHERE (legacyline_participant_id IS NOT NULL);
CREATE INDEX intake_requests_legacyline_status_idx ON public.intake_requests USING btree (legacyline_status) WHERE (legacyline_status IS NOT NULL);
CREATE INDEX idx_organizations_kind ON public.organizations USING btree (relationship_kind);
CREATE INDEX idx_organizations_type ON public.organizations USING btree (type);
CREATE INDEX idx_organizations_status ON public.organizations USING btree (status);
CREATE INDEX idx_sheet_mappings_connection ON public.google_sheet_mappings USING btree (connection_id);
CREATE INDEX participant_identifiers_participant_idx ON public.participant_identifiers USING btree (participant_id);
CREATE INDEX vs_operators_role_idx ON public.vs_operators USING btree (role) WHERE (revoked_at IS NULL);
CREATE UNIQUE INDEX vs_operators_email_active_idx ON public.vs_operators USING btree (lower(email)) WHERE (revoked_at IS NULL);
CREATE INDEX vs_operators_last_active_idx ON public.vs_operators USING btree (last_active_at DESC NULLS LAST) WHERE (revoked_at IS NULL);
CREATE INDEX idx_funder_tokens_org ON public.funder_access_tokens USING btree (organization_id);
CREATE INDEX idx_funder_tokens_lookup ON public.funder_access_tokens USING btree (token) WHERE (NOT is_revoked);
CREATE INDEX migration_log_batch_idx ON public.migration_log USING btree (migration_batch_id);
CREATE INDEX migration_log_tab_idx ON public.migration_log USING btree (source_tab);
CREATE INDEX vs_documents_category_idx ON public.vs_documents USING btree (category);
CREATE INDEX vs_documents_processing_status_idx ON public.vs_documents USING btree (processing_status) WHERE (processing_status = ANY (ARRAY['pending'::text, 'processing'::text, 'error'::text]));
CREATE INDEX vs_documents_document_date_idx ON public.vs_documents USING btree (document_date DESC NULLS LAST);
CREATE INDEX vs_documents_uploaded_at_idx ON public.vs_documents USING btree (uploaded_at DESC);
CREATE INDEX vs_documents_related_intake_idx ON public.vs_documents USING btree (related_intake) WHERE (related_intake IS NOT NULL);
CREATE INDEX vs_document_chunks_embedding_idx ON public.vs_document_chunks USING hnsw (embedding vector_cosine_ops);
CREATE INDEX vs_document_chunks_document_id_idx ON public.vs_document_chunks USING btree (document_id);
CREATE INDEX donors_status_idx ON public.donors USING btree (status);
CREATE INDEX donors_donor_type_idx ON public.donors USING btree (donor_type);
CREATE INDEX donors_recurring_idx ON public.donors USING btree (recurring);
CREATE INDEX donors_last_gift_date_idx ON public.donors USING btree (last_gift_date DESC);
CREATE INDEX donors_tags_gin_idx ON public.donors USING gin (tags);
CREATE INDEX donors_display_name_idx ON public.donors USING btree (display_name);
CREATE INDEX donor_gifts_donor_id_idx ON public.donor_gifts USING btree (donor_id);
CREATE INDEX donor_gifts_gift_date_idx ON public.donor_gifts USING btree (gift_date DESC);
CREATE INDEX idx_grants_funder ON public.grants USING btree (funder_id);
CREATE INDEX idx_grants_status ON public.grants USING btree (status);
CREATE INDEX idx_grants_due ON public.grants USING btree (application_due_at) WHERE (status = 'drafting'::grant_status);
CREATE INDEX idx_grants_report_due ON public.grants USING btree (next_report_due) WHERE (status = 'awarded'::grant_status);
CREATE INDEX idx_participants_status ON public.participants USING btree (status);
CREATE INDEX idx_participants_case_manager ON public.participants USING btree (primary_case_manager_id);
CREATE INDEX idx_participants_intake_date ON public.participants USING btree (intake_date DESC);
CREATE INDEX idx_participants_name ON public.participants USING btree (last_name, first_name);
CREATE INDEX idx_participants_legacyline ON public.participants USING btree (legacyline_subject_id) WHERE (legacyline_subject_id IS NOT NULL);
CREATE INDEX idx_staff_auth_user ON public.staff USING btree (auth_user_id);
CREATE INDEX idx_staff_role ON public.staff USING btree (role) WHERE (is_active = true);
CREATE INDEX historical_archive_program_idx ON public.historical_archive USING btree (source_program);
CREATE INDEX historical_archive_participant_idx ON public.historical_archive USING btree (participant_id);
CREATE INDEX historical_archive_date_idx ON public.historical_archive USING btree (record_date DESC);
CREATE INDEX idx_programs_slug ON public.programs USING btree (slug);
CREATE INDEX idx_programs_active ON public.programs USING btree (is_active, display_order) WHERE (is_active = true);
CREATE INDEX idx_programs_public ON public.programs USING btree (is_public, display_order) WHERE (is_public = true);
CREATE INDEX idx_cohorts_program ON public.cohorts USING btree (program_id);
CREATE INDEX idx_cohorts_status ON public.cohorts USING btree (status);
CREATE INDEX idx_cohorts_dates ON public.cohorts USING btree (start_date DESC);
CREATE INDEX idx_enrollments_participant ON public.enrollments USING btree (participant_id);
CREATE INDEX idx_enrollments_cohort ON public.enrollments USING btree (cohort_id);
CREATE INDEX idx_enrollments_status ON public.enrollments USING btree (status);
CREATE INDEX idx_case_notes_participant ON public.case_notes USING btree (participant_id, occurred_at DESC);
CREATE INDEX idx_case_notes_staff ON public.case_notes USING btree (staff_id, occurred_at DESC);
CREATE INDEX idx_case_notes_follow_up ON public.case_notes USING btree (next_action_due) WHERE ((next_action_due IS NOT NULL) AND (next_action_completed = false));
CREATE INDEX idx_services_participant ON public.services_delivered USING btree (participant_id, delivered_at DESC);
CREATE INDEX idx_services_type ON public.services_delivered USING btree (service_type_id);
CREATE INDEX idx_services_date ON public.services_delivered USING btree (delivered_at DESC);
CREATE UNIQUE INDEX idx_google_oauth_active_email ON public.google_oauth_connections USING btree (google_email) WHERE (is_active = true);
CREATE INDEX vs_audit_log_table_name_idx ON public.vs_audit_log USING btree (table_name);
CREATE INDEX vs_audit_log_occurred_at_idx ON public.vs_audit_log USING btree (occurred_at DESC);
CREATE INDEX idx_documents_participant ON public.participant_documents USING btree (participant_id, uploaded_at DESC);
CREATE INDEX idx_documents_category ON public.participant_documents USING btree (category);
CREATE INDEX idx_assessments_participant ON public.assessments USING btree (participant_id, assessed_at DESC);
CREATE INDEX idx_assessments_interval ON public.assessments USING btree ("interval");
CREATE INDEX idx_scores_assessment ON public.assessment_scores USING btree (assessment_id);
CREATE INDEX idx_scores_domain ON public.assessment_scores USING btree (domain);
CREATE INDEX participant_addresses_participant_idx ON public.participant_addresses USING btree (participant_id);
-- functions
CREATE OR REPLACE FUNCTION public.trigger_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                BEGIN
                                                                                                  NEW.updated_at = now();
                                                                                                    RETURN NEW;
                                                                                                    END;
                                                                                                    $function$
;
CREATE OR REPLACE FUNCTION public.refresh_donor_aggregates(p_donor_id uuid)
 RETURNS void
 LANGUAGE sql
AS $function$
                                                                        UPDATE donors d SET
                                                                            total_lifetime_amount_cents = COALESCE((SELECT SUM(amount_cents) FROM donor_gifts WHERE donor_id = p_donor_id), 0),
                                                                                total_gifts_count = COALESCE((SELECT COUNT(*) FROM donor_gifts WHERE donor_id = p_donor_id), 0),
                                                                                    first_gift_date = (SELECT MIN(gift_date) FROM donor_gifts WHERE donor_id = p_donor_id),
                                                                                        last_gift_date = (SELECT MAX(gift_date) FROM donor_gifts WHERE donor_id = p_donor_id),
                                                                                            updated_at = now()
                                                                                              WHERE d.id = p_donor_id;
                                                                                              $function$
;
CREATE OR REPLACE FUNCTION public.vs_documents_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                                                            begin
                                                                                                                                                                              new.updated_at = now();
                                                                                                                                                                                return new;
                                                                                                                                                                                end;
                                                                                                                                                                                $function$
;
CREATE OR REPLACE FUNCTION public.match_document_chunks(query_embedding vector, match_count integer DEFAULT 5)
 RETURNS TABLE(chunk_id uuid, document_id uuid, chunk_index integer, content text, token_count integer, source_ref text, similarity double precision, document_title text, document_file_name text)
 LANGUAGE sql
 STABLE
AS $function$
                          SELECT
                              c.id AS chunk_id,
                                  c.document_id,
                                      c.chunk_index,
                                          c.content,
                                              c.token_count,
                                                  c.source_ref,
                                                      1 - (c.embedding <=> query_embedding) AS similarity,
                                                          d.title AS document_title,
                                                              d.file_name AS document_file_name
                                                                FROM vs_document_chunks c
                                                                  JOIN vs_documents d ON d.id = c.document_id
                                                                    WHERE d.processing_status = 'ready'
                                                                      ORDER BY c.embedding <=> query_embedding
                                                                        LIMIT match_count;
                                                                        $function$
;
CREATE OR REPLACE FUNCTION public.update_grants_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                BEGIN
                                                                                  NEW.updated_at = now();
                                                                                    RETURN NEW;
                                                                                    END;
                                                                                    $function$
;
CREATE OR REPLACE FUNCTION public.donor_gifts_aggregate_trigger()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                              BEGIN
                                                                                                IF TG_OP = 'DELETE' THEN
                                                                                                    PERFORM refresh_donor_aggregates(OLD.donor_id);
                                                                                                        RETURN OLD;
                                                                                                          ELSE
                                                                                                              PERFORM refresh_donor_aggregates(NEW.donor_id);
                                                                                                                  IF TG_OP = 'UPDATE' AND OLD.donor_id <> NEW.donor_id THEN
                                                                                                                        PERFORM refresh_donor_aggregates(OLD.donor_id);
                                                                                                                            END IF;
                                                                                                                                RETURN NEW;
                                                                                                                                  END IF;
                                                                                                                                  END;
                                                                                                                                  $function$
;
CREATE OR REPLACE FUNCTION public.update_google_oauth_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                        BEGIN
                                                          NEW.updated_at = now();
                                                            RETURN NEW;
                                                            END;
                                                            $function$
;
CREATE OR REPLACE FUNCTION public.vs_operators_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                    begin
                                                                      new.updated_at = now();
                                                                        return new;
                                                                        end;
                                                                        $function$
;
CREATE OR REPLACE FUNCTION public.intake_requests_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                                                                                                                                                                                                                          begin
                                                                                                                                                                                                                                                                                                                                            new.updated_at = now();
                                                                                                                                                                                                                                                                                                                                              return new;
                                                                                                                                                                                                                                                                                                                                              end;
                                                                                                                                                                                                                                                                                                                                              $function$
;
CREATE OR REPLACE FUNCTION public.donors_set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
                                                                                                                                  BEGIN
                                                                                                                                    NEW.updated_at = now();
                                                                                                                                      RETURN NEW;
                                                                                                                                      END;
                                                                                                                                      $function$
;
-- triggers
CREATE TRIGGER intake_requests_updated_at BEFORE UPDATE ON public.intake_requests FOR EACH ROW EXECUTE FUNCTION intake_requests_set_updated_at();
CREATE TRIGGER vs_operators_updated_at BEFORE UPDATE ON public.vs_operators FOR EACH ROW EXECUTE FUNCTION vs_operators_set_updated_at();
CREATE TRIGGER vs_documents_updated_at BEFORE UPDATE ON public.vs_documents FOR EACH ROW EXECUTE FUNCTION vs_documents_set_updated_at();
CREATE TRIGGER donor_gifts_aggregate AFTER INSERT OR DELETE OR UPDATE ON public.donor_gifts FOR EACH ROW EXECUTE FUNCTION donor_gifts_aggregate_trigger();
CREATE TRIGGER donors_updated_at BEFORE UPDATE ON public.donors FOR EACH ROW EXECUTE FUNCTION donors_set_updated_at();
CREATE TRIGGER set_updated_at_staff BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_participants BEFORE UPDATE ON public.participants FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_programs BEFORE UPDATE ON public.programs FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_cohorts BEFORE UPDATE ON public.cohorts FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_enrollments BEFORE UPDATE ON public.enrollments FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_case_notes BEFORE UPDATE ON public.case_notes FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER set_updated_at_organizations BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
CREATE TRIGGER grants_updated_at BEFORE UPDATE ON public.grants FOR EACH ROW EXECUTE FUNCTION update_grants_updated_at();
CREATE TRIGGER google_oauth_updated_at BEFORE UPDATE ON public.google_oauth_connections FOR EACH ROW EXECUTE FUNCTION update_google_oauth_updated_at();
CREATE TRIGGER sheet_mappings_updated_at BEFORE UPDATE ON public.google_sheet_mappings FOR EACH ROW EXECUTE FUNCTION update_google_oauth_updated_at();
-- RLS enabled on every table (matches live)
ALTER TABLE public.assessment_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funder_access_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_sheet_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historical_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intake_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participant_identifiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_delivered ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_authorizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_document_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vs_operators ENABLE ROW LEVEL SECURITY;
-- policies
CREATE POLICY "Public can read media_items" ON public.media_items AS PERMISSIVE FOR SELECT TO public USING (true);
CREATE POLICY "Authenticated users can insert media_items" ON public.media_items AS PERMISSIVE FOR INSERT TO public WITH CHECK ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can update media_items" ON public.media_items AS PERMISSIVE FOR UPDATE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated users can delete media_items" ON public.media_items AS PERMISSIVE FOR DELETE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Public can insert intake_requests" ON public.intake_requests AS PERMISSIVE FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Authenticated operators can read intake_requests" ON public.intake_requests AS PERMISSIVE FOR SELECT TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated operators can update intake_requests" ON public.intake_requests AS PERMISSIVE FOR UPDATE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Authenticated operators can delete intake_requests" ON public.intake_requests AS PERMISSIVE FOR DELETE TO public USING ((auth.role() = 'authenticated'::text));
CREATE POLICY "Users can read their own vs_operators row" ON public.vs_operators AS PERMISSIVE FOR SELECT TO public USING ((auth.uid() = user_id));
CREATE POLICY "Operators can invite new operators" ON public.vs_operators AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators self
  WHERE ((self.user_id = auth.uid()) AND (self.role = 'operator'::vs_operator_role) AND (self.revoked_at IS NULL)))));
CREATE POLICY "Operators can update vs_operators" ON public.vs_operators AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators self
  WHERE ((self.user_id = auth.uid()) AND (self.role = 'operator'::vs_operator_role) AND (self.revoked_at IS NULL)))));
CREATE POLICY "Operators can read vs_documents" ON public.vs_documents AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.user_id = auth.uid()) AND (vs_operators.role = 'operator'::vs_operator_role) AND (vs_operators.revoked_at IS NULL)))));
CREATE POLICY authenticated_full_access_assessments ON public.assessments AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_assessment_scores ON public.assessment_scores AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_organizations ON public.organizations AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY funder_tokens_staff_access ON public.funder_access_tokens AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY grants_staff_access ON public.grants AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY "Operators can upload vs_documents" ON public.vs_documents AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.user_id = auth.uid()) AND (vs_operators.role = 'operator'::vs_operator_role) AND (vs_operators.revoked_at IS NULL)))));
CREATE POLICY "Operators can update vs_documents" ON public.vs_documents AS PERMISSIVE FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.user_id = auth.uid()) AND (vs_operators.role = 'operator'::vs_operator_role) AND (vs_operators.revoked_at IS NULL)))));
CREATE POLICY "Operators can delete vs_documents" ON public.vs_documents AS PERMISSIVE FOR DELETE TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.user_id = auth.uid()) AND (vs_operators.role = 'operator'::vs_operator_role) AND (vs_operators.revoked_at IS NULL)))));
CREATE POLICY "Operators can read vs_document_chunks" ON public.vs_document_chunks AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.user_id = auth.uid()) AND (vs_operators.role = 'operator'::vs_operator_role) AND (vs_operators.revoked_at IS NULL)))));
CREATE POLICY donors_operator_read ON public.donors AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid()))));
CREATE POLICY donors_operator_write ON public.donors AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid()))));
CREATE POLICY donor_gifts_operator_read ON public.donor_gifts AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid()))));
CREATE POLICY donor_gifts_operator_write ON public.donor_gifts AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid())))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE (vs_operators.user_id = auth.uid()))));
CREATE POLICY authenticated_full_access_staff ON public.staff AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_participants ON public.participants AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_programs ON public.programs AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY public_read_active_programs ON public.programs AS PERMISSIVE FOR SELECT TO anon USING (((is_active = true) AND (is_public = true)));
CREATE POLICY authenticated_full_access_cohorts ON public.cohorts AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_enrollments ON public.enrollments AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_case_notes ON public.case_notes AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_service_types ON public.service_types AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_services_delivered ON public.services_delivered AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY authenticated_full_access_documents ON public.participant_documents AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY vs_authorizations_principal_read ON public.vs_authorizations AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY vs_authorizations_principal_write ON public.vs_authorizations AS PERMISSIVE FOR INSERT TO public WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY vs_audit_log_principal_read ON public.vs_audit_log AS PERMISSIVE FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY participant_addresses_principal_full ON public.participant_addresses AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY participant_family_principal_full ON public.participant_family_members AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY participant_identifiers_principal_full ON public.participant_identifiers AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY migration_log_principal_full ON public.migration_log AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY historical_archive_principal_full ON public.historical_archive AS PERMISSIVE FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM vs_operators
  WHERE ((vs_operators.email = (auth.jwt() ->> 'email'::text)) AND (vs_operators.role = 'principal'::vs_operator_role)))));
CREATE POLICY google_oauth_staff_access ON public.google_oauth_connections AS PERMISSIVE FOR ALL TO authenticated USING (true);
CREATE POLICY sheet_mappings_staff_access ON public.google_sheet_mappings AS PERMISSIVE FOR ALL TO authenticated USING (true);
-- Supabase default grants
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
