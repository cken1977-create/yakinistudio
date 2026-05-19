'use client'

// VIZIONZ SANKOFA · /admin/participants/[id] · ServicesTab
//
// Timeline of services delivered to this participant. Each row = one
// countable unit of work for grant reporting. Add-service modal includes
// service type dropdown grouped by category, outcome enum, units, cost,
// and funded-by attribution.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  ServiceWithJoins,
  ServiceEditableFields,
  ServiceOutcome,
  ServiceTypeRecord,
} from './types'
import {
  SERVICE_OUTCOME_LABELS,
  SERVICE_OUTCOME_COLORS,
  SERVICE_CATEGORY_COLORS,
} from './types'
import type { StaffRecord } from '../types'

export function ServicesTab({
  participantId,
  initialServices,
  serviceTypes,
  staff,
  defaultDelivererId,
}: {
  participantId: string
  initialServices: ServiceWithJoins[]
  serviceTypes: ServiceTypeRecord[]
  staff: StaffRecord[]
  defaultDelivererId: string | null
}) {
  const [services, setServices] = useState<ServiceWithJoins[]>(initialServices)
  const [adding, setAdding] = useState(false)

  // Rollups for substrate strip
  const totalDelivered = services.length
  const totalUnits = services.reduce((sum, s) => sum + (s.units ?? 0), 0)
  const totalCost = services.reduce(
    (sum, s) => sum + Number(s.cost_amount ?? 0),
    0,
  )
  const categoriesTouched = new Set(
    services
      .map((s) => s.service_type_category)
      .filter((c): c is string => !!c),
  ).size

  return (
    <div>
      {/* Substrate rollup strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '1px',
          background: 'rgba(10, 10, 10, 0.08)',
          border: '1px solid rgba(10, 10, 10, 0.08)',
          marginBottom: '28px',
        }}
      >
        <ServiceStat label="Services" value={totalDelivered.toString()} />
        <ServiceStat label="Total Units" value={totalUnits.toString()} />
        <ServiceStat
          label="Categories"
          value={categoriesTouched.toString()}
          accent="#5B2C8F"
        />
        <ServiceStat
          label="Cost Tracked"
          value={
            totalCost > 0
              ? `$${totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`
              : '—'
          }
          accent="#007A33"
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: 'rgba(10, 10, 10, 0.55)',
              marginBottom: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            Services Delivered
          </div>
          <div
            style={{
              fontSize: '14px',
              color: 'rgba(10, 10, 10, 0.65)',
            }}
          >
            Every countable unit of work, in reverse-chronological order.
          </div>
        </div>
        <button
          onClick={() => setAdding(true)}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          + Log Service
        </button>
      </div>

      {/* Timeline */}
      {services.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
          }}
        >
          {services.map((s) => (
            <ServiceRow key={s.id} service={s} />
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <LogServiceModal
          participantId={participantId}
          serviceTypes={serviceTypes}
          staff={staff}
          defaultDelivererId={defaultDelivererId}
          onClose={() => setAdding(false)}
          onSaved={(newService) => {
            setServices((prev) => [newService, ...prev])
            setAdding(false)
          }}
        />
      )}
    </div>
  )
}

