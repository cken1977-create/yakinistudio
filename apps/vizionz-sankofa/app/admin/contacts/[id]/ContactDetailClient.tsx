'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Modal } from '@/components/admin/Modal'
import { Pill, SERIF, TONES, MONO, miniBtn, primaryBtn, secondaryBtn } from '@/components/admin/ui'
import { deleteContact, setContactArchived, updateContact } from '@/app/admin/actions/crm'
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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
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
          {canArchive && !contact.archived_at && (
            <button type="button" data-testid="delete-contact" onClick={() => setConfirmDelete(true)} style={miniBtn(false, true)}>Delete contact</button>
          )}
          {canArchive && contact.archived_at && (
            <button type="button" disabled={pending} style={miniBtn(pending)} onClick={() => start(async () => {
              const r = await setContactArchived(contact.id, false)
              if (r.ok) { setNotice(`${contact.display_name} is back on the contact list.`); router.refresh() } else setErr(r.error)
            })}>Restore</button>
          )}
        </div>
      </div>
      {notice && <p role="status">{notice}</p>}
      {err && <p role="alert" style={{ color: '#CE1126' }}>{err}</p>}
      {contact.archived_at && (
        <p style={{ fontSize: '14px' }}>{contact.display_name} was removed from the active contact list. Notes, tasks, and files were kept. Restore puts them back.</p>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1px', background: 'rgba(10,10,10,0.08)', border: '1px solid rgba(10,10,10,0.08)' }}>
        {fact('Title', contact.title)}
        {fact('Organization', contact.organization_id && orgName ? <Link href={`/admin/organizations/${contact.organization_id}`} style={{ color: '#0A2548' }}>{orgName}</Link> : null)}
        {fact('Phone', contact.phone ? <a href={`tel:${contact.phone}`} style={{ color: '#0A2548' }}>{contact.phone}</a> : null)}
        {fact('Email', contact.email ? <a href={`mailto:${contact.email}`} style={{ color: '#0A2548' }}>{contact.email}</a> : null)}
        {contact.donor_id && fact('Donor record', <Link href={`/admin/donors/${contact.donor_id}`} style={{ color: '#0A2548' }}>Open donor</Link>)}
      </div>
      {contact.notes && <p style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '16px 0 0' }}>{contact.notes}</p>}
      {confirmDelete && (
        <Modal title="Delete contact" onClose={() => { if (!pending) setConfirmDelete(false) }}>
          <p>Delete <strong>{contact.display_name}</strong> from the active contact list?</p>
          <p style={{ fontSize: '14px', lineHeight: 1.5 }}>This takes them off the active list. Their notes, tasks, and files stay. You can restore them afterward. Nothing is sent for someone else to approve, and cancel leaves them unchanged.</p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setConfirmDelete(false)} disabled={pending} style={secondaryBtn()}>Cancel</button>
            <button type="button" disabled={pending} style={primaryBtn(pending)} onClick={() => start(async () => {
              const r = await deleteContact(contact.id)
              if (r.ok) {
                setConfirmDelete(false)
                setNotice(`${contact.display_name} was removed from the active contact list. Their notes and files were kept.`)
                router.refresh()
              } else setErr(r.error)
            })}>{pending ? 'Deleting…' : `Delete ${contact.display_name}`}</button>
          </div>
        </Modal>
      )}
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
