'use client'

// VIZIONZ SANKOFA · /admin/organizations · OrganizationsListClient
//
// Interactive surface for Funders/Partners CRM. Handles search, relationship
// kind tabs (funder/partner/both/all), status filters, add modal, and the
// signature feature: Generate Funder Portal Link on funder rows. Funder
// links open the /funder/[token] surface scoped to that org's outcomes.

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type {
  OrganizationWithTokens,
  OrganizationEditableFields,
  OrganizationStatus,
  OrganizationType,
  RelationshipKind,
  FunderAccessTokenRecord,
} from './types'
import {
  RELATIONSHIP_KIND_LABELS,
  RELATIONSHIP_KIND_COLORS,
  ORGANIZATION_STATUS_LABELS,
  ORGANIZATION_STATUS_COLORS,
  ORGANIZATION_TYPE_LABELS,
  generateSlug,
  generateToken,
  isFunder,
} from './types'

const KIND_TABS: { key: 'all' | RelationshipKind; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'funder', label: 'Funders' },
  { key: 'partner', label: 'Partners' },
  { key: 'both', label: 'Both' },
]

const STATUS_TABS: { key: 'all' | OrganizationStatus; label: string }[] = [
  { key: 'all', label: 'Any Status' },
  { key: 'active', label: 'Active' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'lapsed', label: 'Lapsed' },
  { key: 'inactive', label: 'Inactive' },
]

export function OrganizationsListClient({
  initialOrganizations,
  staff,
}: {
  initialOrganizations: OrganizationWithTokens[]
  staff: { id: string; full_name: string }[]
}) {
  const [orgs, setOrgs] =
    useState<OrganizationWithTokens[]>(initialOrganizations)
  const [search, setSearch] = useState('')
  const [kindTab, setKindTab] = useState<'all' | RelationshipKind>('all')
  const [statusTab, setStatusTab] = useState<'all' | OrganizationStatus>('all')
  const [adding, setAdding] = useState(false)
  const [tokenManagerOrg, setTokenManagerOrg] =
    useState<OrganizationWithTokens | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orgs.filter((o) => {
      if (kindTab !== 'all') {
        if (kindTab === 'funder' && !isFunder(o.relationship_kind))
          return false
        if (
          kindTab === 'partner' &&
          o.relationship_kind !== 'partner' &&
          o.relationship_kind !== 'both'
        )
          return false
        if (kindTab === 'both' && o.relationship_kind !== 'both') return false
      }
      if (statusTab !== 'all' && o.status !== statusTab) return false
      if (!q) return true
      const haystack = [
        o.name,
        o.short_name ?? '',
        o.primary_contact_name ?? '',
        o.primary_contact_email ?? '',
        o.notes ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [orgs, search, kindTab, statusTab])

  return (
    <>
      {/* Controls */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '12px',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <input
          type="text"
          placeholder="Search name, contact, email, notes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: '1 1 240px',
            padding: '10px 14px',
            border: '1px solid rgba(10, 10, 10, 0.16)',
            borderRadius: '6px',
            fontSize: '14px',
            color: '#0A0A0A',
            background: '#FFFFFF',
          }}
        />
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
          + Add Organization
        </button>
      </section>

      {/* Kind tabs */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '12px',
        }}
      >
        {KIND_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? orgs.length
              : t.key === 'funder'
                ? orgs.filter((o) => isFunder(o.relationship_kind)).length
                : t.key === 'partner'
                  ? orgs.filter(
                      (o) =>
                        o.relationship_kind === 'partner' ||
                        o.relationship_kind === 'both',
                    ).length
                  : orgs.filter((o) => o.relationship_kind === 'both').length
          return (
            <TabButton
              key={t.key}
              label={`${t.label} · ${count}`}
              active={kindTab === t.key}
              onClick={() => setKindTab(t.key)}
            />
          )
        })}
      </section>

      {/* Status sub-filter */}
      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '24px',
        }}
      >
        {STATUS_TABS.map((t) => {
          const count =
            t.key === 'all'
              ? orgs.length
              : orgs.filter((o) => o.status === t.key).length
          return (
            <TabButton
              key={t.key}
              label={`${t.label} · ${count}`}
              active={statusTab === t.key}
              onClick={() => setStatusTab(t.key)}
              small
            />
          )
        })}
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState search={search} hasAny={orgs.length > 0} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map((o) => (
            <OrgRow
              key={o.id}
              org={o}
              onManageTokens={() => setTokenManagerOrg(o)}
            />
          ))}
        </div>
      )}

      {/* Add modal */}
      {adding && (
        <OrgModal
          onClose={() => setAdding(false)}
          onSaved={(created) => {
            setOrgs((prev) =>
              [
                {
                  ...created,
                  active_token_count: 0,
                  last_funder_view: null,
                  total_funder_views: 0,
                },
                ...prev,
              ].sort((a, b) => a.name.localeCompare(b.name)),
            )
            setAdding(false)
          }}
        />
      )}

      {/* Funder link manager modal */}
      {tokenManagerOrg && (
        <TokenManagerModal
          organization={tokenManagerOrg}
          staff={staff}
          onClose={() => setTokenManagerOrg(null)}
          onChanged={(orgId, delta) => {
            setOrgs((prev) =>
              prev.map((o) =>
                o.id === orgId
                  ? {
                      ...o,
                      active_token_count: Math.max(
                        0,
                        o.active_token_count + delta,
                      ),
                    }
                  : o,
              ),
            )
          }}
        />
      )}
    </>
  )
}

