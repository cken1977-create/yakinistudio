// VIZIONZ SANKOFA · /admin/my-day — each person's day
// My tasks and reminders (overdue, today, next 7 days, later), "+ Log" for
// a call / email / meeting / note, "+ Task", and what I logged recently.
// Case managers also get their caseload list. Works on a phone.

import Link from 'next/link'
import { requireOperatorOrEmployee, getAccessRole, getOperatorDisplayName, touchLastActive } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { MyDay as CaseloadDay } from '@/components/admin/MyDay'
import { MyDayClient } from './MyDayClient'
import { labelTaskSubjects, loadStaff } from '@/lib/crm/load'
import { ACTIVITY_COLUMNS, TASK_COLUMNS, canWriteCrm, isExecOrOp, type ActivityRow, type TaskRow } from '@/lib/crm/model'
import type { SubjectOption } from '@/components/admin/crm/QuickLog'
import { Notice, PageIntro, todayMountain, isMissingTable } from '@/components/admin/ui'

export const dynamic = 'force-dynamic'

export default async function MyDayPage({ searchParams }: { searchParams: Promise<{ task?: string }> }) {
  const { task: focusTaskId } = await searchParams
  const user = await requireOperatorOrEmployee()
  void touchLastActive(user.id)
  const role = getAccessRole(user)
  const supabase = await createClient()
  const today = todayMountain()
  const firstName = getOperatorDisplayName(user).split(' ')[0]

  if (!role) {
    return (
      <div>
        <PageIntro kicker="My Day" title={`Hello, ${firstName}.`} />
        <Notice>Your account has no data-access role yet. Ask Carly or Khadijah to set one.</Notice>
      </div>
    )
  }

  const [mine, assignedByMe, recent, staff, contacts, orgs, clients, focus] = await Promise.all([
    supabase.from('vs_tasks').select(TASK_COLUMNS).eq('assigned_to', user.id).eq('status', 'open')
      .order('due_on', { ascending: true, nullsFirst: false }).limit(300),
    isExecOrOp(role)
      ? supabase.from('vs_tasks').select(TASK_COLUMNS).eq('created_by', user.id).neq('assigned_to', user.id).eq('status', 'open')
          .order('due_on', { ascending: true, nullsFirst: false }).limit(100)
      : Promise.resolve({ data: [], error: null }),
    supabase.from('vs_activities').select(ACTIVITY_COLUMNS).eq('logged_by', user.id).order('occurred_at', { ascending: false }).order('created_at', { ascending: false }).limit(8),
    loadStaff(supabase),
    supabase.from('vs_contacts').select('id, display_name').is('archived_at', null).order('display_name').limit(1000),
    supabase.from('organizations').select('id, name').order('name').limit(1000),
    role === 'case_manager'
      ? supabase.from('participants').select('id, first_name, last_name, preferred_name').neq('current_stage', 'exited').order('last_name').limit(500)
      : Promise.resolve({ data: [], error: null }),
    focusTaskId && /^[0-9a-f-]{36}$/i.test(focusTaskId)
      ? supabase.from('vs_tasks').select(TASK_COLUMNS).eq('id', focusTaskId).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
  ])

  const tablesMissing = isMissingTable(mine.error)
  const myTasks = await labelTaskSubjects(supabase, (mine.data ?? []) as unknown as TaskRow[])
  const delegated = await labelTaskSubjects(supabase, (assignedByMe.data ?? []) as unknown as TaskRow[])
  const focusTask = focus.data ? (await labelTaskSubjects(supabase, [focus.data as unknown as TaskRow]))[0] : null

  const options: { group: string; items: SubjectOption[] }[] = []
  const cl = (clients.data ?? []) as Array<{ id: string; first_name: string; last_name: string; preferred_name: string | null }>
  if (cl.length) options.push({ group: 'My clients', items: cl.map((p) => ({ type: 'participant', id: p.id, label: `${p.preferred_name || p.first_name} ${p.last_name}` })) })
  const ct = (contacts.data ?? []) as Array<{ id: string; display_name: string }>
  if (ct.length) options.push({ group: 'People', items: ct.map((c) => ({ type: 'contact', id: c.id, label: c.display_name })) })
  const og = (orgs.data ?? []) as Array<{ id: string; name: string }>
  if (og.length) options.push({ group: 'Organizations', items: og.map((o) => ({ type: 'organization', id: o.id, label: o.name })) })

  const dateLabel = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())

  return (
    <div>
      <PageIntro kicker={`My Day · ${dateLabel}`} title={`Good to see you, ${firstName}.`} accent="#CE1126">
        Your tasks and reminders, and a quick way to log a call, email, meeting or note.
        {isExecOrOp(role) && <> Everything that needs the office’s attention is on <Link href="/admin" style={{ color: '#0A2548' }}>Home</Link>.</>}
      </PageIntro>
      {tablesMissing && <Notice>The office CRM tables are not in the database yet (migrations 1400–2000).</Notice>}
      <MyDayClient
        tasks={myTasks}
        delegated={delegated}
        focusTask={focusTask}
        recent={(recent.data ?? []) as unknown as ActivityRow[]}
        staff={staff}
        options={options}
        today={today}
        currentUserId={user.id}
        canWrite={canWriteCrm(role)}
        canEditAnyTask={isExecOrOp(role)}
      />
      {role === 'case_manager' && (
        <div style={{ marginTop: '40px' }}>
          <CaseloadDay supabase={supabase} />
        </div>
      )}
    </div>
  )
}
