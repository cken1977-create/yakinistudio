'use client'

// VIZIONZ SANKOFA · /funder/[token] · FunderPortalClient
//
// Truth-as-aesthetic funder dashboard. Pure presentation — no edits, no
// auth state, no admin actions. Just the funder's data, dense and honest.
//
// Sections:
//   1. Hero (funder name, scope statement, last updated)
//   2. Substrate rollup (5 stats)
//   3. Service categories breakdown with outcome distribution
//   4. Participants funded by this org
//   5. Cohorts where funded participants enrolled
//   6. Recent service log (last 50 entries)
//   7. Transparency footer

import type {
  FunderPortalData,
  FunderParticipantSummary,
  FunderCategoryRollup,
  FunderCohortSummary,
  FunderServiceRow,
} from './types'

const OUTCOME_COLORS: Record<string, { bg: string; fg: string }> = {
  completed: { bg: 'rgba(0, 122, 51, 0.12)', fg: '#007A33' },
  partial: { bg: 'rgba(180, 95, 0, 0.12)', fg: '#B45F00' },
  no_show: { bg: 'rgba(206, 17, 38, 0.12)', fg: '#CE1126' },
  cancelled: { bg: 'rgba(10, 10, 10, 0.08)', fg: 'rgba(10, 10, 10, 0.55)' },
  in_progress: { bg: 'rgba(91, 44, 143, 0.12)', fg: '#5B2C8F' },
}

const OUTCOME_LABELS: Record<string, string> = {
  completed: 'Completed',
  partial: 'Partial',
  no_show: 'No Show',
  cancelled: 'Cancelled',
  in_progress: 'In Progress',
}

const CATEGORY_COLORS: Record<string, string> = {
  Advocacy: '#5B2C8F',
  'Basic Needs': '#CE1126',
  'Case Management': '#0A0A0A',
  Programming: '#007A33',
  Referral: '#B45F00',
  Other: 'rgba(10, 10, 10, 0.55)',
}