function TabButton({
  label,
  active,
  onClick,
  small,
}: {
  label: string
  active: boolean
  onClick: () => void
  small?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: small ? '6px 12px' : '8px 14px',
        border: active
          ? '1px solid #0A0A0A'
          : '1px solid rgba(10, 10, 10, 0.16)',
        background: active ? '#0A0A0A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#0A0A0A',
        borderRadius: '6px',
        fontSize: small ? '12px' : '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function OrgRow({
  org,
  onManageTokens,
}: {
  org: OrganizationWithTokens
  onManageTokens: () => void
}) {
  const showsAsFunder = isFunder(org.relationship_kind)

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
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
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            marginBottom: '6px',
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
            {org.name}
          </h3>
          {org.short_name && (
            <span
              style={{
                fontSize: '12px',
                color: 'rgba(10, 10, 10, 0.5)',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              ({org.short_name})
            </span>
          )}
          <KindPill kind={org.relationship_kind} />
          {org.status && <StatusPill status={org.status} />}
        </div>
        <div
          style={{
            fontSize: '12px',
            color: 'rgba(10, 10, 10, 0.55)',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            marginBottom: org.primary_contact_name ? '4px' : 0,
          }}
        >
          {ORGANIZATION_TYPE_LABELS[org.type]}
          {org.level && ` · ${org.level}`}
          {org.next_touch_due && ` · Next touch ${formatDate(org.next_touch_due)}`}
        </div>
        {org.primary_contact_name && (
          <div
            style={{
              fontSize: '12px',
              color: 'rgba(10, 10, 10, 0.6)',
              fontFamily:
                'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
            }}
          >
            {org.primary_contact_name}
            {org.primary_contact_role && ` (${org.primary_contact_role})`}
            {org.primary_contact_email && ` · ${org.primary_contact_email}`}
          </div>
        )}
        {showsAsFunder && org.active_token_count > 0 && (
          <div
            style={{
              marginTop: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(180, 95, 0, 0.12)',
                color: '#B45F00',
                fontFamily:
                  'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
              }}
            >
              {org.active_token_count} Active Portal
              {org.active_token_count === 1 ? ' Link' : ' Links'}
            </span>
            {org.last_funder_view && (
              <span
                style={{
                  fontSize: '11px',
                  color: 'rgba(10, 10, 10, 0.55)',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                }}
              >
                Last viewed {formatRelativeTime(org.last_funder_view)} ·{' '}
                {org.total_funder_views}{' '}
                {org.total_funder_views === 1 ? 'visit' : 'visits'}
              </span>
            )}
          </div>
        )}
      </div>
      {showsAsFunder && (
        <button
          onClick={onManageTokens}
          style={{
            padding: '8px 14px',
            border: '1px solid #0A0A0A',
            background: '#FFFFFF',
            color: '#0A0A0A',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap',
          }}
        >
          Manage Portal Links
        </button>
      )}
    </article>
  )
}

function KindPill({ kind }: { kind: RelationshipKind }) {
  const c = RELATIONSHIP_KIND_COLORS[kind]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: c.bg,
        color: c.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {RELATIONSHIP_KIND_LABELS[kind]}
    </span>
  )
}

