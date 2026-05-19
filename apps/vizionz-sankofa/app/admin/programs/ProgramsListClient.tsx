'use client'

// VIZIONZ SANKOFA · /admin/programs · interactive list + edit modal
//
// Receives the initial program list from the server, then handles:
//  - Search filter
//  - All / Public / Draft tabs
//  - Edit modal with all program fields
//  - Save (Supabase update via browser client)
//  - Optimistic UI refresh on save

import { useMemo, useState, useTransition } from 'react'
import { createClient as createBrowserClient } from '@/lib/supabase/client'
import type { ProgramEditableFields, ProgramRecord } from './types'

type TabKey = 'all' | 'public' | 'draft'

export function ProgramsListClient({
  initialPrograms,
}: {
  initialPrograms: ProgramRecord[]
}) {
  const [programs, setPrograms] = useState<ProgramRecord[]>(initialPrograms)
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState<TabKey>('all')
  const [editing, setEditing] = useState<ProgramRecord | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return programs.filter((p) => {
      if (tab === 'public' && !p.is_public) return false
      if (tab === 'draft' && p.is_public) return false
      if (!q) return true
      const haystack = [
        p.name,
        p.short_name ?? '',
        p.public_description ?? '',
        p.who_we_serve ?? '',
      ]
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [programs, search, tab])

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
          placeholder="Search programs…"
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
        <TabButton
          label={`All · ${programs.length}`}
          active={tab === 'all'}
          onClick={() => setTab('all')}
        />
        <TabButton
          label={`Public · ${programs.filter((p) => p.is_public).length}`}
          active={tab === 'public'}
          onClick={() => setTab('public')}
        />
        <TabButton
          label={`Drafts · ${programs.filter((p) => !p.is_public).length}`}
          active={tab === 'draft'}
          onClick={() => setTab('draft')}
        />
      </section>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState search={search} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((p) => (
            <ProgramRow key={p.id} program={p} onEdit={() => setEditing(p)} />
          ))}
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <EditModal
          program={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            setPrograms((prev) =>
              prev.map((p) => (p.id === updated.id ? { ...p, ...updated } : p)),
            )
            setEditing(null)
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
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '8px 14px',
        border: active ? '1px solid #0A0A0A' : '1px solid rgba(10, 10, 10, 0.16)',
        background: active ? '#0A0A0A' : '#FFFFFF',
        color: active ? '#FFFFFF' : '#0A0A0A',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  )
}

function ProgramRow({
  program,
  onEdit,
}: {
  program: ProgramRecord
  onEdit: () => void
}) {
  const hasDescription =
    program.public_description &&
    program.public_description.trim().length > 0

  return (
    <article
      style={{
        border: '1px solid rgba(10, 10, 10, 0.1)',
        borderRadius: '8px',
        padding: '20px 22px',
        background: '#FFFFFF',
        display: 'grid',
        gridTemplateColumns: '40px 1fr auto',
        gap: '16px',
        alignItems: 'center',
      }}
    >
      <div style={{ fontSize: '28px', lineHeight: 1 }}>
        {program.icon_emoji ?? '📋'}
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '4px',
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
            {program.name}
          </h3>
          <StatusPill isPublic={program.is_public} />
        </div>
        <div
          style={{
            fontSize: '13px',
            lineHeight: 1.5,
            color: 'rgba(10, 10, 10, 0.6)',
          }}
        >
          {hasDescription
            ? program.public_description
            : 'No public description yet. Click Edit to write one.'}
        </div>
      </div>
      <button
        onClick={onEdit}
        style={{
          padding: '8px 16px',
          border: '1px solid #0A0A0A',
          background: '#FFFFFF',
          color: '#0A0A0A',
          borderRadius: '6px',
          fontSize: '13px',
          fontWeight: 500,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        Edit
      </button>
    </article>
  )
}

function StatusPill({ isPublic }: { isPublic: boolean }) {
  return (
    <span
      style={{
        fontSize: '10px',
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '4px',
        background: isPublic ? 'rgba(0, 122, 51, 0.12)' : 'rgba(10, 10, 10, 0.08)',
        color: isPublic ? '#007A33' : 'rgba(10, 10, 10, 0.55)',
        fontFamily:
          'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, monospace',
      }}
    >
      {isPublic ? 'Public' : 'Draft'}
    </span>
  )
}

function EmptyState({ search }: { search: string }) {
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
          ? `No programs match "${search}".`
          : 'No programs yet for this filter.'}
      </div>
    </div>
  )
}

