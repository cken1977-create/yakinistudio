// VIZIONZ SANKOFA · header + fact strip for CRM record pages (presentational).

import type { ReactNode } from 'react'
import { MONO, SERIF } from '../ui'

export function RecordHeader({ kicker, title, pills, actions, accent = '#5B2C8F' }: {
  kicker: string; title: string; pills?: ReactNode; actions?: ReactNode; accent?: string
}) {
  return (
    <>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: accent, marginBottom: '12px', fontFamily: MONO }}>{kicker}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '34px', lineHeight: 1.15, fontWeight: 600, margin: 0, fontFamily: SERIF, overflowWrap: 'anywhere' }}>{title}</h1>
        {pills}
        {actions && <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>{actions}</div>}
      </div>
    </>
  )
}

export function Facts({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '1px', background: 'rgba(10,10,10,0.08)', border: '1px solid rgba(10,10,10,0.08)' }}>
      {items.map(([label, value]) => (
        <div key={label} style={{ background: '#FFFFFF', padding: '14px 18px', minWidth: 0 }}>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)', fontFamily: MONO, marginBottom: '4px' }}>{label}</div>
          <div style={{ fontSize: '15px', overflowWrap: 'anywhere' }}>{value ?? '—'}</div>
        </div>
      ))}
    </div>
  )
}
