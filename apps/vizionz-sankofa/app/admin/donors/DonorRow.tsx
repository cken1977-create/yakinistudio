'use client'

// VIZIONZ SANKOFA · /admin/donors · DonorRow component (Wave 3.5)
//
// Single donor card. Three modes: view (default), edit, gift entry.
// Gift history accordion fetches lazily on first expand.

import { useState, useTransition, useCallback } from 'react'
import {
  type DonorRecord,
  type GiftRecord,
  type DonorType,
  type DonorStatus,
  type GiftMethod,
  DONOR_TYPE_LABELS,
  DONOR_STATUS_LABELS,
  GIFT_METHOD_LABELS,
  DONOR_STATUS_COLORS,
  formatCurrency,
  dollarsToCents,
} from './types'
import {
  updateDonor,
  deleteDonor,
  recordGift,
} from '../actions/donors'

type Props = {
  donor: DonorRecord
}

export function DonorRow({ donor: initialDonor }: Props) {
  const [donor, setDonor] = useState<DonorRecord>(initialDonor)
  const [mode, setMode] = useState<'view' | 'edit' | 'gift_entry'>('view')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [historyExpanded, setHistoryExpanded] = useState(false)
  const [gifts, setGifts] = useState<GiftRecord[] | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Gift history is loaded on first expand to keep initial render light
  const loadGifts = useCallback(async () => {
    setHistoryExpanded(true)
    if (gifts !== null) return
    try {
      const res = await fetch(`/api/admin/donors/${donor.id}/gifts`, {
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        setGifts(data.gifts || [])
      } else {
        setGifts([])
      }
    } catch {
      setGifts([])
    }
  }, [donor.id, gifts])

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteDonor(donor.id)
      if (!result.ok) {
        setError(result.error)
        setConfirmDelete(false)
      }
      // Success → row will disappear when parent revalidates.
    })
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid rgba(10, 10, 10, 0.08)',
        marginBottom: '8px',
        padding: '16px 20px',
      }}
    >
      {mode === 'view' && (
        <ViewMode
          donor={donor}
          historyExpanded={historyExpanded}
          gifts={gifts}
          onEdit={() => setMode('edit')}
          onGiftEntry={() => setMode('gift_entry')}
          onToggleHistory={loadGifts}
          onCollapseHistory={() => setHistoryExpanded(false)}
          onDelete={() => setConfirmDelete(true)}
        />
      )}

      {mode === 'edit' && (
        <EditMode
          donor={donor}
          isPending={isPending}
          onCancel={() => setMode('view')}
          onSave={(updated) =>
            startTransition(async () => {
              setError(null)
              const result = await updateDonor(donor.id, updated)
              if (!result.ok) {
                setError(result.error)
                return
              }
              setDonor({ ...donor, ...updated, display_name: updated.display_name ?? donor.display_name })
              setMode('view')
            })
          }
        />
      )}

      {mode === 'gift_entry' && (
        <GiftEntryMode
          donorId={donor.id}
          isPending={isPending}
          onCancel={() => setMode('view')}
          onSave={(input) =>
            startTransition(async () => {
              setError(null)
              const result = await recordGift(input)
              if (!result.ok) {
                setError(result.error)
                return
              }
              // Reset gifts cache to force reload, expand accordion
              setGifts(null)
              setHistoryExpanded(false)
              setMode('view')
              setTimeout(() => loadGifts(), 100)
            })
          }
        />
      )}

      {confirmDelete && (
        <div
          style={{
            marginTop: '12px',
            padding: '12px 16px',
            background: 'rgba(206, 17, 38, 0.05)',
            border: '1px solid #CE1126',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '13px', color: '#0A0A0A' }}>
            Delete <strong>{donor.display_name}</strong> and all gift records? This cannot be undone.
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              disabled={isPending}
              style={ghostButtonStyle}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isPending}
              style={{ ...primaryButtonStyle, background: '#CE1126' }}
            >
              {isPending ? 'Deleting…' : 'Yes, delete'}
            </button>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: 'rgba(206, 17, 38, 0.08)',
            border: '1px solid #CE1126',
            color: '#CE1126',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}
    </div>
  )
}

// ─── View mode ───────────────────────────────────────────────────────────

