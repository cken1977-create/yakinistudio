'use client'

// VIZIONZ SANKOFA · /admin/donors · ImportCSVModal (Wave 3.5)
//
// Five-state CSV import flow:
//   idle → mapping → preview → committing → results
//
// Operator picks a CSV, papaparse extracts headers, smart-detect assigns
// default donor field mappings, operator confirms/overrides, previews
// parsed rows, commits, sees per-row results.

import { useState, useEffect, useTransition, useRef } from 'react'
import Papa from 'papaparse'
import {
  type DonorType,
  type DonorStatus,
  type CreateDonorInput,
  type CSVImportRowResult,
  DONOR_TYPE_LABELS,
  DONOR_STATUS_LABELS,
} from './types'
import { bulkImportDonors } from '../actions/donors'
import {
  LabeledSelect,
  primaryButtonStyle,
  ghostButtonStyle,
} from './DonorRow'

// ─── Donor fields that can receive CSV column mappings ──────────────────

type DonorField =
  | 'ignore'
  | 'first_name'
  | 'last_name'
  | 'display_name'
  | 'email'
  | 'phone'
  | 'donor_type'
  | 'status'
  | 'tags'
  | 'recurring'
  | 'notes'
  | 'address_line1'
  | 'address_line2'
  | 'city'
  | 'state'
  | 'postal_code'

const FIELD_LABELS: Record<DonorField, string> = {
  ignore: '— Ignore this column —',
  first_name: 'First name',
  last_name: 'Last name',
  display_name: 'Display name',
  email: 'Email',
  phone: 'Phone',
  donor_type: 'Type',
  status: 'Status',
  tags: 'Tags',
  recurring: 'Recurring',
  notes: 'Notes',
  address_line1: 'Address line 1',
  address_line2: 'Address line 2',
  city: 'City',
  state: 'State',
  postal_code: 'ZIP / Postal code',
}

// Smart column header → donor field detection
function detectField(header: string): DonorField {
  const h = header.toLowerCase().trim()
  if (['first name', 'fname', 'first', 'firstname', 'given name'].includes(h)) return 'first_name'
  if (['last name', 'lname', 'last', 'surname', 'lastname', 'family name'].includes(h)) return 'last_name'
  if (['name', 'full name', 'donor', 'donor name', 'display name', 'display'].includes(h)) return 'display_name'
  if (['email', 'e-mail', 'email address'].includes(h)) return 'email'
  if (['phone', 'phone number', 'mobile', 'cell', 'telephone'].includes(h)) return 'phone'
  if (['type', 'donor type', 'category'].includes(h)) return 'donor_type'
  if (['status'].includes(h)) return 'status'
  if (['tags', 'labels', 'tag'].includes(h)) return 'tags'
  if (['recurring', 'monthly', 'subscriber', 'recurring donor'].includes(h)) return 'recurring'
  if (['notes', 'note', 'comments', 'comment'].includes(h)) return 'notes'
  if (['address', 'address 1', 'street', 'street address', 'address line 1'].includes(h)) return 'address_line1'
  if (['address 2', 'address line 2', 'apt', 'unit'].includes(h)) return 'address_line2'
  if (['city', 'town'].includes(h)) return 'city'
  if (['state', 'province', 'region'].includes(h)) return 'state'
  if (['zip', 'postal code', 'zip code', 'postcode', 'zipcode'].includes(h)) return 'postal_code'
  return 'ignore'
}

// ─── Parse row helpers ───────────────────────────────────────────────────

function parseBoolean(v: string): boolean {
  const s = v.toLowerCase().trim()
  return ['yes', 'true', '1', 'y', 'recurring', 'monthly'].includes(s)
}

function parseDonorType(v: string): DonorType {
  const s = v.toLowerCase().trim()
  if (['individual', 'person', 'donor'].includes(s)) return 'individual'
  if (['family', 'household', 'family trust'].includes(s)) return 'family'
  if (['foundation', 'foundation grant'].includes(s)) return 'foundation'
  if (['corporation', 'corporate', 'company', 'business'].includes(s)) return 'corporation'
  if (['anonymous', 'anon'].includes(s)) return 'anonymous'
  return 'individual'
}

function parseDonorStatus(v: string): DonorStatus {
  const s = v.toLowerCase().trim()
  if (['active', 'current'].includes(s)) return 'active'
  if (['lapsed', 'inactive'].includes(s)) return 'lapsed'
  if (['do not contact', 'declined', 'declined_contact', 'no contact', 'dnc'].includes(s)) return 'declined_contact'
  if (['deceased', 'deceased_'].includes(s)) return 'deceased'
  return 'active'
}

// ─── Component ───────────────────────────────────────────────────────────

