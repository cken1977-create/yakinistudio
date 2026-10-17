// VIZIONZ SANKOFA · /admin/organizations/[id] — one organization in the CRM
// Details, the people who work there, timeline (+ Log), tasks and files.
// Coalition agreements and check-ins stay on the Coalition Partners page.

import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireOperatorOrEmployee, getAccessRole, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { RecordPanel } from '@/components/admin/crm/RecordPanel'
import { Facts, RecordHeader } from '@/components/admin/crm/RecordHeader'
import { loadPanel } from '@/lib/crm/load'
import { CONTACT_KIND_LABELS, type ContactKind } from '@/lib/crm/model'
import { Card, Meta, Notice, Pill, SectionLabel, TONES, formatDay, todayMountain } from '@/components/admin/ui'
import { RELATIONSHIP_KIND_LABELS, type RelationshipKind } from '../types'

export const dynamic = 'force-dynamic'

type Org = {
  id: string; name: string; short_name: string | null; relationship_kind: RelationshipKind; type: string; status: string | null
  primary_contact_name: string | null; primary_contact_email: string | null; primary_contact_phone: string | null
  website: string | null; notes: string | null; next_touch_due: string | null
}

export default async function OrganizationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const supabase = await createClient()
  const { data } = await supabase.from('organizations')
    .select('id, name, short_name, relationship_kind, type, status, primary_contact_name, primary_contact_email, primary_contact_phone, website, notes, next_touch_due')
    .eq('id', id).maybeSingle()
  if (!data) notFound()
  const org = data as unknown as Org
  const [people, panel] = await Promise.all([
    supabase.from('vs_contacts').select('id, display_name, title, kind, phone, email').eq('organization_id', id).is('archived_at', null).order('display_name'),
    loadPanel(supabase, user, role, 'organization', id, org.name),
  ])
  const staff = (people.data ?? []) as Array<{ id: string; display_name: string; title: string | null; kind: ContactKind; phone: string | null; email: string | null }>
  const isPartner = org.relationship_kind === 'partner' || org.relationship_kind === 'both'
  // Case managers see funder-side timelines on 'both' orgs only through the record rules (partner / agency only).
  const cmRestricted = role === 'case_manager' && org.relationship_kind === 'both'

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Contacts', href: '/admin/contacts?tab=orgs' }, { label: org.short_name || org.name }]}
        fallbackHref="/admin/contacts?tab=orgs" fallbackLabel="Contacts" />
      <RecordHeader kicker={`Organization · ${RELATIONSHIP_KIND_LABELS[org.relationship_kind] ?? org.relationship_kind}`} title={org.name}
        pills={org.status && org.status !== 'active' ? <Pill {...TONES.grey}>{org.status}</Pill> : null}
        actions={isPartner ? <Link href={`/admin/coalition/${org.id}`} style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#CE1126', textDecoration: 'none' }}>Coalition page →</Link> : null} />
      <Facts items={[
        ['Type', org.type.replace('_', ' ')],
        ['Main contact', org.primary_contact_name],
        ['Phone', org.primary_contact_phone ? <a href={`tel:${org.primary_contact_phone}`} style={{ color: '#0A2548' }}>{org.primary_contact_phone}</a> : null],
        ['Email', org.primary_contact_email ? <a href={`mailto:${org.primary_contact_email}`} style={{ color: '#0A2548' }}>{org.primary_contact_email}</a> : null],
        ['Next touch', org.next_touch_due ? formatDay(org.next_touch_due) : null],
        ['Website', org.website ? <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noopener noreferrer" style={{ color: '#0A2548' }}>{org.website}</a> : null],
      ]} />
      {org.notes && <p style={{ fontSize: '15px', lineHeight: 1.6, whiteSpace: 'pre-wrap', margin: '16px 0 0' }}>{org.notes}</p>}

      <div style={{ marginTop: '28px' }}>
        <SectionLabel>People here · {staff.length}</SectionLabel>
        {staff.length === 0 ? (
          <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.55)', margin: 0 }}>No one linked yet. Add a person under Contacts and pick this organization.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '8px' }}>
            {staff.map((p) => (
              <Link key={p.id} href={`/admin/contacts/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <Card style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600 }}>{p.display_name}</div>
                  <Meta>{[p.title, CONTACT_KIND_LABELS[p.kind], p.phone].filter(Boolean).join(' · ')}</Meta>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
      {cmRestricted
        ? <div style={{ marginTop: '28px' }}><Notice tone="grey">This organization is also a funder, so its timeline is kept to executives and operators.</Notice></div>
        : <RecordPanel {...panel} today={todayMountain()} />}
    </div>
  )
}
