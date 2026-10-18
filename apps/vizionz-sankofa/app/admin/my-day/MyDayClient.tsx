'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { QuickLog, type SubjectOption } from '@/components/admin/crm/QuickLog'
import { AddTaskForm, TaskItem, type TaskWithLabel } from '@/components/admin/crm/TaskList'
import {
  ACTIVITY_KIND_LABELS, BUCKET_LABELS, groupTasks, subjectHref,
  type ActivityRow, type StaffMember, type TaskBucket,
} from '@/lib/crm/model'
import { Card, EmptyState, Meta, SectionLabel, formatDay } from '@/components/admin/ui'

const ORDER: TaskBucket[] = ['overdue', 'today', 'week', 'later', 'someday']

export function MyDayClient({
  tasks, delegated, focusTask, recent, staff, options, today, currentUserId, canWrite, canEditAnyTask,
}: {
  tasks: TaskWithLabel[]
  delegated: TaskWithLabel[]
  focusTask: TaskWithLabel | null
  recent: ActivityRow[]
  staff: StaffMember[]
  options: { group: string; items: SubjectOption[] }[]
  today: string
  currentUserId: string
  canWrite: boolean
  canEditAnyTask: boolean
}) {
  const router = useRouter()
  const refresh = () => router.refresh()
  const groups = groupTasks(tasks, today)
  const nowCount = groups.overdue.length + groups.today.length
  const focusInList = focusTask && tasks.some((t) => t.id === focusTask.id)
  const canEdit = (t: TaskWithLabel) => canWrite && (canEditAnyTask || t.assigned_to === currentUserId || t.created_by === currentUserId)

  return (
    <>
      <style>{`
        .vs-myday { display: grid; grid-template-columns: minmax(0, 3fr) minmax(280px, 2fr); grid-template-areas: "main actions" "main recent"; grid-template-rows: auto 1fr; gap: 16px 28px; align-items: start; }
        .vs-myday-main { grid-area: main; } .vs-myday-actions { grid-area: actions; } .vs-myday-recent { grid-area: recent; }
        @media (max-width: 860px) { .vs-myday { grid-template-columns: minmax(0, 1fr); grid-template-areas: "actions" "main" "recent"; grid-template-rows: auto; } }
      `}</style>
      <div className="vs-myday">
        <div className="vs-myday-main">
          {focusTask && !focusInList && (
            <div style={{ marginBottom: '24px' }}>
              <SectionLabel>Selected task</SectionLabel>
              <ul style={{ margin: 0, padding: 0 }}>
                <TaskItem task={focusTask} staff={staff} today={today} currentUserId={currentUserId} canEdit={canEdit(focusTask)} highlight />
              </ul>
            </div>
          )}
          <SectionLabel>{nowCount ? `${nowCount} to do now` : 'My tasks'}</SectionLabel>
          {tasks.length === 0 ? (
            <EmptyState title="No open tasks">Nothing assigned to you. Add one with “+ Task”.</EmptyState>
          ) : (
            ORDER.filter((b) => groups[b].length > 0).map((b) => (
              <div key={b} data-testid={`bucket-${b}`} style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 8px', color: b === 'overdue' ? '#CE1126' : '#0A0A0A' }}>
                  {BUCKET_LABELS[b]} · {groups[b].length}
                </div>
                <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
                  {groups[b].map((t) => (
                    <TaskItem key={t.id} task={t} staff={staff} today={today} currentUserId={currentUserId}
                      canEdit={canEdit(t)} highlight={focusTask?.id === t.id} />
                  ))}
                </ul>
              </div>
            ))
          )}
          {delegated.length > 0 && (
            <div style={{ marginTop: '28px' }}>
              <SectionLabel>Assigned by me to others · {delegated.length}</SectionLabel>
              <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
                {delegated.map((t) => (
                  <TaskItem key={t.id} task={t} staff={staff} today={today} currentUserId={currentUserId} canEdit={canEdit(t)} />
                ))}
              </ul>
            </div>
          )}
        </div>
        {canWrite && (
          <div className="vs-myday-actions" style={{ display: 'grid', gap: '16px' }}>
            <QuickLog options={options} today={today} onLogged={refresh} />
            <AddTaskForm staff={staff} currentUserId={currentUserId} today={today} onDone={refresh} />
          </div>
        )}
        <aside className="vs-myday-recent">
          <div>
            <SectionLabel>Recently logged by me</SectionLabel>
            {recent.length === 0 ? (
              <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.55)', margin: 0 }}>Nothing yet.</p>
            ) : (
              <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
                {recent.map((a) => (
                  <li key={a.id} style={{ listStyle: 'none' }}>
                    <Link href={subjectHref(a.subject_type, a.subject_id)} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <Card style={{ padding: '10px 14px' }}>
                        <div style={{ fontSize: '14px', fontWeight: 600, overflowWrap: 'anywhere' }}>{a.summary}</div>
                        <Meta>{ACTIVITY_KIND_LABELS[a.kind]} · {formatDay(a.occurred_at)}</Meta>
                      </Card>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </>
  )
}
