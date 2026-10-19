// Contract document builder for Yakini E-Sign.
//
// The signing page renders exactly what buildContractDocument() returns, and the
// server hashes the canonical text of that same object when the client signs.
// The hash written to the record therefore covers what the signer was shown.

export type ContractRow = {
  id: string
  client_name: string
  client_email: string
  client_business: string | null
  contract_type: string | null
  contract_title: string
  status: string
  signing_token: string | null
  token_expires_at: string | null
  sent_at: string | null
  created_at: string | null
  viewed_at: string | null
  signed_at: string | null
  signer_name: string | null
}

export type ContractFieldRow = { field_name: string; field_value: string | null }

export type DocSection = { num: string; title: string; body: string }

export type ContractDocument = {
  title: string
  parties: { provider: string; client: string; clientBusiness: string | null }
  intro: string
  sections: DocSection[]
  version: string
}

export const DOCUMENT_VERSION = 'yakini-msa-2026-10-18'
export const PROVIDER = 'Yakini Digital Infrastructure LLC'

const FIELD_LABELS: Record<string, string> = {
  setup_fee: 'Setup Fee',
  monthly_retainer: 'Monthly Retainer',
  min_term: 'Minimum Term (months)',
  services: 'Services',
  special_terms: 'Special Terms',
}

function commercialTerms(fields: ContractFieldRow[]): string {
  const lines: string[] = []
  for (const key of Object.keys(FIELD_LABELS)) {
    const f = fields.find(x => x.field_name === key)
    const v = (f?.field_value ?? '').trim()
    if (!v) continue
    if (key === 'setup_fee' || key === 'monthly_retainer') {
      const n = v.replace(/^\$/, '')
      lines.push(`${FIELD_LABELS[key]}: $${n}`)
    } else if (key === 'services') {
      lines.push(`${FIELD_LABELS[key]}:\n${v}`)
    } else {
      lines.push(`${FIELD_LABELS[key]}: ${v}`)
    }
  }
  return lines.length ? lines.join('\n') : 'To be specified in the Statement of Work at project kickoff.'
}

export function buildContractDocument(c: ContractRow, fields: ContractFieldRow[]): ContractDocument {
  const client = c.client_name
  const biz = c.client_business?.trim() || null
  return {
    title: c.contract_title,
    parties: { provider: PROVIDER, client, clientBusiness: biz },
    intro:
      `This agreement is between ${PROVIDER}, a Delaware Limited Liability Company ("Yakini") and ` +
      `${client}${biz ? ` of ${biz}` : ''} ("Client").`,
    sections: [
      { num: '1', title: 'Services', body: 'Yakini agrees to provide digital infrastructure services as specified in the Statement of Work attached hereto, including website design and development, brand identity, marketing systems, AI-powered tools, and ongoing platform management.' },
      { num: '2', title: 'Intellectual Property', body: 'All Yakini infrastructure, templates, AI tools, and platform architecture remain the exclusive property of Yakini Digital Infrastructure LLC and BRSA Holdings, Inc. Client receives a non-exclusive, non-transferable license to use the Client Deliverables upon receipt of full payment. This license is revocable upon breach or non-payment.' },
      { num: '3', title: 'Payment Terms', body: 'Client agrees to pay the Setup Fee prior to commencement of work. Monthly Retainer payments are due on the first of each calendar month. Invoices unpaid after 10 business days accrue a 1.5% monthly late fee. Yakini may suspend services for accounts more than 30 days past due.' },
      { num: '4', title: 'Term and Termination', body: 'This agreement commences on the Effective Date and continues until terminated. Either party may terminate with 30 days written notice. Yakini may terminate immediately upon material breach or non-payment. Upon termination, all licenses are revoked and outstanding fees become immediately due.' },
      { num: '5', title: 'Confidentiality', body: 'Both parties agree to hold in strict confidence all Confidential Information disclosed during this engagement, including business plans, pricing, client data, and proprietary methodologies. This obligation survives termination for three years.' },
      { num: '6', title: 'Limitation of Liability', body: "Yakini's total liability under this agreement shall not exceed the total fees paid in the three months preceding the claim. In no event shall Yakini be liable for indirect, incidental, special, or consequential damages." },
      { num: '7', title: 'Governing Law', body: 'This agreement is governed by the laws of the State of Delaware. Disputes shall be resolved through good faith negotiation, and if unresolved, through binding arbitration under the rules of the American Arbitration Association.' },
      { num: '8', title: 'Electronic Signature', body: "The parties agree that electronic signatures are legally binding and fully enforceable under the U.S. Electronic Signatures in Global and National Commerce Act (ESIGN Act, 15 U.S.C. § 7001) and applicable state law. The electronic record of this agreement, including the signer's name, timestamp, IP address, and consent confirmation, constitutes a complete and binding execution of this agreement." },
      { num: '9', title: 'Statement of Work — Commercial Terms', body: commercialTerms(fields) },
    ],
    version: DOCUMENT_VERSION,
  }
}

/** Stable plain-text rendering used for hashing. Do not change without bumping DOCUMENT_VERSION. */
export function canonicalText(doc: ContractDocument): string {
  const parts = [
    `VERSION: ${doc.version}`,
    `TITLE: ${doc.title}`,
    `PROVIDER: ${doc.parties.provider}`,
    `CLIENT: ${doc.parties.client}${doc.parties.clientBusiness ? ` (${doc.parties.clientBusiness})` : ''}`,
    doc.intro,
    ...doc.sections.map(s => `${s.num}. ${s.title}\n${s.body}`),
  ]
  return parts.join('\n\n').replace(/\r\n/g, '\n')
}

export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

export const TOKEN_RE = /^[a-f0-9]{64}$/
export const LINK_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Expired when past token_expires_at, or more than 30 days after it was sent/created. */
export function isExpired(c: Pick<ContractRow, 'token_expires_at' | 'sent_at' | 'created_at'>, now = Date.now()): boolean {
  const hard = c.token_expires_at ? Date.parse(c.token_expires_at) : NaN
  if (!Number.isNaN(hard) && now > hard) return true
  const start = Date.parse(c.sent_at ?? c.created_at ?? '')
  if (!Number.isNaN(start) && now > start + LINK_TTL_MS) return true
  return false
}

export const CONSENT_TEXT =
  'I agree to do business electronically with Yakini Digital Infrastructure LLC. I have read the full document above, ' +
  'and I agree that my typed name and signature below are my legal electronic signature on it, with the same effect as a ' +
  'handwritten signature under the U.S. ESIGN Act (15 U.S.C. § 7001 et seq.) and applicable state law (UETA). ' +
  'I can ask admin@yakini.digital for a paper copy at no charge, and I can withdraw consent to electronic records ' +
  'before signing by closing this page and contacting admin@yakini.digital.'
