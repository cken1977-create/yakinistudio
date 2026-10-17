// VIZIONZ SANKOFA · /admin/contacts/[id] — one person
// Details, timeline (+ Log), tasks and files. RLS hides funder / donor
// contacts from case managers (they get a not-found).

import { notFound } from 'next/navigation'
import { requireOperatorOrEmployee, getAccessRole, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { AdminCrumbs } from '@/components/admin/nav/AdminCrumbs'
import { RecordPanel } from '@/components/admin/crm/RecordPanel'
import { loadPanel } from '@/lib/crm/load'
import { CONTACT_COLUMNS, canWriteSubject, isExecOrOp, type ContactRow } from '@/lib/crm/model'
import { todayMountain } from '@/components/admin/ui'
import { ContactDetailClient } from './ContactDetailClient'

export const dynamic = 'force-dynamic'

export default async function ContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const supabase = await createClient()
  const { data } = await supabase.from('vs_contacts').select(CONTACT_COLUMNS).eq('id', id).maybeSingle()
  if (!data) notFound()
  const contact = data as unknown as ContactRow
  const [orgs, panel] = await Promise.all([
    supabase.from('organizations').select('id, name').order('name').limit(2000),
    loadPanel(supabase, user, role, 'contact', id, contact.display_name),
  ])
  const orgList = (orgs.data ?? []) as Array<{ id: string; name: string }>

  return (
    <div>
      <AdminCrumbs trail={[{ label: 'Contacts', href: '/admin/contacts' }, { label: contact.display_name }]}
        fallbackHref="/admin/contacts" fallbackLabel="Contacts" />
      <ContactDetailClient contact={contact} orgs={orgList}
        orgName={contact.organization_id ? orgList.find((o) => o.id === contact.organization_id)?.name ?? null : null}
        canEdit={canWriteSubject(role, 'contact')} canArchive={isExecOrOp(role)} caseManager={role === 'case_manager'} />
      <RecordPanel {...panel} today={todayMountain()} />
    </div>
  )
}
