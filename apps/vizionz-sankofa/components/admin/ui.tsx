// VIZIONZ SANKOFA · small shared admin UI pieces
// Same look as the existing admin surfaces (Organizations, Cohorts, Grants):
// mono uppercase kickers, DM Serif headings, hairline stat strips, white
// cards with soft borders, black primary buttons. Presentational only, so it
// can be used from server and client components.

import type { CSSProperties, ReactNode } from 'react'
import { formatDateValue, todayInMountain } from '@/lib/format/datetime'

export const MONO = 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace'
export const SERIF = '"DM Serif Display", Georgia, serif'

export function PageIntro({
  kicker,
  title,
  children,
  accent = '#5B2C8F',
}: {
  kicker: string
  title: string
  children?: ReactNode
  accent?: string
}) {
  return (
    <section style={{ marginBottom: '32px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: accent,
          marginBottom: '12px',
          fontFamily: MONO,
        }}
      >
        {kicker}
      </div>
      <h1
        style={{
          fontSize: '36px',
          lineHeight: 1.15,
          fontWeight: 600,
          color: '#0A0A0A',
          margin: '0 0 12px',
          fontFamily: SERIF,
        }}
      >
        {title}
      </h1>
      {children && (
        <div style={{ fontSize: '16px', lineHeight: 1.6, color: 'rgba(10, 10, 10, 0.65)', maxWidth: '680px' }}>
          {children}
        </div>
      )}
    </section>
  )
}

export function StatStrip({ children }: { children: ReactNode }) {
  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
        gap: '1px',
        background: 'rgba(10, 10, 10, 0.08)',
        marginBottom: '32px',
        border: '1px solid rgba(10, 10, 10, 0.08)',
      }}
    >
      {children}
    </section>
  )
}

export function Stat({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div style={{ background: '#FFFFFF', padding: '20px 24px' }}>
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '8px',
          fontFamily: MONO,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: '24px', fontWeight: 600, color: accent ?? '#0A0A0A', fontFamily: SERIF }}>{value}</div>
    </div>
  )
}

export function SectionLabel({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        margin: '0 0 16px',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          fontFamily: MONO,
        }}
      >
        {children}
      </div>
      {right}
    </div>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
        background: '#FFFFFF',
        ...style,
      }}
    >
      {children}
    </article>
  )
}

export function Pill({ children, fg = '#5B2C8F', bg = 'rgba(91, 44, 143, 0.12)' }: { children: ReactNode; fg?: string; bg?: string }) {
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: bg,
        color: fg,
        fontFamily: MONO,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

export const TONES = {
  green: { fg: '#007A33', bg: 'rgba(0, 122, 51, 0.12)' },
  red: { fg: '#CE1126', bg: 'rgba(206, 17, 38, 0.12)' },
  purple: { fg: '#5B2C8F', bg: 'rgba(91, 44, 143, 0.12)' },
  amber: { fg: '#7A5A00', bg: 'rgba(180, 130, 0, 0.12)' },
  navy: { fg: '#0A2548', bg: 'rgba(10, 37, 72, 0.1)' },
  grey: { fg: 'rgba(10, 10, 10, 0.55)', bg: 'rgba(10, 10, 10, 0.08)' },
} as const

export function Notice({ children, tone = 'amber' }: { children: ReactNode; tone?: keyof typeof TONES }) {
  const t = TONES[tone]
  return (
    <div
      role="status"
      style={{
        border: `1px solid ${t.fg}33`,
        background: t.bg,
        color: '#0A0A0A',
        borderRadius: '8px',
        padding: '14px 18px',
        fontSize: '14px',
        lineHeight: 1.55,
        marginBottom: '24px',
      }}
    >
      {children}
    </div>
  )
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div
      style={{
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        padding: '32px 24px',
        textAlign: 'center',
        background: '#FFFFFF',
      }}
    >
      <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: SERIF, marginBottom: '6px' }}>{title}</div>
      {children && <div style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.6)', lineHeight: 1.55 }}>{children}</div>}
    </div>
  )
}

export function Meta({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: '12px', color: 'rgba(10, 10, 10, 0.55)', fontFamily: MONO, letterSpacing: '0.04em', lineHeight: 1.6 }}>
      {children}
    </div>
  )
}

// ─── Form bits ──────────────────────────────────────────────────────────────

export function Row({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
      {children}
    </div>
  )
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label style={{ display: 'block', marginBottom: '16px' }}>
      <span
        style={{
          display: 'block',
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '6px',
          fontFamily: MONO,
        }}
      >
        {label}
      </span>
      {children}
      {hint && <span style={{ display: 'block', fontSize: '12px', color: 'rgba(10, 10, 10, 0.5)', marginTop: '4px' }}>{hint}</span>}
    </label>
  )
}

export const inputStyle: CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10, 10, 10, 0.16)',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

export const textareaStyle: CSSProperties = { ...inputStyle, minHeight: '84px', resize: 'vertical', lineHeight: 1.5 }

export function primaryBtn(disabled = false): CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid #0A0A0A',
    background: '#0A0A0A',
    color: '#FFFFFF',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  }
}

export function secondaryBtn(disabled = false): CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid rgba(10, 10, 10, 0.16)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.6 : 1,
    fontFamily: 'inherit',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
  }
}

export function miniBtn(disabled = false, danger = false): CSSProperties {
  return {
    padding: '6px 12px',
    border: danger ? '1px solid rgba(206, 17, 38, 0.4)' : '1px solid rgba(10, 10, 10, 0.18)',
    background: '#FFFFFF',
    color: danger ? '#CE1126' : '#0A0A0A',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
}

export function TabBar<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[]
  active: T
  onChange: (key: T) => void
}) {
  return (
    <nav
      role="tablist"
      style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', borderBottom: '1px solid rgba(10, 10, 10, 0.12)', marginBottom: '28px' }}
    >
      {tabs.map((t) => {
        const isActive = t.key === active
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange(t.key)}
            style={{
              padding: '12px 20px',
              border: 'none',
              background: 'transparent',
              color: isActive ? '#0A0A0A' : 'rgba(10, 10, 10, 0.5)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              borderBottom: isActive ? '3px solid #5B2C8F' : '3px solid transparent',
              marginBottom: '-1px',
            }}
          >
            {t.label}
            {typeof t.count === 'number' && t.count > 0 && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: isActive ? '#5B2C8F' : 'rgba(10, 10, 10, 0.4)', fontFamily: MONO }}>
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </nav>
  )
}

export function FilterButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 12px',
        fontSize: '11px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: active ? '#FFFFFF' : '#0A0A0A',
        background: active ? '#0A2548' : '#FFFFFF',
        border: `1px solid ${active ? '#0A2548' : 'rgba(10, 10, 10, 0.15)'}`,
        borderRadius: '2px',
        cursor: 'pointer',
        fontFamily: MONO,
      }}
    >
      {label}
    </button>
  )
}

export function formatDay(d: string | null | undefined): string {
  if (!d) return '—'
  return formatDateValue(d)
}

/** Today as YYYY-MM-DD in Mountain time (Vercel servers run in UTC). */
export function todayIso(): string {
  return todayInMountain()
}

/** Supabase error = the new tables are not in the database yet. */
export function isMissingTable(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false
  return err.code === '42P01' || err.code === 'PGRST205' || /does not exist|schema cache/i.test(err.message ?? '')
}

/** Today as YYYY-MM-DD in Mountain time (VS is in Albuquerque; servers run in UTC). */
export function todayMountain(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}