function EditModal({
  program,
  onClose,
  onSaved,
}: {
  program: ProgramRecord
  onClose: () => void
  onSaved: (updated: ProgramRecord) => void
}) {
  const [draft, setDraft] = useState<ProgramEditableFields>({
    name: program.name,
    short_name: program.short_name,
    public_description: program.public_description,
    public_long_description: program.public_long_description,
    who_we_serve: program.who_we_serve,
    eligibility_criteria: program.eligibility_criteria,
    duration_description: program.duration_description,
    apply_cta_label: program.apply_cta_label,
    apply_url: program.apply_url,
    icon_emoji: program.icon_emoji,
    display_order: program.display_order,
    is_public: program.is_public,
  })
  const [pending, startTransition] = useTransition()
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  function update<K extends keyof ProgramEditableFields>(
    key: K,
    value: ProgramEditableFields[K],
  ) {
    setDraft((prev) => ({ ...prev, [key]: value }))
  }

  function save() {
    setErrorMsg(null)
    startTransition(async () => {
      const supabase = createBrowserClient()
      const { data, error } = await supabase
        .from('programs')
        .update(draft)
        .eq('id', program.id)
        .select()
        .single()

      if (error) {
        setErrorMsg(error.message)
        return
      }
      if (data) {
        onSaved(data as unknown as ProgramRecord)
      }
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
          maxWidth: '640px',
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
          Edit Program
        </h2>
        <p
          style={{
            fontSize: '13px',
            color: 'rgba(10, 10, 10, 0.6)',
            marginBottom: '24px',
          }}
        >
          {program.slug}
        </p>

        <Field label="Program Name">
          <input
            type="text"
            value={draft.name}
            onChange={(e) => update('name', e.target.value)}
            style={inputStyle}
          />
        </Field>

        <Field label="Short Name (for tight spaces)">
          <input
            type="text"
            value={draft.short_name ?? ''}
            onChange={(e) => update('short_name', e.target.value || null)}
            style={inputStyle}
          />
        </Field>

        <Field label="Icon (emoji)">
          <input
            type="text"
            value={draft.icon_emoji ?? ''}
            onChange={(e) => update('icon_emoji', e.target.value || null)}
            style={{ ...inputStyle, maxWidth: '120px' }}
          />
        </Field>

        <Field label="Public Description (one paragraph)">
          <textarea
            value={draft.public_description ?? ''}
            onChange={(e) =>
              update('public_description', e.target.value || null)
            }
            rows={3}
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Long Description (program detail page)">
          <textarea
            value={draft.public_long_description ?? ''}
            onChange={(e) =>
              update('public_long_description', e.target.value || null)
            }
            rows={5}
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Who We Serve">
          <textarea
            value={draft.who_we_serve ?? ''}
            onChange={(e) => update('who_we_serve', e.target.value || null)}
            rows={2}
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Eligibility Criteria">
          <textarea
            value={draft.eligibility_criteria ?? ''}
            onChange={(e) =>
              update('eligibility_criteria', e.target.value || null)
            }
            rows={2}
            style={{ ...inputStyle, fontFamily: 'inherit' }}
          />
        </Field>

        <Field label="Duration (e.g. 12 weeks, weekly 90-min sessions)">
          <input
            type="text"
            value={draft.duration_description ?? ''}
            onChange={(e) =>
              update('duration_description', e.target.value || null)
            }
            style={inputStyle}
          />
        </Field>

        <Field label="Apply Button Label">
          <input
            type="text"
            value={draft.apply_cta_label ?? ''}
            onChange={(e) => update('apply_cta_label', e.target.value || null)}
            style={inputStyle}
            placeholder="Apply Now"
          />
        </Field>

        <Field label="Apply URL (leave blank to use VS intake form)">
          <input
            type="text"
            value={draft.apply_url ?? ''}
            onChange={(e) => update('apply_url', e.target.value || null)}
            style={inputStyle}
          />
        </Field>

        <Field label="Display Order (lower = first on public page)">
          <input
            type="number"
            value={draft.display_order}
            onChange={(e) =>
              update('display_order', Number(e.target.value) || 100)
            }
            style={{ ...inputStyle, maxWidth: '120px' }}
          />
        </Field>

        <Field label="">
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '12px 14px',
              border: '1px solid rgba(10, 10, 10, 0.16)',
              borderRadius: '6px',
              background: draft.is_public
                ? 'rgba(0, 122, 51, 0.06)'
                : '#FFFFFF',
            }}
          >
            <input
              type="checkbox"
              checked={draft.is_public}
              onChange={(e) => update('is_public', e.target.checked)}
            />
            <span style={{ fontSize: '14px', color: '#0A0A0A' }}>
              Live on public site
            </span>
          </label>
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
            style={{
              padding: '10px 18px',
              border: '1px solid rgba(10, 10, 10, 0.16)',
              background: '#FFFFFF',
              color: '#0A0A0A',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: pending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            onClick={save}
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
            }}
          >
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
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
