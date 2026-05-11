// VIZIONZ SANKOFA · /get-help
// Public intake form. Visitors submit requests for organizational support.
// Server component shell + client form component for interactivity.

import type { Metadata } from 'next'
import { GetHelpForm } from './GetHelpForm'

export const metadata: Metadata = {
  title: 'Get Help · Vizionz Sankofa',
  description:
    'Request support from Vizionz Sankofa — food assistance, family support, refugee and immigrant services, education, housing, and more.',
}

export default function GetHelpPage() {
  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        padding: '0',
      }}
    >
      {/* Tri-color rule — architectural signature carried into request flow */}
      <div
        style={{
          height: '3px',
          background:
            'linear-gradient(90deg, #CE1126 0%, #CE1126 33.33%, #0A0A0A 33.33%, #0A0A0A 66.66%, #007A33 66.66%, #007A33 100%)',
        }}
      />

      <div
        style={{
          maxWidth: '720px',
          margin: '0 auto',
          padding: '48px 24px',
        }}
      >
        {/* Header */}
        <header style={{ marginBottom: '40px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#CE1126',
              marginBottom: '12px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Request Support
          </div>

          <h1
            style={{
              fontSize: '36px',
              lineHeight: 1.15,
              fontWeight: 600,
              color: '#0A0A0A',
              marginBottom: '20px',
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            We meet you where you are.
          </h1>

          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.65,
              color: 'rgba(10, 10, 10, 0.7)',
              maxWidth: '600px',
              margin: 0,
            }}
          >
            Tell us about your situation and what you&apos;re looking for.
            Someone from Vizionz Sankofa will reach out within 48 hours.
            What you share stays between us and the people working on your
            request.
          </p>
        </header>

        {/* Form */}
        <GetHelpForm />

        {/* Footer note */}
        <div
          style={{
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            fontSize: '13px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.55)',
          }}
        >
          In immediate danger or crisis?{' '}
          <strong style={{ color: '#0A0A0A' }}>Call 911</strong> or the
          988 Suicide &amp; Crisis Lifeline. Vizionz Sankofa is not an
          emergency service.
        </div>
      </div>
    </main>
  )
}
