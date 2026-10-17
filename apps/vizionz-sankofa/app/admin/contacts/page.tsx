// VIZIONZ SANKOFA · /admin/contacts — one address book for the office
// People (partner and agency staff, funder officers, donors, vendors,
// volunteers) and Organizations (partners, funders, agencies) in one place.
// Participants are not listed here; they stay under Participants.
// What each role sees is decided by RLS (case managers: no funders/donors).

import { requireOperatorOrEmployee, getAccessRole, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { CONTACT_COLUMNS, canWriteSubject, isExecOrOp, type ContactRow } from '@/lib/crm/model'
import { Notice, PageIntro, isMissingTable } from '@/components/admin/ui'
import { ContactsClient, type DonorPerson, type OrgRow } from './ContactsClient'

export const dynamic = 'force-dynamic'

export default async function ContactsPage() {
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const supabase = await createClient()
  const seesDonors = isExecOrOp(role) || role === 'leadership_readonly'

  const [contacts, orgs, donors] = await Promise.all([
    supabase.from('vs_contacts').select(CONTACT_COLUMNS).order('display_name').limit(2000),
    supabase.from('organizations')
      .select('id, name, short_name, relationship_kind, type, status, primary_contact_name, primary_contact_email, primary_contact_phone, next_touch_due')
      .order('name').limit(2000),
    seesDonors
      ? supabase.from('donors').select('id, display_name, email, phone, donor_type, status').order('display_name').limit(2000)
      : Promise.resolve({ data: [], error: null }),
  ])

  return (
    <div>
      <PageIntro kicker="Office CRM" title="Contacts">
        Everyone VS works with: partner and agency staff, funders, donors, vendors and volunteers, and their organizations.
        Clients stay under Participants.
      </PageIntro>
      {!role && <Notice>Your account has no data-access role yet, so contacts are hidden.</Notice>}
      {isMissingTable(contacts.error) && <Notice>The people list needs the office CRM migrations (1400–2000).</Notice>}
      <ContactsClient
        contacts={(contacts.data ?? []) as unknown as ContactRow[]}
        orgs={(orgs.data ?? []) as unknown as OrgRow[]}
        donors={(donors.data ?? []) as unknown as DonorPerson[]}
        canAddPeople={canWriteSubject(role, 'contact')}
        canAddOrgs={isExecOrOp(role)}
        caseManager={role === 'case_manager'}
      />
    </div>
  )
}
