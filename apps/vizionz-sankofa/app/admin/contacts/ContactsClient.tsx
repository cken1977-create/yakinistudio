'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { useUrlState } from '@/components/admin/nav/useUrlState'
import { Modal } from '@/components/admin/Modal'
import {
  Card, EmptyState, Field, FilterButton, Meta, Pill, Row, SERIF, TONES, TabBar,
  formatDay, inputStyle, primaryBtn, secondaryBtn, textareaStyle,
} from '@/components/admin/ui'
import { createContact, createOrganization } from '@/app/admin/actions/crm'
import { CM_CONTACT_KINDS, CONTACT_KIND_LABELS, type ContactKind, type ContactRow } from '@/lib/crm/model'
import { RELATIONSHIP_KIND_LABELS, type RelationshipKind } from '../organizations/types'

export type OrgRow = {
  id: string; name: string; short_name: string | null; relationship_kind: RelationshipKind; type: string; status: string | null
  primary_contact_name: string | null; primary_contact_email: string | null; primary_contact_phone: string | null; next_touch_due: string | null
}
export type DonorPerson = { id: string; display_name: string; email: string | null; phone: string | null; donor_type: string; status: string }

type Person = { key: string; href: string; name: string; kind: ContactKind; sub: string; email: string | null; phone: string | null; archived: boolean }
type Tab = 'people' | 'orgs'
const PEOPLE_FILTERS = ['all', 'partner', 'agency', 'funder', 'donor', 'vendor', 'volunteer', 'other', 'archived'] as const
const ORG_FILTERS = ['all', 'partner', 'funder', 'both', 'agency'] as const
const KIND_TONE: Record<string, { fg: string; bg: string }> = {
  partner: TONES.purple, agency: TONES.navy, funder: TONES.green, donor: TONES.amber, both: TONES.amber,
  vendor: TONES.grey, volunteer: TONES.grey, other: TONES.grey,
}
const ORG_TYPES = ['nonprofit', 'county', 'state', 'city', 'federal', 'foundation', 'corporate', 'coalition', 'united_way', 'faith_based', 'other']