function StatusPill({ status }: { status: OrganizationStatus }) {
  const c = ORGANIZATION_STATUS_COLORS[status]
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: c.bg,
        color: c.fg,
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {ORGANIZATION_STATUS_LABELS[status]}
    </span>
  )
}

function EmptyState({
  search,
  hasAny,
}: {
  search: string
  hasAny: boolean
}) {
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
        {search
          ? `No organizations match "${search}".`
          : hasAny
            ? 'No organizations in this filter.'
            : 'No organizations yet. Click + Add Organization to add the first funder or partner.'}
      </div>
    </div>
  )
}

function OrgModal({
  onClose,
  onSaved,
}: {
  onClose: () => void
  onSaved: (record: OrganizationWithTokens) => void
}) {
  const [draft, setDraft] = useState<OrganizationEditableFields>({
    name: '',
    short_name: null,
    slug: '',
    relationship_kind: 'funder',
    type: 'foundation',
    level: null,
    status: 'active',
    primary_contact_name: null,
    primary_contact_email: null,
    primary_contact_phone: null,
    primary_contact_role: null,
    website: null,
    notes: null,
    next_touch_due: null,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof OrganizationEditableFields>(
    key: K,
    value: OrganizationEditableFields[K],
  ) {
    setDraft((prev) => {
      const next = { ...prev, [key]: value }
      // Auto-generate slug when name changes if user hasn't edited slug
      if (key === 'name' && (!prev.slug || prev.slug === generateSlug(prev.name))) {
        next.slug = generateSlug(value as string)
      }
      return next
    })
  }

  function save() {
    if (!draft.name.trim()) {
      setErrorMsg('Name is required.')
      return
    }
    if (!draft.slug.trim()) {
      setErrorMsg('Slug is required.')
      return
    }
    setErrorMsg(null)

    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('organizations')
        .insert(draft)
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to save.')
        return
      }

      onSaved(data as unknown as OrganizationWithTokens)
    })
  }

  return (
    <ModalShell title="Add Organization" subtitle="Funder or partner. Required: name, slug, relationship kind, type." onClose={onClose}>
      <Row>
        <Field label="Name *">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder='e.g. "Albuquerque Community Foundation"'
            style={inputStyle}
          />
        </Field>
        <Field label="Short Name">
          <input
            type="text"
            value={draft.short_name ?? ''}
            onChange={(e) => update('short_name', e.target.value || null)}
            placeholder='e.g. "ACF"'
            style={inputStyle}
          />
        </Field>
      </Row>

      <Field label="Slug *">
        <input
          type="text"
          value={draft.slug}
          onChange={(e) => update('slug', e.target.value)}
          placeholder="auto-generated from name"
          style={{ ...inputStyle, fontFamily: 'ui-monospace, monospace' }}
        />
      </Field>

      <Row>
        <Field label="Relationship Kind *">
          <select
            value={draft.relationship_kind}
            onChange={(e) =>
              update('relationship_kind', e.target.value as RelationshipKind)
            }
            style={inputStyle}
          >
            {(Object.keys(RELATIONSHIP_KIND_LABELS) as RelationshipKind[]).map(
              (k) => (
                <option key={k} value={k}>
                  {RELATIONSHIP_KIND_LABELS[k]}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="Type *">
          <select
            value={draft.type}
            onChange={(e) => update('type', e.target.value as OrganizationType)}
            style={inputStyle}
          >
            {(Object.keys(ORGANIZATION_TYPE_LABELS) as OrganizationType[]).map(
              (t) => (
                <option key={t} value={t}>
                  {ORGANIZATION_TYPE_LABELS[t]}
                </option>
              ),
            )}
          </select>
        </Field>
        <Field label="Status">
          <select
            value={draft.status}
            onChange={(e) =>
              update('status', e.target.value as OrganizationStatus)
            }
            style={inputStyle}
          >
            {(
              Object.keys(ORGANIZATION_STATUS_LABELS) as OrganizationStatus[]
            ).map((s) => (
              <option key={s} value={s}>
                {ORGANIZATION_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </Field>
      </Row>

      <Field label="Level">
        <input
          type="text"
          value={draft.level ?? ''}
          onChange={(e) => update('level', e.target.value || null)}
          placeholder='e.g. "Lead Funder" or "Tier 1 Partner"'
          style={inputStyle}
        />
      </Field>

      <Row>
        <Field label="Contact Name">
          <input
            type="text"
            value={draft.primary_contact_name ?? ''}
            onChange={(e) =>
              update('primary_contact_name', e.target.value || null)
            }
            style={inputStyle}
          />
        </Field>
        <Field label="Contact Role">
          <input
            type="text"
            value={draft.primary_contact_role ?? ''}
            onChange={(e) =>
              update('primary_contact_role', e.target.value || null)
            }
            placeholder='e.g. "Program Officer"'
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Contact Email">
          <input
            type="email"
            value={draft.primary_contact_email ?? ''}
            onChange={(e) =>
              update('primary_contact_email', e.target.value || null)
           }
            style={inputStyle}
          />
        </Field>
        <Field label="Contact Phone">
          <input
            type="tel"
            value={draft.primary_contact_phone ?? ''}
            onChange={(e) =>
              update('primary_contact_phone', e.target.value || null)
            }
            style={inputStyle}
          />
        </Field>
      </Row>

      <Row>
        <Field label="Website">
          <input
            type="url"
            value={draft.website ?? ''}
            onChange={(e) => update('website', e.target.value || null)}
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>
        <Field label="Next Touch Due">
          <input
            type="date"
            value={draft.next_touch_due ?? ''}
            onChange={(e) => update('next_touch_due', e.target.value || null)}
            style={inputStyle}
          />
        </Field>
      </Row>

      <Field label="Notes">
        <textarea
          value={draft.notes ?? ''}
          onChange={(e) => update('notes', e.target.value || null)}
          rows={3}
          placeholder="Internal context — grant history, relationship lineage, do/don't, who introduced who."
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
        <button onClick={onClose} disabled={pending} style={cancelBtn(pending)}>
          Cancel
        </button>
        <button onClick={save} disabled={pending} style={saveBtn(pending)}>
          {pending ? 'Saving…' : 'Add Organization'}
        </button>
      </div>
    </ModalShell>
  )
}

function TokenManagerModal({
  organization,
  staff,
  onClose,
  onChanged,
}: {
  organization: OrganizationWithTokens
  staff: { id: string; full_name: string }[]
  onClose: () => void
  onChanged: (orgId: string, delta: number) => void
}) {
  const [tokens, setTokens] = useState<FunderAccessTokenRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pending, startTransition] = useTransition()
  const [copiedTokenId, setCopiedTokenId] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [newLinkNote, setNewLinkNote] = useState('')
  const [generatedById, setGeneratedById] = useState<string>(
    staff[0]?.id ?? '',
  )

  // Load tokens on mount
  useState(() => {
    const supabase = createBrowserClient()
    supabase
      .from('funder_access_tokens')
      .select('*')
      .eq('organization_id', organization.id)
      .order('generated_at', { ascending: false })
      .then(({ data }) => {
        setTokens((data ?? []) as unknown as FunderAccessTokenRecord[])
        setLoading(false)
      })
  })

  function generate() {
    setErrorMsg(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const token = generateToken()
      const { data, error } = await supabase
        .from('funder_access_tokens')
        .insert({
          organization_id: organization.id,
          token,
          generated_by_id: generatedById || null,
          notes: newLinkNote.trim() || null,
        })
        .select()
        .single()

      if (error || !data) {
        setErrorMsg(error?.message ?? 'Failed to generate.')
        return
      }

      setTokens((prev) => [
        data as unknown as FunderAccessTokenRecord,
        ...prev,
      ])
      onChanged(organization.id, 1)
      setNewLinkNote('')
    })
  }

  function revoke(tokenId: string) {
    startTransition(async () => {
      const supabase = createBrowserClient()
      const { error } = await supabase
        .from('funder_access_tokens')
        .update({ is_revoked: true, revoked_at: new Date().toISOString() })
        .eq('id', tokenId)

      if (error) {
        setErrorMsg(error.message)
        return
      }

      setTokens((prev) =>
        prev.map((t) =>
          t.id === tokenId
            ? { ...t, is_revoked: true, revoked_at: new Date().toISOString() }
            : t,
        ),
      )
      onChanged(organization.id, -1)
    })
  }

  function copyLink(token: string, tokenId: string) {
    const url = `${window.location.origin}/funder/${token}`
    navigator.clipboard.writeText(url)
    setCopiedTokenId(tokenId)
    setTimeout(() => setCopiedTokenId(null), 2000)
  }

  return (
    <ModalShell
      title={`Portal Links for ${organization.name}`}
      subtitle="Each link gives the funder live access to their own outcomes. Revoke any time."
      onClose={onClose}
      maxWidth="720px"
    >
      {/* Generate new link */}
      <div
        style={{
          padding: '16px 18px',
          background: 'rgba(91, 44, 143, 0.04)',
          border: '1px solid rgba(91, 44, 143, 0.18)',
          borderRadius: '6px',
          marginBottom: '24px',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: '#5B2C8F',
            marginBottom: '12px',
            fontFamily:
              'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
          }}
        >
          Generate New Link
        </div>
        <Row>
          <Field label="Note (optional)">
            <input
              type="text"
              value={newLinkNote}
              onChange={(e) => setNewLinkNote(e.target.value)}
              placeholder='e.g. "Q2 2026 report"'
              style={inputStyle}
            />
          </Field>
          <Field label="Generated By">
            <select
              value={generatedById}
              onChange={(e) => setGeneratedById(e.target.value)}
              style={inputStyle}
            >
              <option value="">— Unassigned —</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}
                </option>
              ))}
            </select>
          </Field>
        </Row>
        <button
          onClick={generate}
          disabled={pending}
          style={{
            padding: '10px 18px',
            border: '1px solid #0A0A0A',
            background: '#0A0A0A',
            color: '#FFFFFF',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: pending ? 'not-allowed' : 'pointer',
            fontFamily: 'inherit',
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? 'Generating…' : 'Generate Portal Link'}
        </button>
      </div>

      {/* Existing tokens */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: 'rgba(10, 10, 10, 0.55)',
          marginBottom: '12px',
          fontFamily:
            'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
        }}
      >
        Existing Links ({tokens.length})
      </div>

      {loading ? (
        <div style={{ padding: '20px', fontSize: '13px', color: 'rgba(10, 10, 10, 0.5)' }}>
          Loading…
        </div>
      ) : tokens.length === 0 ? (
        <div
          style={{
            padding: '20px',
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.5)',
            border: '1px dashed rgba(10, 10, 10, 0.18)',
            borderRadius: '6px',
            background: '#FAFAF8',
            textAlign: 'center',
          }}
        >
          No portal links generated yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {tokens.map((t) => (
            <div
              key={t.id}
              style={{
                border: '1px solid rgba(10, 10, 10, 0.1)',
                borderRadius: '6px',
                padding: '12px 14px',
                background: t.is_revoked ? '#FAFAF8' : '#FFFFFF',
                opacity: t.is_revoked ? 0.7 : 1,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '8px',
                  marginBottom: '6px',
                }}
              >
                <code
                  style={{
                    fontSize: '12px',
                    color: 'rgba(10, 10, 10, 0.7)',
                    fontFamily:
                      'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                    wordBreak: 'break-all',
                  }}
                >
                  /funder/{t.token.substring(0, 12)}…
                </code>
                {t.is_revoked && (
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      letterSpacing: '0.12em',
                      textTransform: 'uppercase',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: 'rgba(206, 17, 38, 0.12)',
                      color: '#CE1126',
                      fontFamily:
                        'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                    }}
                  >
                    Revoked
                  </span>
                )}
              </div>
              {t.notes && (
                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(10, 10, 10, 0.65)',
                    marginBottom: '6px',
                  }}
                >
                  {t.notes}
                </div>
              )}
              <div
                style={{
                  fontSize: '11px',
                  color: 'rgba(10, 10, 10, 0.5)',
                  fontFamily:
                    'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
                  marginBottom: '8px',
                }}
              >
                Generated {formatDateTime(t.generated_at)} ·{' '}
                {t.view_count} {t.view_count === 1 ? 'visit' : 'visits'}
                {t.last_viewed_at &&
                  ` · last ${formatRelativeTime(t.last_viewed_at)}`}
                {t.is_revoked &&
                  t.revoked_at &&
                  ` · revoked ${formatDateTime(t.revoked_at)}`}
              </div>
              {!t.is_revoked && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <button
                    onClick={() => copyLink(t.token, t.id)}
                    style={miniBtn(false)}
                  >
                    {copiedTokenId === t.id ? '✓ Copied' : 'Copy Link'}
                  </button>
                  <button
                    onClick={() => revoke(t.id)}
                    disabled={pending}
                    style={miniBtnDanger(pending)}
                  >
                    Revoke
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            background: 'rgba(206, 17, 38, 0.08)',
            color: '#CE1126',
            borderRadius: '6px',
            fontSize: '13px',
            marginTop: '16px',
          }}
        >
          {errorMsg}
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          marginTop: '24px',
        }}
      >
        <button onClick={onClose} style={saveBtn(false)}>
          Done
        </button>
      </div>
    </ModalShell>
  )
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
  maxWidth,
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: React.ReactNode
  maxWidth?: string
}) {
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
          maxWidth: maxWidth ?? '640px',
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
            marginBottom: subtitle ? '6px' : '24px',
            fontFamily: '"DM Serif Display", Georgia, serif',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: '13px',
              color: 'rgba(10, 10, 10, 0.6)',
              marginBottom: '24px',
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
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
  border: '1px solid rgba(10, 10, 10, 0.16)',
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

function miniBtn(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: '1px solid rgba(10, 10, 10, 0.18)',
    background: '#FFFFFF',
    color: '#0A0A0A',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
}

function miniBtnDanger(disabled: boolean): React.CSSProperties {
  return {
    padding: '6px 12px',
    border: '1px solid rgba(206, 17, 38, 0.4)',
    background: '#FFFFFF',
    color: '#CE1126',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'inherit',
    opacity: disabled ? 0.5 : 1,
  }
}

function formatDate(d: string | null): string {
  if (!d) return ''
  try {
    const date = new Date(d + 'T00:00:00')
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

function formatRelativeTime(iso: string): string {
  try {
    const then = new Date(iso).getTime()
    const now = Date.now()
    const diffMs = now - then
    const diffMin = Math.floor(diffMs / 60000)
    const diffHr = Math.floor(diffMs / 3600000)
    const diffDay = Math.floor(diffMs / 86400000)

    if (diffMin < 1) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    if (diffDay < 30) return `${diffDay}d ago`
    return formatDateTime(iso)
  } catch {
    return iso
  }
}
