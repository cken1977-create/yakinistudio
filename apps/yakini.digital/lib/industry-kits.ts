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
    industry: 'LEGAL SERVICES · TOW DEFENSE · CONSUMER PROTECTION',
    short: 'Tow defense & legal',
    forWho:
      'Tow defense services, consumer advocates, and case-based legal practices still running intake on forms and spreadsheets.',
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
    proof: { name: 'Vimaa / Legacyline', anchor: 'vimaa' },
    applyIndustry: 'Workforce / Reentry / Corrections',
  },
  {
    id: 'field-operations-kit',
    name: 'Field Operations Kit',
    industry: 'ENERGY · TRADES · FLEET & FIELD CREWS',
    short: 'Energy & field ops',
    forWho:
      'Oilfield service companies, trades, and fleet operators running crews across hundreds of miles on radios and clipboards.',
    includes: [
      'Crew dispatch and job board',
      'Mobile incident reporting with AI severity triage',
      'Certification and compliance tracking',
      'Equipment and vehicle maintenance log',
      'Client job-status portal',
      'Automated client reporting',
    ],
    aiTools: ['Incident Triage', 'Compliance Verification', 'Customer Communication', 'Strategic Analysis'],
    status: 'ready',
    applyIndustry: 'Oilfield services / Energy',
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
