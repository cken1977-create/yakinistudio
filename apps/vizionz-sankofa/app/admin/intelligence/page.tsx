// VIZIONZ SANKOFA · /admin/intelligence (Wave 3.4)
//
// Yakini Intelligence chat surface. Operator asks natural-language
// questions about VS organizational data; Yakini Intelligence retrieves
// grounded answers from documents and intakes with source citations.

import {
  requireOperatorOrEmployee,
  touchLastActive,
  getOperatorDisplayName,
} from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { IntelligenceChat } from './IntelligenceChat'

export const dynamic = 'force-dynamic'

export default async function IntelligencePage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)

  // Pull live substrate counts so the operator sees what Yakini Intelligence
  // can read before they ask. Empty substrate produces empty answers; this
  // is operator-honest UX.
  const supabase = await createClient()
  const { count: readyDocCount } = await supabase
    .from('vs_documents')
    .select('*', { count: 'exact', head: true })
    .eq('processing_status', 'ready')

  const { count: chunkCount } = await supabase
    .from('vs_document_chunks')
    .select('*', { count: 'exact', head: true })

  const { count: intakeCount } = await supabase
    .from('intake_requests')
    .select('*', { count: 'exact', head: true })

  const greetingName = getOperatorDisplayName(user)

  return (
    <div>
      {/* Welcome strip */}
      <section style={{ marginBottom: '40px' }}>
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#5B2C8F',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Yakini Intelligence · Wave 3.4
        </div>

        <h1
          style={{
            fontSize: '36px',
            lineHeight: 1.15,
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '12px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Ask anything about your organization, {greetingName}.
        </h1>

        <p
          style={{
            fontSize: '16px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.65)',
            maxWidth: '640px',
          }}
        >
          Yakini Intelligence reads your documents and intake records to give
          you grounded answers with source citations. Ask about programs,
          history, families, finances — anything that lives in your operating
          substrate.
        </p>
      </section>

      {/* Substrate readiness strip — what Yakini can actually read */}
      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          marginBottom: '40px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        <SubstrateCell
          label="Documents Ready"
          value={readyDocCount ?? 0}
          accent="#5B2C8F"
        />
        <SubstrateCell
          label="Indexed Chunks"
          value={chunkCount ?? 0}
          accent="#0A2548"
        />
        <SubstrateCell
          label="Intake Records"
          value={intakeCount ?? 0}
          accent="#007A33"
        />
      </section>

      {/* Chat surface */}
      <IntelligenceChat />
    </div>
  )
}

function SubstrateCell({
  label,
  value,
  accent,
}: {
  label: string
  value: number
  accent: string
}) {
  return (
    <div style={{ padding: '20px 24px', background: '#FFFFFF' }}>
      <div
        style={{
          fontSize: '9px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '8px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '28px',
          fontWeight: 600,
          color: accent,
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {value.toLocaleString()}
      </div>
    </div>
  )
}
