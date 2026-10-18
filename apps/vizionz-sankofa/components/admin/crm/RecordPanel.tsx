'use client'

// VIZIONZ SANKOFA · the CRM block on every record page:
// "+ Log", the activity timeline, tasks, and files.

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { deleteActivity } from '@/app/admin/actions/crm'
import type { AttachmentRow, StaffMember, SubjectType, TimelineEntry, TimelineSubject } from '@/lib/crm/model'
import { Card, EmptyState, Meta, Pill, SectionLabel, TONES, TabBar, formatDay, miniBtn } from '../ui'
import { QuickLog } from './QuickLog'
import { AddTaskForm, TaskItem, type TaskWithLabel } from './TaskList'
import { Attachments } from './Attachments'

export type { TimelineEntry }

type Tab = 'timeline' | 'tasks' | 'files'

export function RecordPanel({
  subject, timeline, tasks, attachments, staff, currentUserId, today,
  canWrite, canAddTasks, canDeleteEntries, canRemoveAnyFile, canEditAnyTask, showFiles = true,
}: {
  subject: { type: SubjectType; id: string; label: string }
  timeline: TimelineEntry[]
  tasks: TaskWithLabel[]
  attachments: AttachmentRow[]
  staff: StaffMember[]
  currentUserId: string
  today: string
  canWrite: boolean
  canAddTasks: boolean
  canDeleteEntries: boolean
  canRemoveAnyFile: boolean
  canEditAnyTask: boolean
  showFiles?: boolean
}) {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>('timeline')
  const [showDone, setShowDone] = useState(false)
  const [, start] = useTransition()
  const [err, setErr] = useState<string | null>(null)
  const openTasks = tasks.filter((t) => t.status === 'open')
  const shownTasks = showDone ? tasks : openTasks
  const refresh = () => router.refresh()

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'timeline', label: 'Timeline', count: timeline.length },
    { key: 'tasks', label: 'Tasks', count: openTasks.length },
  ]
  if (showFiles) tabs.push({ key: 'files', label: 'Files', count: attachments.length })

  return (
    <section data-testid="record-panel" style={{ marginTop: '32px' }}>
      {canWrite && (
        <div style={{ marginBottom: '20px' }}>
          <QuickLog subject={{ type: subject.type, id: subject.id, label: subject.label }} today={today} onLogged={refresh} />
        </div>
      )}
      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {tab === 'timeline' && (
        timeline.length === 0 ? (
          <EmptyState title="Nothing logged yet">{canWrite ? 'Use “+ Log” to record a call, email, meeting or note.' : null}</EmptyState>
        ) : (
          <ol style={{ margin: 0, padding: 0, display: 'grid', gap: '10px' }}>
            {err && <p role="alert" style={{ color: '#CE1126' }}>{err}</p>}
            {timeline.map((e) => (
              <li key={`${e.source}-${e.id}`} data-testid="timeline-entry" style={{ listStyle: 'none' }}>
                <Card style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                    <Pill {...(e.kind === 'note' ? TONES.grey : e.kind === 'meeting' ? TONES.purple : e.kind === 'email' ? TONES.navy : TONES.green)}>{e.kind}</Pill>
                    {e.direction && <Pill {...TONES.grey}>{e.direction === 'inbound' ? 'They reached out' : 'We reached out'}</Pill>}
                    <span style={{ fontSize: '15px', fontWeight: 600, overflowWrap: 'anywhere' }}>{e.summary}</span>
                  </div>
                  {e.details && e.details !== e.summary && (
                    <p style={{ fontSize: '14px', color: 'rgba(10,10,10,0.75)', margin: '4px 0 6px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{e.details}</p>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <Meta>{[formatDay(e.occurred_at), e.author].filter(Boolean).join(' · ')}</Meta>
                    {canDeleteEntries && e.source === 'activity' && (
                      <button type="button" style={miniBtn(false, true)} onClick={() => {
                        if (!window.confirm('Delete this entry? The audit log keeps a copy.')) return
                        start(async () => { const r = await deleteActivity(e.id); if (r.ok) refresh(); else setErr(r.error) })
                      }}>Delete</button>
                    )}
                  </div>
                </Card>
              </li>
            ))}
          </ol>
        )
      )}

      {tab === 'tasks' && (
        <div style={{ display: 'grid', gap: '12px' }}>
          {canAddTasks && <AddTaskForm staff={staff} currentUserId={currentUserId} subject={{ type: subject.type, id: subject.id }} today={today} onDone={refresh} />}
          <SectionLabel right={tasks.length > openTasks.length ? (
            <button type="button" onClick={() => setShowDone((v) => !v)} style={miniBtn()}>{showDone ? 'Hide finished' : 'Show finished'}</button>
          ) : null}>{openTasks.length} open</SectionLabel>
          {shownTasks.length === 0 ? <EmptyState title="No open tasks" /> : (
            <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
              {shownTasks.map((t) => (
                <TaskItem key={t.id} task={t} staff={staff} today={today} currentUserId={currentUserId} showSubject={false}
                  canEdit={canAddTasks && (canEditAnyTask || t.assigned_to === currentUserId || t.created_by === currentUserId)} />
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'files' && showFiles && subject.type !== 'participant' && (
        <Attachments subject={{ type: subject.type as TimelineSubject, id: subject.id }} initial={attachments}
          canUpload={canWrite} canRemoveAny={canRemoveAnyFile} currentUserId={currentUserId} />
      )}
    </section>
  )
}
