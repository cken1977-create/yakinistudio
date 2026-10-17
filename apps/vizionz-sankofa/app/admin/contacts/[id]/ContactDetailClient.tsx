'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Modal } from '@/components/admin/Modal'
import { Pill, SERIF, TONES, MONO, miniBtn, primaryBtn, secondaryBtn } from '@/components/admin/ui'
import { setContactArchived, updateContact } from '@/app/admin/actions/crm'
import { CONTACT_KIND_LABELS, type ContactRow } from '@/lib/crm/model'
import { PersonFields } from '../ContactsClient'

export function ContactDetailClient({
  contact, orgs, orgName, canEdit, canArchive, caseManager,
}: {
  contact: ContactRow; orgs: { id: string; name: string }[]; orgName: string | null
  canEdit: boolean; canArchive: boolean; caseManager: boolean
}) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const fact = (label: string, value: React.ReactNode) => (
    <div style={{ background: '#FFFFFF', padding: '14px 18px', minWidth: 0 }}>
      <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(10,10,10,0.55)', fontFamily: MONO, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '15px', overflowWrap: 'anywhere' }}>{value || '—'}</div>
    </div>
  )
  return (
    <>
      <div style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#5B2C8F', marginBottom: '12px', fontFamily: MONO }}>
        Contact · {CONTACT_KIND_LABELS[contact.kind]}
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '34px', lineHeight: 1.15, fontWeight: 600, margin: 0, fontFamily: SERIF, overflowWrap: 'anywhere' }}>{contact.display_name}</h1>
        {contact.archived_at && <Pill {...TONES.grey}>Archived</Pill>}
        <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
          {canEdit && <button type="button" onClick={() => setEditing(true)} style={miniBtn()}>Edit</button>}
          {canArchive && (
            <button type="button" disabled={pending} style={miniBtn(pending, !contact.archived_at)} onClick={() => start(async () => {
              const r = await setContactArchived(contact.id, !contact.archived_at)
              if (r.ok) router.refresh(); else setErr(r.error)
            })}>{contact.archived_at ? 'Restore' : 'Archive'}</button>
          )}
        </div>
      </div>
      {err && <p role="alert" style={{ color: '#CE1126' }}>{err}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'rgba(10,10,10,0.08)', border: '1px solid rgba(10,10,10,0.08)' }}>
        {fact('Title', contact.title)}
        {fact('Organization', contact.organization_id && orgName ? <Link href={`/admin/organizations/${contact.organization_id}`} style={{ color: '#0A2548' }}>{orgName}</Link> : null)}
        {fact('Phone', contact.phone ? <a href={`tel:${contact.phone}`} style={{ color: '#0A2548' }}>{contact.phone}</a> : null)}
        {fact('Email', contact.email ? <a href={`mailto:${contact.email}`} style={{ color: '#0A2548' }}>{contact.email}</a> : null)}
        {contact.donor_id && fact('Donor record', <Link href={`/admin/donors/${contact.donor_id}`} style={{ color: '#0A2548' }}>Open donor</Link>)}
      </div>
      {contact.notes && <p style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '16px 0 0' }}>{contact.notes}</p>}
      {editing && (
        <Modal title={`Edit ${contact.display_name}`} onClose={() => setEditing(false)}>
          <form action={(fd) => start(async () => {
            fd.set('display_name', [String(fd.get('first_name') ?? '').trim(), String(fd.get('last_name') ?? '').trim()].filter(Boolean).join(' ') || contact.display_name)
            const r = await updateContact(contact.id, fd)
            if (r.ok) { setEditing(false); router.refresh() } else setErr(r.error)
          })}>
            <PersonFields orgs={orgs} caseManager={caseManager} initial={contact} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={pending} style={primaryBtn(pending)}>Save</button>
              <button type="button" onClick={() => setEditing(false)} style={secondaryBtn()}>Cancel</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}