type ImportState =
  | { phase: 'idle' }
  | { phase: 'mapping'; headers: string[]; rows: Record<string, string>[]; mapping: DonorField[] }
  | { phase: 'preview'; headers: string[]; rows: Record<string, string>[]; mapping: DonorField[]; parsed: CreateDonorInput[] }
  | { phase: 'committing' }
  | { phase: 'results'; results: CSVImportRowResult[]; total: number }

export function ImportCSVModal({ onClose }: { onClose: () => void }) {
  const [state, setState] = useState<ImportState>({ phase: 'idle' })
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Close on Escape (unless committing)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state.phase !== 'committing' && !isPending) onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [state.phase, isPending, onClose])

  const handleFile = (file: File) => {
    setError(null)
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError(`CSV parse error: ${results.errors[0].message}`)
          return
        }
        if (!results.data || results.data.length === 0) {
          setError('CSV is empty or has no data rows.')
          return
        }
        const headers = results.meta.fields ?? []
        if (headers.length === 0) {
          setError('No column headers detected. First row must be headers.')
          return
        }
        const mapping = headers.map((h) => detectField(h))
        setState({
          phase: 'mapping',
          headers,
          rows: results.data,
          mapping,
        })
      },
      error: (err) => {
        setError(`Failed to read CSV: ${err.message}`)
      },
    })
  }

  const updateMapping = (index: number, field: DonorField) => {
    if (state.phase !== 'mapping') return
    const newMapping = [...state.mapping]
    newMapping[index] = field
    setState({ ...state, mapping: newMapping })
  }

  const proceedToPreview = () => {
    if (state.phase !== 'mapping') return
    const parsed: CreateDonorInput[] = state.rows.map((row) => {
      const donor: CreateDonorInput = {
        display_name: '',
        donor_type: 'individual',
      }
      state.headers.forEach((header, i) => {
        const field = state.mapping[i]
        const value = (row[header] ?? '').trim()
        if (!value || field === 'ignore') return
        switch (field) {
          case 'first_name':
            donor.first_name = value
            break
          case 'last_name':
            donor.last_name = value
            break
          case 'display_name':
            donor.display_name = value
            break
          case 'email':
            donor.email = value
            break
          case 'phone':
            donor.phone = value
            break
          case 'donor_type':
            donor.donor_type = parseDonorType(value)
            break
          case 'status':
            donor.status = parseDonorStatus(value)
            break
          case 'tags':
            donor.tags = value.split(/[,;|]/).map((t) => t.trim()).filter(Boolean)
            break
          case 'recurring':
            donor.recurring = parseBoolean(value)
            break
          case 'notes':
            donor.notes = value
            break
          case 'address_line1':
            donor.address_line1 = value
            break
          case 'address_line2':
            donor.address_line2 = value
            break
          case 'city':
            donor.city = value
            break
          case 'state':
            donor.state = value
            break
          case 'postal_code':
            donor.postal_code = value
            break
        }
      })
      // Auto-fill display name if blank
      if (!donor.display_name) {
        const parts = [donor.first_name, donor.last_name].filter(Boolean)
        if (parts.length > 0) donor.display_name = parts.join(' ')
      }
      return donor
    })
    setState({
      phase: 'preview',
      headers: state.headers,
      rows: state.rows,
      mapping: state.mapping,
      parsed,
    })
  }

  const commitImport = () => {
    if (state.phase !== 'preview') return
    const rowsToImport = state.parsed
    setState({ phase: 'committing' })
    startTransition(async () => {
      const result = await bulkImportDonors(rowsToImport)
      setState({
        phase: 'results',
        results: result.results,
        total: rowsToImport.length,
      })
    })
  }

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && state.phase !== 'committing' && !isPending) onClose()
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
          maxWidth: '720px',
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
              fontFamily: 'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            CSV Import · Phase: {state.phase}
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
            Import donors from CSV
          </h2>
        </div>

        {/* Phase: idle */}
        {state.phase === 'idle' && (
          <div>
            <p style={{ fontSize: '14px', color: 'rgba(10, 10, 10, 0.7)', marginBottom: '16px' }}>
              Pick a CSV file. The first row should contain column headers. You&apos;ll get a chance to confirm which columns map to which donor fields before saving.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFile(file)
              }}
              style={{
                fontSize: '13px',
                padding: '20px',
                width: '100%',
                border: '2px dashed rgba(10, 10, 10, 0.2)',
                background: 'rgba(10, 10, 10, 0.02)',
                cursor: 'pointer',
              }}
            />
          </div>
        )}

        {/* Phase: mapping */}
        {state.phase === 'mapping' && (
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(10, 10, 10, 0.7)', marginBottom: '16px' }}>
              <strong>{state.rows.length}</strong> rows detected. Confirm column mappings below. Auto-detected fields are pre-selected.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '320px', overflowY: 'auto', marginBottom: '16px' }}>
              {state.headers.map((header, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '12px',
                    alignItems: 'center',
                    padding: '8px',
                    background: 'rgba(10, 10, 10, 0.02)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 500, color: '#0A0A0A' }}>
                    {header}{' '}
                    <span style={{ color: 'rgba(10, 10, 10, 0.45)', fontWeight: 400 }}>
                      ({state.rows[0]?.[header]?.slice(0, 30) || '(empty)'})
                    </span>
                  </div>
                  <LabeledSelect
                    label=""
                    value={state.mapping[i]}
                    onChange={(v) => updateMapping(i, v as DonorField)}
                    options={Object.entries(FIELD_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Phase: preview */}
        {state.phase === 'preview' && (
          <div>
            <p style={{ fontSize: '13px', color: 'rgba(10, 10, 10, 0.7)', marginBottom: '12px' }}>
              Previewing first 5 of <strong>{state.parsed.length}</strong> donors. Review before committing.
            </p>
            <div style={{ maxHeight: '320px', overflowY: 'auto', marginBottom: '16px' }}>
              {state.parsed.slice(0, 5).map((donor, i) => (
                <div
                  key={i}
                  style={{
                    padding: '10px',
                    background: 'rgba(10, 10, 10, 0.02)',
                    border: '1px solid rgba(10, 10, 10, 0.06)',
                    marginBottom: '6px',
                    fontSize: '12px',
                    color: '#0A0A0A',
                  }}
                >
                  <strong>{donor.display_name || '(no name)'}</strong>
                  {' · '}
                  {donor.donor_type}
                  {donor.email ? ` · ${donor.email}` : ''}
                  {donor.phone ? ` · ${donor.phone}` : ''}
                  {donor.tags && donor.tags.length > 0 ? ` · tags: ${donor.tags.join(', ')}` : ''}
                  {donor.recurring ? ' · recurring' : ''}
                </div>
              ))}
              {state.parsed.length > 5 && (
                <div style={{ fontSize: '11px', color: 'rgba(10, 10, 10, 0.55)', padding: '8px', textAlign: 'center' }}>
                  …and {state.parsed.length - 5} more.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Phase: committing */}
        {state.phase === 'committing' && (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#5B2C8F' }}>Importing donors…</div>
          </div>
        )}

        {/* Phase: results */}
        {state.phase === 'results' && (
          <div>
            <div style={{ marginBottom: '16px' }}>
              {(() => {
                const successes = state.results.filter((r) => r.ok).length
                const failures = state.results.filter((r) => !r.ok).length
                return (
                  <div style={{ fontSize: '14px', color: '#0A0A0A' }}>
                    <strong style={{ color: '#007A33' }}>{successes}</strong> imported successfully.
                    {failures > 0 && (
                      <>
                        {' '}
                        <strong style={{ color: '#CE1126' }}>{failures}</strong> failed.
                      </>
                    )}
                  </div>
                )
              })()}
            </div>
            {state.results.filter((r) => !r.ok).length > 0 && (
              <div style={{ maxHeight: '240px', overflowY: 'auto', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(10, 10, 10, 0.65)', marginBottom: '6px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Failures
                </div>
                {state.results.filter((r) => !r.ok).map((r, i) => (
                  <div key={i} style={{ padding: '6px 10px', background: 'rgba(206, 17, 38, 0.05)', border: '1px solid rgba(206, 17, 38, 0.2)', marginBottom: '4px', fontSize: '11px' }}>
                    <strong>Row {r.row_index + 1}:</strong> {r.display_name} — {!r.ok ? r.error : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(206, 17, 38, 0.08)',
              border: '1px solid #CE1126',
              color: '#CE1126',
              fontSize: '12px',
              marginBottom: '12px',
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'flex-end',
            paddingTop: '16px',
            borderTop: '1px solid rgba(10, 10, 10, 0.08)',
          }}
        >
          {state.phase === 'idle' && (
            <button type="button" onClick={onClose} style={ghostButtonStyle}>
              Cancel
            </button>
          )}
          {state.phase === 'mapping' && (
            <>
              <button type="button" onClick={() => setState({ phase: 'idle' })} style={ghostButtonStyle}>
                ← Pick different file
              </button>
              <button type="button" onClick={proceedToPreview} style={primaryButtonStyle}>
                Continue to preview →
              </button>
            </>
          )}
          {state.phase === 'preview' && (
            <>
              <button
                type="button"
                onClick={() =>
                  setState({
                    phase: 'mapping',
                    headers: state.headers,
                    rows: state.rows,
                    mapping: state.mapping,
                  })
                }
                style={ghostButtonStyle}
              >
                ← Back to mapping
              </button>
              <button type="button" onClick={commitImport} style={primaryButtonStyle}>
                Import {state.parsed.length} donors
              </button>
            </>
          )}
          {state.phase === 'results' && (
            <button type="button" onClick={onClose} style={primaryButtonStyle}>
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
