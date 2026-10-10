// ═════════════════════════════════════════════════════════════════════════
// YAKINI INDUSTRY KITS — shared data
// File: apps/yakini.digital/lib/industry-kits.ts
//
// Vertical kits shown on /platforms (and mirrored on the homepage) so a
// visitor can find their industry fast.
//
// Rules:
//   - "proven" kits point at a LIVE Yakini platform as proof.
//   - "ready" kits are real offerings you can scope today. They never claim
//     a live deployment, metrics, or launch dates. No TBD, no placeholders.
//   - applyIndustry must match an option in app/(marketing)/apply INDUSTRIES
//     so /apply?kit=<id> can preselect it.
// ═════════════════════════════════════════════════════════════════════════

export type IndustryKit = {
  id: string
  name: string
  industry: string
  short: string
  forWho: string
  includes: string[]
  aiTools: string[]
  status: 'proven' | 'ready'
  proof?: { name: string; anchor: string }
  applyIndustry: string
}

export const INDUSTRY_KITS: IndustryKit[] = [
  {
    id: 'legal-advocacy-kit',
    name: 'Legal & Advocacy Kit',
    industry: 'LEGAL SERVICES · LAW PRACTICE · TOW DEFENSE · CONSUMER PROTECTION',
    short: 'Legal & law practice',
    forWho:
      'Law practices, tow defense services, and consumer advocates still running intake, case queues, and client updates on forms and spreadsheets.',
    includes: [
      'Multi-step evidentiary intake',
      'AI case-strength triage with statute citations',
      'Client portal with magic-link sign-in',
      'Case queue and admin command center',
      'Demand letters and one-page hearing briefs',
      'Per-case revenue tracking',
    ],
    aiTools: ['Case Triage', 'Letter Generation', 'Hearing Prep', 'License Verification'],
    status: 'proven',
    proof: { name: 'TheyTowedMyCar.com', anchor: 'theytowedmycar' },
    applyIndustry: 'Tow defense / Legal services',
  },
  {
    id: 'nonprofit-community-kit',
    name: 'Nonprofit & Community Kit',
    industry: 'NONPROFIT · COMMUNITY SERVICES',
    short: 'Nonprofit & community',
    forWho:
      'Community organizations serving families on lean budgets — with high accountability to funders and boards.',
    includes: [
      'Household and family case management',
      'Grant deliverable tracking',
      'Funder-ready impact dashboards',
      'English + Spanish family-facing materials',
      'Outcome reports drafted for you',
    ],
    aiTools: ['Document Generation', 'Family Communication', 'Pattern Analysis'],
    status: 'proven',
    proof: { name: 'Vizionz Sankofa', anchor: 'vizionz-sankofa' },
    applyIndustry: 'Nonprofit / Community services',
  },
  {
    id: 'workforce-readiness-kit',
    name: 'Workforce & Readiness Kit',
    industry: 'WORKFORCE · REENTRY · CORRECTIONS',
    short: 'Workforce & reentry',
    forWho:
      'Reentry, workforce, and corrections programs that have to document readiness — with an audit trail that holds up.',
    includes: [
      'Participant registry and evidence intake',
      'Deterministic, version-locked readiness scoring',
      'Evaluator console',
      'Longitudinal record vault',
      'Audit-ready reporting',
    ],
    aiTools: ['Document Integrity', 'Evidence Engagement Scoring', 'Pattern Analysis'],
    status: 'proven',
    proof: { name: 'Kamili', anchor: 'vimaa' },
    applyIndustry: 'Workforce / Reentry / Corrections',
  },
  {
    id: 'insurance-agency-kit',
    name: 'Insurance Agency Kit',
    industry: 'INSURANCE · AGENCIES · BROKERS',
    short: 'Insurance agencies',
    forWho:
      'Independent agencies and brokers drowning in quote requests, renewals, and policy follow-ups across inboxes and shared drives.',
    includes: [
      'Lead and quote intake tuned to your lines',
      'Pipeline for new business and renewals',
      'Client portal for documents and status',
      'Renewal and certificate reminders',
      'Producer and office workflow board',
      'Client communications drafted in your voice',
    ],
    aiTools: ['Quote Triage', 'Renewal Summaries', 'Client Communication', 'Document Generation'],
    status: 'ready',
    applyIndustry: 'Insurance / Agencies / Brokers',
  },
  {
    id: 'accounting-kit',
    name: 'Accounting & Advisory Kit',
    industry: 'ACCOUNTING · BOOKKEEPING · ADVISORY',
    short: 'Accounting & advisory',
    forWho:
      'CPA firms, bookkeepers, and advisors juggling client intake, document collection, and seasonal spikes without a shared operating floor.',
    includes: [
      'Client onboarding and engagement intake',
      'Secure document vault and request lists',
      'Deadline and filing calendar',
      'Client portal with magic-link access',
      'Internal work queue by engagement',
      'Client updates drafted from your notes',
    ],
    aiTools: ['Document Checklist', 'Client Communication', 'Deadline Summaries'],
    status: 'ready',
    applyIndustry: 'Accounting / Bookkeeping / Advisory',
  },
  {
    id: 'field-operations-kit',
    name: 'Field Operations Kit',
    industry: 'INDUSTRIAL · ENERGY · TRADES · FLEET & FIELD CREWS',
    short: 'Industrial & field ops',
    forWho:
      'Industrial service companies, oilfield crews, trades, and fleet operators running jobs, hours, and compliance across plants and miles — still on radios, clipboards, and spreadsheets.',
    includes: [
      'Bids, estimates, and job pipeline',
      'Crew dispatch and job board',
      'Job cost through invoicing',
      'Mobile incident and daily reporting',
      'Certification and compliance tracking',
      'Equipment log and client job-status portal',
    ],
    aiTools: ['Incident Triage', 'Compliance Verification', 'Customer Communication', 'Strategic Analysis'],
    status: 'ready',
    applyIndustry: 'Industrial / Field operations',
  },
  {
    id: 'hospitality-kit',
    name: 'Hospitality & Private Client Kit',
    industry: 'HOSPITALITY · PRIVATE DINING · GUEST SERVICES',
    short: 'Hospitality & private dining',
    forWho:
      'Private chefs, caterers, and boutique hospitality operators juggling bookings across DMs, texts, and disconnected tools.',
    includes: [
      'Inquiry and booking intake',
      'Event and stay quoting',
      'Deposits and signed digital agreements',
      'Private guest portal with timeline and alerts',
      'Preference and menu archive',
      'Guest communications drafted in your voice',
    ],
    aiTools: ['Smart Quoting', 'Customer Communication', 'Letter Generation'],
    status: 'ready',
    applyIndustry: 'Private chef / Catering / Hospitality',
  },
]

/** Larger operator / enterprise-style engagements — proof language only. No invented metrics, domains, or LIVE claims. */
export type OperatorBuild = {
  id: string
  name: string
  label: string
  scope: string
  note: string
}

export const OPERATOR_BUILDS: OperatorBuild[] = [
  {
    id: 'industrial-operator',
    name: 'Industrial Operator Floor',
    label: 'INDUSTRIAL · OPERATOR FLOOR',
    scope: 'Operator system for how the company runs jobs — bids, crews, job cost, and the floor work that spreadsheets leak.',
    note: 'Larger industrial build. Scoped for an established field operator — not a marketing site.',
  },
  {
    id: 'enterprise-operator',
    name: 'Enterprise-scope operator system',
    label: 'OPERATOR · ENTERPRISE SCOPE',
    scope: 'A larger operator-system engagement — proof that Yakini builds for companies that need more than a brochure.',
    note: 'Enterprise-style scope. Details stay with the client until they go live.',
  },
]
