'use client'

// VIZIONZ SANKOFA · tasks about one client, on the participant page.
// Calls, meetings and notes for clients stay in Case Notes.

import { useRouter } from 'next/navigation'
import type { StaffMember } from '@/lib/crm/model'
import { SectionLabel } from '../ui'
import { AddTaskForm, TaskItem, type TaskWithLabel } from './TaskList'

export function ParticipantTasks({
  participantId, tasks, staff, today, currentUserId, canAdd, canEditAny,
}: {
  participantId: string; tasks: TaskWithLabel[]; staff: StaffMember[]; today: string; currentUserId: string; canAdd: boolean; canEditAny: boolean
}) {
  const router = useRouter()
  const open = tasks.filter((t) => t.status === 'open')
  if (!canAdd && open.length === 0) return null
  return (
    <section data-testid="participant-tasks" style={{ marginBottom: '28px' }}>
      <SectionLabel right={canAdd ? <AddTaskForm staff={staff} currentUserId={currentUserId} today={today}
        subject={{ type: 'participant', id: participantId }} onDone={() => router.refresh()} /> : null}>
        Tasks and reminders · {open.length}
      </SectionLabel>
      {open.length > 0 && (
        <ul style={{ margin: 0, padding: 0, display: 'grid', gap: '8px' }}>
          {open.map((t) => (
            <TaskItem key={t.id} task={t} staff={staff} today={today} currentUserId={currentUserId} showSubject={false}
              canEdit={canAdd && (canEditAny || t.assigned_to === currentUserId || t.created_by === currentUserId)} />
          ))}
        </ul>
      )}
    </section>
  )
}