function ServiceStat({
  label,
  value,
  accent,
}: {
  label: string
  value: string
  accent?: string
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: '10px',
          fontWeight: 600,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.5)',
          marginBottom: '6px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: '20px',
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

function ServiceRow({ service }: { service: ServiceWithJoins }) {
  const categoryColor = service.service_type_category
    ? SERVICE_CATEGORY_COLORS[service.service_type_category] ??
      'rgba(10, 10, 10, 0.55)'
    : 'rgba(10, 10, 10, 0.55)'

  const unitsLabel =
    service.units && service.service_type_unit
      ? `${service.units} ${service.service_type_unit}${service.units !== 1 ? 's' : ''}`
      : service.units
        ? `${service.units}`
        : ''

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderLeft: `4px solid ${categoryColor}`,
        borderRadius: '6px',
        padding: '16px 20px',
        background: '#FFFFFF',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '10px',
          marginBottom: service.notes ? '10px' : 0,
        }}
      >
        <div
          style={{
            fontSize: '15px',
            fontWeight: 600,
            color: '#0A0A0A',
            flex: '0 1 auto',
          }}
        >
          {service.service_type_name ?? 'Service'}
        </div>
        {service.service_type_category && (
          <CategoryPill
            label={service.service_type_category}
            color={categoryColor}
          />
        )}
        {service.outcome && <OutcomePill outcome={service.outcome} />}
        {unitsLabel && (
          <span
            style={{
              fontSize: '12px',
              fontWeight: 500,
              color: 'rgba(10, 10, 10, 0.7)',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(10, 10, 10, 0.05)',
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
              fontSize: '12px',
              fontWeight: 500,
              color: '#007A33',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'rgba(0, 122, 51, 0.08)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            $
            {Number(service.cost_amount).toLocaleString(undefined, {
              maximumFractionDigits: 0,
            })}
          </span>
        )}
      </div>
      <div
        style={{
          fontSize: '12px',
          color: 'rgba(10, 10, 10, 0.55)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          marginBottom: service.notes ? '10px' : 0,
        }}
      >
        {formatDateTime(service.delivered_at)}
        {service.delivered_by_name && ` · ${service.delivered_by_name}`}
        {service.cost_funded_by && ` · Funded by ${service.cost_funded_by}`}
      </div>
      {service.notes && (
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.55,
            color: 'rgba(10, 10, 10, 0.8)',
            whiteSpace: 'pre-wrap',
          }}
        >
          {service.notes}
        </div>
      )}
    </article>
  )
}

function CategoryPill({ label, color }: { label: string; color: string }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: `${color}1A`,
        color,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {label}
    </span>
  )
}

function OutcomePill({ outcome }: { outcome: ServiceOutcome }) {
  const colors = SERVICE_OUTCOME_COLORS[outcome]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: colors.bg,
        color: colors.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {SERVICE_OUTCOME_LABELS[outcome]}
    </span>
  )
}

function EmptyState() {
  return (
    <div
      style={{
        padding: '60px 24px',
        textAlign: 'center',
        border: '1px dashed rgba(10, 10, 10, 0.18)',
        borderRadius: '8px',
        background: '#FAFAF8',
      }}
    >
      <div
        style={{
          fontSize: '14px',
          color: 'rgba(10, 10, 10, 0.6)',
        }}
      >
        No services logged yet. Click + Log Service to record the first
        unit of work delivered to this participant.
      </div>
    </div>
  )
}

