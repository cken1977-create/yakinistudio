// VIZIONZ SANKOFA · OBR (Organizational Readiness) types
// Mirrors supabase/migrations/20261017000600_vs_obr_readiness.sql

export type ObrStatus = 'not_started' | 'in_progress' | 'ready_for_review' | 'submitted' | 'rated'

export const OBR_STATUS_LABELS: Record<ObrStatus, string> = {
  not_started: 'Not started',
  in_progress: 'Intake in progress',
  ready_for_review: 'Ready for review',
  submitted: 'Submitted to evaluator',
  rated: 'Rated',
}

export type CertificationStatus =
  | 'not_started'
  | 'in_review'
  | 'certified'
  | 'not_certified'
  | 'expired'
  | 'revoked'

export const CERTIFICATION_LABELS: Record<CertificationStatus, string> = {
  not_started: 'Not started',
  in_review: 'In review',
  certified: 'Certified',
  not_certified: 'Not certified',
  expired: 'Expired',
  revoked: 'Revoked',
}

export type ObrProfile = {
  id: string
  is_self: boolean
  organization_id: string | null
  display_name: string
  status: ObrStatus
  ein: string | null
  legal_structure: string | null
  year_founded: number | null
  primary_contact_name: string | null
  primary_contact_email: string | null
  leadership_composition: string | null
  board_structure: string | null
  decision_process: string | null
  succession_plan: string | null
  staff_count: number | null
  turnover_rate: string | null
  training_programs: string | null
  behavioral_policy_docs: string | null
  active_policies: string | null
  last_audit_date: string | null
  compliance_history: string | null
  documentation_status: string | null
  annual_budget: number | null
  funding_sources: string | null
  reserves: string | null
  sustainability_plan: string | null
  submitted_at: string | null
  created_at: string
  updated_at: string
}

export const OBR_PROFILE_COLUMNS =
  'id, is_self, organization_id, display_name, status, ein, legal_structure, year_founded, ' +
  'primary_contact_name, primary_contact_email, leadership_composition, board_structure, ' +
  'decision_process, succession_plan, staff_count, turnover_rate, training_programs, ' +
  'behavioral_policy_docs, active_policies, last_audit_date, compliance_history, ' +
  'documentation_status, annual_budget, funding_sources, reserves, sustainability_plan, ' +
  'submitted_at, created_at, updated_at'

export type EvidenceStatus = 'missing' | 'on_file' | 'verified'

export const EVIDENCE_STATUS_LABELS: Record<EvidenceStatus, string> = {
  missing: 'Missing',
  on_file: 'On file',
  verified: 'Verified',
}

export type EvidenceKey =
  | 'bylaws'
  | 'org_chart'
  | 'audit'
  | 'policy_manual'
  | 'strategic_plan'
  | 'board_minutes'
  | 'budget'

// The OBR intake document list (from the BRSA OBR register flow) plus board
// minutes and budget, which VS already keeps in the Document Library.
export const EVIDENCE_ITEMS: { key: EvidenceKey; label: string; hint: string }[] = [
  { key: 'bylaws', label: 'Bylaws or operating agreement', hint: 'Current version of the bylaws' },
  { key: 'org_chart', label: 'Organizational chart', hint: 'Leadership and staff structure' },
  { key: 'audit', label: 'Most recent audit', hint: 'Financial audit or review from the last 2 years' },
  { key: 'policy_manual', label: 'Policy manual', hint: 'Staff handbook or policy documentation' },
  { key: 'strategic_plan', label: 'Strategic plan', hint: 'Current strategic or operating plan' },
  { key: 'board_minutes', label: 'Board minutes', hint: 'Recent board meeting minutes' },
  { key: 'budget', label: 'Operating budget', hint: 'Current fiscal-year budget' },
]

export type ObrEvidence = {
  id: string
  profile_id: string
  item_key: EvidenceKey | 'other'
  label: string | null
  status: EvidenceStatus
  document_id: string | null
  source: string | null
  notes: string | null
  attested_by_name: string | null
  attested_at: string
  updated_at: string
}

export type ObrRating = {
  id: string
  profile_id: string
  certification_status: CertificationStatus
  rating_label: string | null
  overall_score: number | null
  domain_scores: Record<string, number | null>
  standard_version: string
  ruleset_hash: string | null
  evaluation_run_id: string | null
  evaluator_name: string
  reviewed_on: string
  evidence_reviewed: string | null
  rationale: string
  is_override: boolean
  override_reason: string | null
  expires_on: string | null
  recorded_by_name: string | null
  created_at: string
}

// OBR domains (BRSA organizational readiness): governance & leadership,
// staff, policy & compliance, financial. Scores are entered as the evaluator
// issued them; nothing is computed here.
export const OBR_DOMAINS: { key: string; label: string }[] = [
  { key: 'governance', label: 'Governance & leadership' },
  { key: 'staff', label: 'Staff' },
  { key: 'policy', label: 'Policy & compliance' },
  { key: 'financial', label: 'Financial' },
]

export type DocumentOption = { id: string; title: string; category: string; document_date: string | null }