function ViewMode({
  donor,
  historyExpanded,
  gifts,
  onEdit,
  onGiftEntry,
  onToggleHistory,
  onCollapseHistory,
  onDelete,
}: {
  donor: DonorRecord
  historyExpanded: boolean
  gifts: GiftRecord[] | null
  onEdit: () => void
  onGiftEntry: () => void
  onToggleHistory: () => void
  onCollapseHistory: () => void
  onDelete: () => void
}) {
  const lastGift = donor.last_gift_date
    ? new Date(donor.last_gift_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : 'No gifts recorded'

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '20px',
        }}
      >
        {/* Left: identity */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '4px',
              flexWrap: 'wrap',
            }}
          >
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 600,
                color: '#0A0A0A',
                margin: 0,
                fontFamily: '"DM Serif Display", Georgia, serif',
              }}
            >
              {donor.display_name}
            </h3>
            <StatusPill status={donor.status} />
            {donor.recurring && (
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 8px',
                  background: 'rgba(91, 44, 143, 0.1)',
                  color: '#5B2C8F',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                Recurring
              </span>
            )}
          </div>
          <div
            style={{
              fontSize: '11px',
              color: 'rgba(10, 10, 10, 0.55)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              marginBottom: '8px',
            }}
          >
            {DONOR_TYPE_LABELS[donor.donor_type]}
            {donor.email ? ` · ${donor.email}` : ''}
            {donor.phone ? ` · ${donor.phone}` : ''}
          </div>

          {donor.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '4px' }}>
              {donor.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: '10px',
                    padding: '2px 8px',
                    background: 'rgba(10, 10, 10, 0.05)',
                    color: 'rgba(10, 10, 10, 0.7)',
                    fontFamily:
                      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: amount + actions */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontSize: '22px',
              fontWeight: 600,
              color: '#0A2548',
              fontFamily: '"DM Serif Display", Georgia, serif',
              lineHeight: 1,
            }}
          >
            {formatCurrency(donor.total_lifetime_amount_cents)}
          </div>
          <div
            style={{
              fontSize: '10px',
              color: 'rgba(10, 10, 10, 0.55)',
              marginTop: '4px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {donor.total_gifts_count} gift{donor.total_gifts_count === 1 ? '' : 's'} · Last: {lastGift}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
        <button type="button" onClick={onGiftEntry} style={primaryButtonStyle}>
          + Record Gift
        </button>
        <button type="button" onClick={onEdit} style={ghostButtonStyle}>
          Edit
        </button>
        <button
          type="button"
          onClick={historyExpanded ? onCollapseHistory : onToggleHistory}
          style={ghostButtonStyle}
        >
          {historyExpanded ? 'Hide history' : 'Show history'}
        </button>
        <button
          type="button"
          onClick={onDelete}
          style={{ ...ghostButtonStyle, color: '#CE1126' }}
        >
          Delete
        </button>
      </div>

      {/* Gift history accordion */}
      {historyExpanded && (
        <div
          style={{
            marginTop: '12px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
            paddingTop: '12px',
          }}
        >
          {gifts === null && (
            <div style={{ fontSize: '12px', color: 'rgba(10, 10, 10, 0.55)' }}>
              Loading gift history…
            </div>
          )}
          {gifts !== null && gifts.length === 0 && (
            <div style={{ fontSize: '12px', color: 'rgba(10, 10, 10, 0.55)' }}>
              No gifts recorded yet. Tap “+ Record Gift” to log the first one.
            </div>
          )}
          {gifts !== null && gifts.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(10, 10, 10, 0.08)' }}>
                  <th style={tableHeadStyle}>Date</th>
                  <th style={tableHeadStyle}>Amount</th>
                  <th style={tableHeadStyle}>Method</th>
                  <th style={tableHeadStyle}>Designation</th>
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id} style={{ borderBottom: '1px solid rgba(10, 10, 10, 0.04)' }}>
                    <td style={tableCellStyle}>
                      {new Date(g.gift_date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: 600 }}>
                      {formatCurrency(g.amount_cents)}
                    </td>
                    <td style={tableCellStyle}>{GIFT_METHOD_LABELS[g.method]}</td>
                    <td style={tableCellStyle}>{g.designation || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </>
  )
}

// ─── Edit mode ───────────────────────────────────────────────────────────

function EditMode({
  donor,
  isPending,
  onCancel,
  onSave,
}: {
  donor: DonorRecord
  isPending: boolean
  onCancel: () => void
  onSave: (input: {
    first_name?: string | null
    last_name?: string | null
    display_name?: string
    email?: string | null
    phone?: string | null
    donor_type?: DonorType
    status?: DonorStatus
    tags?: string[]
    notes?: string | null
    recurring?: boolean
  }) => void
}) {
  const [firstName, setFirstName] = useState(donor.first_name ?? '')
  const [lastName, setLastName] = useState(donor.last_name ?? '')
  const [displayName, setDisplayName] = useState(donor.display_name)
  const [email, setEmail] = useState(donor.email ?? '')
  const [phone, setPhone] = useState(donor.phone ?? '')
  const [donorType, setDonorType] = useState<DonorType>(donor.donor_type)
  const [status, setStatus] = useState<DonorStatus>(donor.status)
  const [tagsRaw, setTagsRaw] = useState(donor.tags.join(', '))
  const [recurring, setRecurring] = useState(donor.recurring)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <LabeledInput label="First name" value={firstName} onChange={setFirstName} />
        <LabeledInput label="Last name" value={lastName} onChange={setLastName} />
      </div>
      <LabeledInput label="Display name" value={displayName} onChange={setDisplayName} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <LabeledInput label="Email" value={email} onChange={setEmail} type="email" />
        <LabeledInput label="Phone" value={phone} onChange={setPhone} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <LabeledSelect
          label="Type"
          value={donorType}
          onChange={(v) => setDonorType(v as DonorType)}
          options={Object.entries(DONOR_TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <LabeledSelect
          label="Status"
          value={status}
          onChange={(v) => setStatus(v as DonorStatus)}
          options={Object.entries(DONOR_STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
      </div>
      <LabeledInput
        label="Tags (comma-separated)"
        value={tagsRaw}
        onChange={setTagsRaw}
        placeholder="board-member, monthly-recurring, in-kind"
      />
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
        <input
          type="checkbox"
          checked={recurring}
          onChange={(e) => setRecurring(e.target.checked)}
        />
        Recurring donor
      </label>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={ghostButtonStyle}>
          Cancel
        </button>
        <button
          type="button"
          onClick={() =>
            onSave({
              first_name: firstName || null,
              last_name: lastName || null,
              display_name: displayName.trim() || donor.display_name,
              email: email || null,
              phone: phone || null,
              donor_type: donorType,
              status,
              tags: tagsRaw.split(',').map((t) => t.trim()).filter(Boolean),
              recurring,
            })
          }
          disabled={isPending}
          style={primaryButtonStyle}
        >
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </div>
  )
}

// ─── Gift entry mode ─────────────────────────────────────────────────────

function GiftEntryMode({
  donorId,
  isPending,
  onCancel,
  onSave,
}: {
  donorId: string
  isPending: boolean
  onCancel: () => void
  onSave: (input: {
    donor_id: string
    amount_cents: number
    gift_date: string
    method: GiftMethod
    designation?: string | null
  }) => void
}) {
  const [amount, setAmount] = useState('')
  const [giftDate, setGiftDate] = useState(new Date().toISOString().slice(0, 10))
  const [method, setMethod] = useState<GiftMethod>('check')
  const [designation, setDesignation] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const submit = () => {
    const cents = dollarsToCents(amount)
    if (cents === null || cents <= 0) {
      setValidationError('Enter a valid amount greater than $0.')
      return
    }
    if (!giftDate) {
      setValidationError('Gift date is required.')
      return
    }
    setValidationError(null)
    onSave({
      donor_id: donorId,
      amount_cents: cents,
      gift_date: giftDate,
      method,
      designation: designation || null,
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: '#5B2C8F',
          fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        }}
      >
        Record Gift
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <LabeledInput
          label="Amount"
          value={amount}
          onChange={setAmount}
          placeholder="$0.00"
        />
        <LabeledInput
          label="Gift date"
          value={giftDate}
          onChange={setGiftDate}
          type="date"
        />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <LabeledSelect
          label="Method"
          value={method}
          onChange={(v) => setMethod(v as GiftMethod)}
          options={Object.entries(GIFT_METHOD_LABELS).map(([v, l]) => ({ value: v, label: l }))}
        />
        <LabeledInput
          label="Designation (optional)"
          value={designation}
          onChange={setDesignation}
          placeholder="General fund, Housing, etc."
        />
      </div>
      {validationError && (
        <div style={{ color: '#CE1126', fontSize: '12px' }}>{validationError}</div>
      )}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button type="button" onClick={onCancel} disabled={isPending} style={ghostButtonStyle}>
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={isPending} style={primaryButtonStyle}>
          {isPending ? 'Saving…' : 'Save gift'}
        </button>
      </div>
    </div>
  )
}

// ─── Status pill ─────────────────────────────────────────────────────────

function StatusPill({ status }: { status: DonorStatus }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        padding: '2px 8px',
        background: 'transparent',
        color: DONOR_STATUS_COLORS[status],
        border: `1px solid ${DONOR_STATUS_COLORS[status]}`,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {DONOR_STATUS_LABELS[status]}
    </span>
  )
}

// ─── Reusable form fragments ─────────────────────────────────────────────

export function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
      <span
        style={{
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.65)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          padding: '8px 10px',
          fontSize: '13px',
          border: '1px solid rgba(10, 10, 10, 0.15)',
          background: '#FFFFFF',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
    </label>
  )
}

export function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
}) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
      <span
        style={{
          fontWeight: 600,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.65)',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: '8px 10px',
          fontSize: '13px',
          border: '1px solid rgba(10, 10, 10, 0.15)',
          background: '#FFFFFF',
          outline: 'none',
          fontFamily: 'inherit',
        }}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  )
}

// ─── Shared styles ───────────────────────────────────────────────────────

export const primaryButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: '#5B2C8F',
  color: '#FFFFFF',
  border: 'none',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
  cursor: 'pointer',
}

export const ghostButtonStyle: React.CSSProperties = {
  padding: '8px 14px',
  background: 'transparent',
  color: '#0A0A0A',
  border: '1px solid rgba(10, 10, 10, 0.15)',
  fontSize: '11px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
  cursor: 'pointer',
}

const tableHeadStyle: React.CSSProperties = {
  textAlign: 'left',
  fontSize: '10px',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(10, 10, 10, 0.55)',
  padding: '8px 4px',
  fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
}

const tableCellStyle: React.CSSProperties = {
  fontSize: '12px',
  padding: '8px 4px',
  color: '#0A0A0A',
}
