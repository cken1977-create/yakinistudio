'use client'

// VIZIONZ SANKOFA · /admin/donors · AddDonorModal (Wave 3.5)
//
// Manual donor entry form. Renders as a full-screen overlay; closes on
// backdrop click, Escape key, or successful save.

import { useState, useEffect, useTransition } from 'react'
import {
  type DonorType,
  type DonorStatus,
  DONOR_TYPE_LABELS,
  DONOR_STATUS_LABELS,
} from './types'
import { createDonor } from '../actions/donors'
import {
  LabeledInput,
  LabeledSelect,
  primaryButtonStyle,
  ghostButtonStyle,
} from './DonorRow'

export function AddDonorModal({ onClose }: { onClose: () => void }) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [donorType, setDonorType] = useState<DonorType>('individual')
  const [status, setStatus] = useState<DonorStatus>('active')
  const [tagsRaw, setTagsRaw] = useState('')
  const [recurring, setRecurring] = useState(false)
  const [notes, setNotes] = useState('')
  const [showAddress, setShowAddress] = useState(false)
  const [addressLine1, setAddressLine1] = useState('')
  const [addressLine2, setAddressLine2] = useState('')
  const [city, setCity] = useState('')
  const [stateField, setStateField] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isPending) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPending, onClose])

  // Auto-fill display name from first + last if blank
  const effectiveDisplayName =
    displayName.trim() ||
    [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')

  const submit = () => {
    if (!effectiveDisplayName) {
      setError('Provide either a display name or first + last name.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await createDonor({
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        display_name: effectiveDisplayName,
        email: email.trim() || null,
        phone: phone.trim() || null,
        address_line1: showAddress ? addressLine1.trim() || null : null,
        address_line2: showAddress ? addressLine2.trim() || null : null,
        city: showAddress ? city.trim() || null : null,
        state: showAddress ? stateField.trim() || null : null,
        postal_code: showAddress ? postalCode.trim() || null : null,
        donor_type: donorType,
        status,
        tags: tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
        recurring,
        notes: notes.trim() || null,
      })

      if (!result.ok) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !isPending) onClose()
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(10, 10, 10, 0.5)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '40px 16px',
        zIndex: 100,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          width: '100%',
          maxWidth: '560px',
          padding: '28px',
          border: '1px solid rgba(10, 10, 10, 0.08)',
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              color: '#5B2C8F',
              marginBottom: '6px',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            New donor record
          </div>
          <h2
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#0A0A0A',
              margin: 0,
              fontFamily: '"DM Serif Display", Georgia, serif',
            }}
          >
            Add a donor
          </h2>
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <LabeledInput label="First name" value={firstName} onChange={setFirstName} />
            <LabeledInput label="Last name" value={lastName} onChange={setLastName} />
          </div>

          <LabeledInput
            label="Display name (auto-fills if blank)"
            value={displayName}
            onChange={setDisplayName}
            placeholder={effectiveDisplayName || 'e.g. Khadijah Asili or Smith Family Trust'}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <LabeledInput label="Email" value={email} onChange={setEmail} type="email" />
            <LabeledInput label="Phone" value={phone} onChange={setPhone} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <LabeledSelect
              label="Type"
              value={donorType}
              onChange={(v) => setDonorType(v as DonorType)}
              options={Object.entries(DONOR_TYPE_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
            />
            <LabeledSelect
              label="Status"
              value={status}
              onChange={(v) => setStatus(v as DonorStatus)}
              options={Object.entries(DONOR_STATUS_LABELS).map(([v, l]) => ({
                value: v,
                label: l,
              }))}
            />
          </div>

          <LabeledInput
            label="Tags (comma-separated)"
            value={tagsRaw}
            onChange={setTagsRaw}
            placeholder="board-member, monthly-recurring, in-kind"
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#0A0A0A',
            }}
          >
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
            />
            Recurring donor
          </label>

          {/* Address toggle */}
          {!showAddress && (
            <button
              type="button"
              onClick={() => setShowAddress(true)}
              style={{
                ...ghostButtonStyle,
                alignSelf: 'flex-start',
              }}
            >
              + Add address
            </button>
          )}

          {showAddress && (
            <div
              style={{
                padding: '12px',
                background: 'rgba(10, 10, 10, 0.02)',
                border: '1px solid rgba(10, 10, 10, 0.08)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
            >
              <LabeledInput label="Address line 1" value={addressLine1} onChange={setAddressLine1} />
              <LabeledInput label="Address line 2" value={addressLine2} onChange={setAddressLine2} />
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '10px' }}>
                <LabeledInput label="City" value={city} onChange={setCity} />
                <LabeledInput label="State" value={stateField} onChange={setStateField} />
                <LabeledInput label="ZIP" value={postalCode} onChange={setPostalCode} />
              </div>
              <button
                type="button"
                onClick={() => setShowAddress(false)}
                style={{
                  ...ghostButtonStyle,
                  alignSelf: 'flex-start',
                  fontSize: '10px',
                }}
              >
                − Hide address
              </button>
            </div>
          )}

          {/* Notes — operator-only, not surfaced to Yakini Intelligence */}
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
              Operator notes (private — not surfaced to Yakini Intelligence)
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Last conversation, follow-up reminders, sensitivities..."
              style={{
                padding: '8px 10px',
                fontSize: '13px',
                border: '1px solid rgba(10, 10, 10, 0.15)',
                background: '#FFFFFF',
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </label>

          {error && (
            <div
              style={{
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

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          }}
        >
          <button type="button" onClick={onClose} disabled={isPending} style={ghostButtonStyle}>
            Cancel
          </button>
          <button type="button" onClick={submit} disabled={isPending} style={primaryButtonStyle}>
            {isPending ? 'Saving…' : 'Add donor'}
          </button>
        </div>
      </div>
    </div>
  )
}