function LogServiceModal({
  participantId,
  serviceTypes,
  staff,
  defaultDelivererId,
  onClose,
  onSaved,
}: {
  participantId: string
  serviceTypes: ServiceTypeRecord[]
  staff: StaffRecord[]
  defaultDelivererId: string | null
  onClose: () => void
  onSaved: (service: ServiceWithJoins) => void
}) {
  const now = new Date()
  const nowLocal = toLocalDateTimeInputValue(now)

  // Group service types by category for the dropdown
  const grouped = useMemo(() => {
    const map = new Map<string, ServiceTypeRecord[]>()
    serviceTypes.forEach((st) => {
      const cat = st.category ?? 'Other'
      if (!map.has(cat)) map.set(cat, [])
      map.get(cat)!.push(st)
    })
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [serviceTypes])

  const [delivererId, setDelivererId] = useState<string>(
    defaultDelivererId ?? '',
  )
  const [draft, setDraft] = useState<ServiceEditableFields>({
    service_type_id: serviceTypes[0]?.id ?? '',
    delivered_at: nowLocal,
    units: 1,
    outcome: 'completed',
    notes: null,
    cost_amount: null,
    cost_funded_by: null,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof ServiceEditableFields>(
    key: K,
    value: ServiceEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    if (!draft.service_type_id) {
      setErrorMsg('Select a service type.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()
      const deliveredISO = new Date(draft.delivered_at).toISOString()

      const insertPayload = {
        participant_id: participantId,
        service_type_id: draft.service_type_id,
        delivered_by_id: delivererId || null,
        delivered_at: deliveredISO,
        units: draft.units,
        outcome: draft.outcome,
        notes: draft.notes,
        cost_amount: draft.cost_amount,
        cost_funded_by: draft.cost_funded_by,
      }

      const { data, error } = await supabase
        .from('services_delivered')
        .insert(insertPayload)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      // Decorate with join data for display
      const serviceType = serviceTypes.find(
        (st) => st.id === draft.service_type_id,
      )
      const delivererStaff = staff.find((s) => s.id === delivererId)

      const decorated: ServiceWithJoins = {
        ...(data as unknown as ServiceWithJoins),
        service_type_name: serviceType?.name ?? null,
        service_type_category: serviceType?.category ?? null,
        service_type_unit: serviceType?.countable_unit ?? null,
        delivered_by_name: delivererStaff?.full_name ?? null,
      }
      onSaved(decorated)
    })
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.45)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '600px',
          background: '#FFFFFF',
          borderRadius: '12px',
          padding: '32px',
          boxShadow: '0 24px 64px rgba(10, 10, 10, 0.25)',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 600,
            color: '#0A0A0A',
            marginBottom: '6px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          Log Service
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          Record one unit of work delivered. This counts toward grant
          reporting.
        </p>

        <Field label="Service Type *">
          <select
            value={draft.service_type_id}
            onChange={(e) => update('service_type_id', e.target.value)}
            style={inputStyle}
          >
            {grouped.map(([category, types]) => (
              <optgroup key={category} label={category}>
                {types.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name}
                    {st.countable_unit ? ` (${st.countable_unit})` : ''}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </Field>

        <Row>
          <Field label="When *">
            <input
              type="datetime-local"
              value={draft.delivered_at}
              onChange={(e) => update('delivered_at', e.target.value)}
              style={inputStyle}
            />
          </Field>
          <Field label="Outcome">
            <select
              value={draft.outcome ?? 'completed'}
              onChange={(e) =>
                update('outcome', e.target.value as ServiceOutcome)
              }
              style={inputStyle}
            >
              {(
                Object.keys(SERVICE_OUTCOME_LABELS) as ServiceOutcome[]
              ).map((o) => (
                <option key={o} value={o}>
                  {SERVICE_OUTCOME_LABELS[o]}
                </option>
              ))}
            </select>
          </Field>
        </Row>

        <Row>
          <Field label="Delivered By">
            <select
              value={delivererId}
              onChange={(e) => setDelivererId(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                  {s.role ? ` (${s.role})` : ''}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Units">
            <input
              type="number"
              min="0"
              step="1"
              value={draft.units ?? ''}
              onChange={(e) =>
                update('units', e.target.value ? Number(e.target.value) : null)
              }
              style={inputStyle}
            />
          </Field>
        </Row>

        <Row>
          <Field label="Cost ($)">
            <input
              type="number"
              min="0"
              step="0.01"
              value={draft.cost_amount ?? ''}
              onChange={(e) =>
                update('cost_amount', e.target.value || null)
              }
              placeholder="0.00"
              style={inputStyle}
            />
          </Field>
          <Field label="Funded By">
            <input
              type="text"
              value={draft.cost_funded_by ?? ''}
              onChange={(e) => update('cost_funded_by', e.target.value || null)}
              placeholder="ACS, ACF, City of ABQ, general fund, etc."
              style={inputStyle}
            />
          </Field>
        </Row>

        <Field label="Notes (optional)">
          <textarea
            value={draft.notes ?? ''}
            onChange={(e) => update('notes', e.target.value || null)}
            rows={3}
            placeholder="Any context worth recording — what was needed, what was provided, what comes next."
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        {errorMsg && (
          <div
            style={{
              padding: '10px 14px',
              background: 'rgba(206, 17, 38, 0.08)',
              color: '#CE1126',
              borderRadius: '6px',
              fontSize: '13px',
              marginBottom: '16px',
            }}
          >
            {errorMsg}
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: '10px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}
        >
          <button
            onClick={onClose}
            disabled={pending}
            style={cancelBtn(pending)}
          >
            Cancel
          </button>
          <button onClick={save} disabled={pending} style={saveBtn(pending)}>
            {pending ? 'Saving…' : 'Log Service'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
      }}
    >
      {children}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label
          style={{
            display: 'block',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'rgba(10, 10, 10, 0.55)',
            marginBottom: '6px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid rgba(10, 10,10, 0.16)',
  borderRadius: '6px',
  fontSize: '14px',
  color: '#0A0A0A',
  background: '#FFFFFF',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
}

function cancelBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid rgba(10, 10, 10, 0.16)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
  }
}

function saveBtn(pending: boolean): React.CSSProperties {
  return {
    padding: '10px 18px',
    border: '1px solid #0A0A0A',
    background: '#0A0A0A',
    color: '#FFFFFF',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 600,
    cursor: pending ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
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

function toLocalDateTimeInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