export function FunderPortalClient({ data }: { data: FunderPortalData }) {
  const { funder, participants, services, cohorts, category_rollups, totals } =
    data

  const displayName =
    funder.organization_short_name &&
    funder.organization_short_name.trim().length > 0
      ? `${funder.organization_name} (${funder.organization_short_name})`
      : funder.organization_name

  const recentServices = services.slice(0, 50)

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#FAFAF8',
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '48px 24px 64px',
        }}
      >
        {/* Hero */}
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
            Funder Portal · Live Data
          </div>
          <h1
            style={{
              fontSize: '36px',
              lineHeight: 1.15,
              fontWeight: 600,
              color: '#0A0A0A',
              marginBottom: '16px',
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            {displayName}
          </h1>
          <p
            style={{
              fontSize: '16px',
              lineHeight: 1.65,
              color: 'rgba(10, 10, 10, 0.7)',
              maxWidth: '720px',
              marginBottom: '16px',
            }}
          >
            This is the live record of what your funding has produced at
            Vizionz Sankofa. Every service, every participant, every cohort —
            including outcomes that didn't go as planned. We show you the full
            picture because that's what trust looks like.
          </p>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 500,
              color: 'rgba(10, 10, 10, 0.5)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Updated {formatDateTime(data.last_updated_at)} · Refreshes every
            visit
            {funder.token_note && ` · ${funder.token_note}`}
          </div>
        </section>

        {/* Substrate rollup */}
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '1px',
            background: 'rgba(10, 10, 10, 0.08)',
            border: '1px solid rgba(10, 10, 10, 0.08)',
            marginBottom: '40px',
          }}
        >
          <Stat label="Participants Served" value={totals.participant_count.toString()} />
          <Stat
            label="Services Delivered"
            value={totals.service_count.toString()}
            accent="#5B2C8F"
          />
          <Stat label="Total Units" value={totals.unit_count.toString()} />
          <Stat
            label="Cost Tracked"
            value={
              totals.total_cost > 0
                ? `$${totals.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
                : '—'
            }
            accent="#007A33"
          />
          <Stat
            label="Cohorts Touched"
            value={totals.cohort_count.toString()}
            accent="#B45F00"
          />
        </section>

        {/* If nothing is funded yet */}
        {totals.service_count === 0 ? (
          <EmptyPortal funderName={funder.organization_name} />
        ) : (
          <>
            {/* Service categories */}
            <Section
              eyebrow="Where Your Funding Went"
              title="Services by Category"
              note="Including all outcomes — completed, partial, no-show, cancelled, in-progress. The truth, not the highlight reel."
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                }}
              >
                {category_rollups.map((rollup) => (
                  <CategoryCard key={rollup.category} rollup={rollup} />
                ))}
              </div>
            </Section>

            {/* Participants */}
            <Section
              eyebrow="Who Was Served"
              title={`Participants Funded by ${funder.organization_short_name ?? funder.organization_name}`}
              note="Each person whose services your dollars paid for, with their readiness trajectory where assessed."
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {participants.map((p) => (
                  <ParticipantCard key={p.participant_id} participant={p} />
                ))}
              </div>
            </Section>

            {/* Cohorts */}
            {cohorts.length > 0 && (
              <Section
                eyebrow="Cohort Enrollment"
                title="Where Funded Participants Were Active"
                note="Cohorts that included at least one participant whose services were funded by you."
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  {cohorts.map((c) => (
                    <CohortCard key={c.cohort_id} cohort={c} />
                  ))}
                </div>
              </Section>
            )}

            {/* Recent services log */}
            <Section
              eyebrow="Service Log"
              title={`Most Recent ${Math.min(50, services.length)} Services`}
              note="Reverse-chronological. Each row is a real unit of work delivered."
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                {recentServices.map((s) => (
                  <ServiceLogRow key={s.id} service={s} />
                ))}
              </div>
            </Section>
          </>
        )}

        {/* Transparency footer */}
        <footer
          style={{
            marginTop: '64px',
            paddingTop: '32px',
            borderTop: '1px solid rgba(10, 10, 10, 0.1)',
          }}
        >
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.5)',
              marginBottom: '12px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Transparency Note
          </div>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.65,
              color: 'rgba(10, 10, 10, 0.65)',
              marginBottom: '16px',
              maxWidth: '720px',
            }}
          >
            This dashboard reads directly from our operational case-management
            system. We don't curate it. We don't dress it up. If a service was
            no-shown, you see it. If a participant withdrew, you see it. If a
            cohort didn't fill, you see that too. We believe accountability
            starts with showing funders what actually happened.
          </p>
          <p
            style={{
              fontSize: '13px',
              lineHeight: 1.65,
              color: 'rgba(10, 10, 10, 0.65)',
              marginBottom: '24px',
              maxWidth: '720px',
            }}
          >
            Questions? Want to discuss what you're seeing? Reach out directly
            to Khadijah Asili, Executive Director.
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              flexWrap: 'wrap',
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            <a
              href="mailto:khadijahasili@vizionz.org"
              style={{ color: '#5B2C8F', textDecoration: 'none' }}
            >
              khadijahasili@vizionz.org
            </a>
            <span>·</span>
            <a
              href="https://myvizionz.org"
              style={{ color: '#5B2C8F', textDecoration: 'none' }}
            >
              myvizionz.org
            </a>
            <span>·</span>
            <span>Generated by Vizionz Sankofa</span>
          </div>
        </footer>
      </div>
    </main>
  )
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
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
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '26px',
          fontWeight: 600,
          color: accent ?? '#0A0A0A',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Section({
  eyebrow,
  title,
  note,
  children,
}: {
  eyebrow: string
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <section style={{ marginBottom: '48px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          marginBottom: '8px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontSize: '24px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: note ? '8px' : '20px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        {title}
      </h2>
      {note && (
        <p
          style={{
            fontSize: '14px',
            lineHeight: 1.6,
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '20px',
            maxWidth: '720px',
          }}
        >
          {note}
        </p>
      )}
      {children}
    </section>
  )
}

function CategoryCard({ rollup }: { rollup: FunderCategoryRollup }) {
  const color = CATEGORY_COLORS[rollup.category] ?? 'rgba(10, 10, 10, 0.55)'
  const outcomes = Object.entries(rollup.outcomes).filter(([, v]) => v > 0)

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: `4px solid ${color}`,
        borderRadius: '6px',
        padding: '16px 20px',
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: outcomes.length > 0 ? '12px' : 0,
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#0A0A0A',
          }}
        >
          {rollup.category}
        </div>
        <div
          style={{
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.6)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          <span>{rollup.service_count} services</span>
          <span>{rollup.unit_count} units</span>
          {rollup.total_cost > 0 && (
            <span style={{ color: '#007A33' }}>
              ${rollup.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>
      {outcomes.length > 0 && (
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {outcomes.map(([outcome, count]) => {
            const c = OUTCOME_COLORS[outcome] ?? OUTCOME_COLORS.completed
            return (
              <span
                key={outcome}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '4px',
                  background: c.bg,
                  color: c.fg,
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                {count} {OUTCOME_LABELS[outcome] ?? outcome}
              </span>
            )
          })}
        </div>
      )}
    </article>
  )
}

function ParticipantCard({
  participant,
}: {
  participant: FunderParticipantSummary
}) {
  const displayName =
    participant.preferred_name &&
    participant.preferred_name.trim().length > 0
      ? `${participant.preferred_name} (${participant.first_name} ${participant.last_name})`
      : `${participant.first_name} ${participant.last_name}`

  const trajectoryColor =
    participant.trajectory === null
      ? 'rgba(10, 10, 10, 0.5)'
      : participant.trajectory > 0
        ? '#007A33'
        : participant.trajectory < 0
          ? '#CE1126'
          : '#5B2C8F'

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '6px',
        padding: '14px 18px',
        background: '#FFFFFF',
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '4px',
          }}
        >
          {displayName}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {participant.city && `${participant.city} · `}
          {participant.service_count} services · {participant.total_units} units
          {participant.total_cost > 0 &&
            ` · $${participant.total_cost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
        </div>
      </div>
      {participant.baseline_composite !== null && (
        <div style={{ textAlign: 'right', minWidth: '120px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.5)',
              marginBottom: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Readiness
          </div>
          <div
            style={{
              fontSize: '13px',
              color: '#0A0A0A',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {participant.baseline_composite.toFixed(2)}
            {participant.most_recent_composite !== null &&
              participant.most_recent_composite !==
                participant.baseline_composite && (
                <>
                  {' → '}
                  <strong style={{ color: trajectoryColor }}>
                    {participant.most_recent_composite.toFixed(2)}
                  </strong>
                </>
              )}
          </div>
          {participant.trajectory !== null && participant.trajectory !== 0 && (
            <div
              style={{
                fontSize: '11px',
                color: trajectoryColor,
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                marginTop: '2px',
              }}
            >
              {participant.trajectory > 0 ? '+' : ''}
              {participant.trajectory.toFixed(2)}
            </div>
          )}
        </div>
      )}
    </article>
  )
}

function CohortCard({ cohort }: { cohort: FunderCohortSummary }) {
  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '6px',
        padding: '14px 18px',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}
    >
      <div style={{ fontSize: '22px', lineHeight: 1 }}>
        {cohort.program_icon ?? '📋'}
      </div>
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div
          style={{
            fontSize: '14px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '2px',
          }}
        >
          {cohort.cohort_name}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {cohort.program_name && `${cohort.program_name} · `}
          {formatDate(cohort.start_date)}
          {cohort.end_date && ` – ${formatDate(cohort.end_date)}`}
          {' · '}
          {cohort.status}
        </div>
      </div>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '4px 10px',
          borderRadius: '4px',
          background: 'rgba(91, 44, 143, 0.12)',
          color: '#5B2C8F',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {cohort.funded_participant_count}{' '}
        {cohort.funded_participant_count === 1 ? 'person' : 'people'}
      </div>
    </article>
  )
}

function ServiceLogRow({ service }: { service: FunderServiceRow }) {
  const categoryColor = service.service_category
    ? CATEGORY_COLORS[service.service_category] ?? 'rgba(10, 10, 10, 0.55)'
    : 'rgba(10, 10, 10, 0.55)'

  const displayName =
    service.participant_preferred_name &&
    service.participant_preferred_name.trim().length > 0
      ? `${service.participant_preferred_name} (${service.participant_first_name} ${service.participant_last_name})`
      : `${service.participant_first_name} ${service.participant_last_name}`

  const unitsLabel =
    service.units && service.service_unit
      ? `${service.units} ${service.service_unit}${service.units !== 1 ? 's' : ''}`
      : service.units
        ? `${service.units}`
        : ''

  const outcomeColors = service.outcome
    ? OUTCOME_COLORS[service.outcome] ?? null
    : null

  return (
    <div
      style={{
        border: '1px solid rgba(10, 10, 10, 0.08)',
        borderLeft: `3px solid ${categoryColor}`,
        borderRadius: '4px',
        padding: '10px 14px',
        background: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '10px',
      }}
    >
      <div
        style={{
          fontSize: '13px',
          fontWeight: 500,
          color: '#0A0A0A',
          flex: '1 1 200px',
          minWidth: 0,
        }}
      >
        {service.service_name ?? 'Service'}
        <div
          style={{
            fontSize: '11px',
            color: 'rgba(10, 10, 10, 0.55)',
            marginTop: '2px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {displayName} · {formatDate(service.delivered_at)}
        </div>
      </div>
      {unitsLabel && (
        <span
          style={{
            fontSize: '11px',
            color: 'rgba(10, 10, 10, 0.7)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {unitsLabel}
        </span>
      )}
      {service.cost_amount && Number(service.cost_amount) > 0 && (
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: '#007A33',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          ${Number(service.cost_amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      )}
      {outcomeColors && service.outcome && (
        <span
          style={{
            fontSize: '10px',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding: '2px 8px',
            borderRadius: '3px',
            background: outcomeColors.bg,
            color: outcomeColors.fg,
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {OUTCOME_LABELS[service.outcome] ?? service.outcome}
        </span>
      )}
    </div>
  )
}

function EmptyPortal({ funderName }: { funderName: string }) {
  return (
    <section
      style={{
        padding: '60px 40px',
        textAlign: 'center',
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        background: '#FFFFFF',
        marginBottom: '48px',
      }}
    >
      <h2
        style={{
          fontSize: '22px',
          fontWeight: 600,
          color: '#0A0A0A',
          marginBottom: '12px',
          fontFamily: '"DM Serif Display", Georgia, serif',
        }}
      >
        No funded services yet
      </h2>
      <p
        style={{
          fontSize: '14px',
          lineHeight: 1.65,
          color: 'rgba(10, 10, 10, 0.65)',
          maxWidth: '480px',
          margin: '0 auto',
        }}
      >
        No services have been logged with{' '}
        <strong>{funderName}</strong> as the funder source yet. This portal
        will populate the moment Khadijah logs the first one. Check back soon.
      </p>
    </section>
  )
}

function formatDate(d: string | null): string {
  if (!d) return ''
  try {
    const date = new Date(d.length === 10 ? d + 'T00:00:00' : d)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return d
  }
}

function formatDateTime(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