export function ContactsClient({
  contacts, orgs, donors, canAddPeople, canAddOrgs, caseManager,
}: {
  contacts: ContactRow[]; orgs: OrgRow[]; donors: DonorPerson[]; canAddPeople: boolean; canAddOrgs: boolean; caseManager: boolean
}) {
  const [tab, setTab] = useUrlState<Tab>('tab', 'people', ['people', 'orgs'])
  const [q, setQ] = useUrlState<string>('q', '')
  const [pf, setPf] = useUrlState<(typeof PEOPLE_FILTERS)[number]>('kind', 'all', PEOPLE_FILTERS)
  const [of, setOf] = useUrlState<(typeof ORG_FILTERS)[number]>('org', 'all', ORG_FILTERS)
  const [modal, setModal] = useState<'person' | 'org' | null>(null)
  const orgName = useMemo(() => new Map(orgs.map((o) => [o.id, o.short_name || o.name])), [orgs])

  const people: Person[] = useMemo(() => {
    const linkedDonors = new Set(contacts.map((c) => c.donor_id).filter(Boolean))
    return [
      ...contacts.map((c) => ({
        key: `c-${c.id}`, href: `/admin/contacts/${c.id}`, name: c.display_name, kind: c.kind,
        sub: [c.title, c.organization_id ? orgName.get(c.organization_id) : null].filter(Boolean).join(' · '),
        email: c.email, phone: c.phone, archived: !!c.archived_at,
      })),
      ...donors.filter((d) => !linkedDonors.has(d.id)).map((d) => ({
        key: `d-${d.id}`, href: `/admin/donors/${d.id}`, name: d.display_name, kind: 'donor' as ContactKind,
        sub: `Donor record · ${d.donor_type}`, email: d.email, phone: d.phone, archived: false,
      })),
    ].sort((a, b) => a.name.localeCompare(b.name))
  }, [contacts, donors, orgName])

  const needle = q.trim().toLowerCase()
  const shownPeople = people.filter((p) =>
    (pf === 'archived' ? p.archived : !p.archived && (pf === 'all' || p.kind === pf)) &&
    (!needle || [p.name, p.sub, p.email ?? '', p.phone ?? ''].join(' ').toLowerCase().includes(needle)))
  const shownOrgs = orgs.filter((o) =>
    (of === 'all' || o.relationship_kind === of) &&
    (!needle || [o.name, o.short_name ?? '', o.primary_contact_name ?? '', o.type].join(' ').toLowerCase().includes(needle)))
  const peopleFilters = PEOPLE_FILTERS.filter((f) => !caseManager || f === 'all' || f === 'archived' || CM_CONTACT_KINDS.includes(f as ContactKind))

  return (
    <>
      <TabBar tabs={[{ key: 'people', label: 'People', count: people.filter((p) => !p.archived).length }, { key: 'orgs', label: 'Organizations', count: orgs.length }]}
        active={tab} onChange={setTab} />
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search contacts"
          placeholder={tab === 'people' ? 'Search people by name, organization, email or phone…' : 'Search organizations…'}
          style={{ ...inputStyle, flex: '1 1 240px', width: 'auto', fontSize: '16px' }} />
        {tab === 'people' && canAddPeople && <button type="button" onClick={() => setModal('person')} style={{ ...primaryBtn(), minHeight: '44px' }}>+ Add person</button>}
        {tab === 'orgs' && canAddOrgs && <button type="button" onClick={() => setModal('org')} style={{ ...primaryBtn(), minHeight: '44px' }}>+ Add organization</button>}
      </section>
      <section style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
        {tab === 'people'
          ? peopleFilters.map((f) => (
              <FilterButton key={f} active={pf === f} onClick={() => setPf(f)}
                label={f === 'all' ? 'All' : f === 'archived' ? 'Archived' : CONTACT_KIND_LABELS[f as ContactKind]} />
            ))
          : ORG_FILTERS.map((f) => (
              <FilterButton key={f} active={of === f} onClick={() => setOf(f)}
                label={`${f === 'all' ? 'All' : RELATIONSHIP_KIND_LABELS[f]} · ${f === 'all' ? orgs.length : orgs.filter((o) => o.relationship_kind === f).length}`} />
            ))}
      </section>

      {tab === 'people' ? (
        shownPeople.length === 0 ? (
          <EmptyState title={people.length === 0 ? 'No people yet' : 'No one matches'}>
            {people.length === 0 ? (canAddPeople ? 'Add the partner, agency and funder people VS works with.' : null) : 'Try a different search or filter.'}
          </EmptyState>
        ) : (
          <ul data-testid="people-list" style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
            {shownPeople.map((p) => (
              <li key={p.key} style={{ listStyle: 'none' }}>
                <Link href={p.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Card style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, fontFamily: SERIF }}>{p.name}</h3>
                        <Pill {...KIND_TONE[p.kind]}>{CONTACT_KIND_LABELS[p.kind]}</Pill>
                        {p.archived && <Pill {...TONES.grey}>Archived</Pill>}
                      </div>
                      {p.sub && <Meta>{p.sub}</Meta>}
                    </div>
                    <Meta>{[p.phone, p.email].filter(Boolean).join(' · ')}</Meta>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )
      ) : shownOrgs.length === 0 ? (
        <EmptyState title={orgs.length === 0 ? 'No organizations yet' : 'No organizations match'} />
      ) : (
        <ul data-testid="org-list" style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
          {shownOrgs.map((o) => (
            <li key={o.id} style={{ listStyle: 'none' }}>
              <Link href={`/admin/organizations/${o.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ padding: '14px 18px', display: 'flex', flexWrap: 'wrap', gap: '8px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ minWidth: 0, flex: '1 1 220px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <h3 style={{ fontSize: '17px', fontWeight: 600, margin: 0, fontFamily: SERIF }}>{o.name}</h3>
                      <Pill {...KIND_TONE[o.relationship_kind]}>{RELATIONSHIP_KIND_LABELS[o.relationship_kind] ?? o.relationship_kind}</Pill>
                      {o.status && o.status !== 'active' && <Pill {...TONES.grey}>{o.status}</Pill>}
                    </div>
                    <Meta>{[o.type.replace('_', ' '), o.primary_contact_name ? `Contact: ${o.primary_contact_name}` : null,
                      o.next_touch_due ? `Next touch ${formatDay(o.next_touch_due)}` : null].filter(Boolean).join(' · ')}</Meta>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {modal === 'person' && <AddPersonModal orgs={orgs} caseManager={caseManager} onClose={() => setModal(null)} />}
      {modal === 'org' && <AddOrgModal onClose={() => setModal(null)} />}
    </>
  )
}

export function PersonFields({ orgs, caseManager, initial }: { orgs: { id: string; name: string }[]; caseManager: boolean; initial?: Partial<ContactRow> }) {
  const kinds = (Object.keys(CONTACT_KIND_LABELS) as ContactKind[]).filter((k) => !caseManager || CM_CONTACT_KINDS.includes(k))
  return (
    <>
      <Row>
        <Field label="First name"><input name="first_name" defaultValue={initial?.first_name ?? ''} style={inputStyle} /></Field>
        <Field label="Last name"><input name="last_name" defaultValue={initial?.last_name ?? ''} style={inputStyle} /></Field>
      </Row>
      <Row>
        <Field label="Type">
          <select name="kind" defaultValue={initial?.kind ?? 'partner'} style={inputStyle}>
            {kinds.map((k) => <option key={k} value={k}>{CONTACT_KIND_LABELS[k]}</option>)}
          </select>
        </Field>
        <Field label="Title / role"><input name="title" defaultValue={initial?.title ?? ''} style={inputStyle} /></Field>
      </Row>
      <Field label="Organization">
        <select name="organization_id" defaultValue={initial?.organization_id ?? ''} style={inputStyle}>
          <option value="">— None —</option>
          {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </Field>
      <Row>
        <Field label="Phone"><input name="phone" type="tel" defaultValue={initial?.phone ?? ''} style={inputStyle} /></Field>
        <Field label="Email"><input name="email" type="email" defaultValue={initial?.email ?? ''} style={inputStyle} /></Field>
      </Row>
      <Field label="Notes" hint="No client names or details here."><textarea name="notes" defaultValue={initial?.notes ?? ''} style={textareaStyle} /></Field>
    </>
  )
}

function AddPersonModal({ orgs, caseManager, onClose }: { orgs: OrgRow[]; caseManager: boolean; onClose: () => void }) {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <Modal title="Add a person" subtitle="Partner, agency, funder, donor, vendor or volunteer. Clients go under Participants." onClose={onClose}>
      <form action={(fd) => start(async () => {
        const r = await createContact(fd)
        if (r.ok && r.data) router.push(`/admin/contacts/${r.data.id}`)
        else if (!r.ok) setErr(r.error)
      })}>
        <PersonFields orgs={orgs} caseManager={caseManager} />
        {err && <p role="alert" style={{ color: '#CE1126', fontSize: '14px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Saving…' : 'Save person'}</button>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}

function AddOrgModal({ onClose }: { onClose: () => void }) {
  const router = useRouter()
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <Modal title="Add an organization" onClose={onClose}>
      <form action={(fd) => start(async () => {
        const r = await createOrganization(fd)
        if (r.ok && r.data) router.push(`/admin/organizations/${r.data.id}`)
        else if (!r.ok) setErr(r.error)
      })}>
        <Field label="Name"><input name="name" required style={inputStyle} /></Field>
        <Row>
          <Field label="Relationship">
            <select name="relationship_kind" defaultValue="partner" style={inputStyle}>
              {(['partner', 'agency', 'funder', 'both'] as RelationshipKind[]).map((k) => <option key={k} value={k}>{RELATIONSHIP_KIND_LABELS[k]}</option>)}
            </select>
          </Field>
          <Field label="Type">
            <select name="type" defaultValue="nonprofit" style={inputStyle}>
              {ORG_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </Field>
        </Row>
        <Row>
          <Field label="Main contact"><input name="primary_contact_name" style={inputStyle} /></Field>
          <Field label="Phone"><input name="primary_contact_phone" type="tel" style={inputStyle} /></Field>
        </Row>
        <Row>
          <Field label="Email"><input name="primary_contact_email" type="email" style={inputStyle} /></Field>
          <Field label="Website"><input name="website" style={inputStyle} /></Field>
        </Row>
        <Field label="Notes"><textarea name="notes" style={textareaStyle} /></Field>
        {err && <p role="alert" style={{ color: '#CE1126', fontSize: '14px' }}>{err}</p>}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Saving…' : 'Save organization'}</button>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
        </div>
      </form>
    </Modal>
  )
}
