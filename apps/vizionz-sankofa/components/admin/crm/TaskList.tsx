'use client'

// VIZIONZ SANKOFA · tasks and reminders (My Day and every record page)

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createTask, setTaskStatus, updateTask } from '@/app/admin/actions/crm'
import {
  PRIORITY_LABELS, SUBJECT_LABELS, subjectHref,
  type StaffMember, type SubjectType, type TaskRow,
} from '@/lib/crm/model'
import { Meta, Pill, TONES, formatDay, inputStyle, miniBtn, primaryBtn, secondaryBtn, textareaStyle } from '../ui'

export type TaskWithLabel = TaskRow & { subject_label?: string | null }

export function TaskItem({
  task, staff, today, currentUserId, canEdit, showSubject = true, highlight = false,
}: {
  task: TaskWithLabel
  staff: StaffMember[]
  today: string
  currentUserId: string
  canEdit: boolean
  showSubject?: boolean
  highlight?: boolean
}) {
  const [status, setStatus] = useState(task.status)
  const [editing, setEditing] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const who = staff.find((s) => s.user_id === task.assigned_to)?.display_name ?? 'Someone'
  const overdue = status === 'open' && task.due_on && task.due_on < today
  const dueToday = status === 'open' && task.due_on === today

  const toggle = () => start(async () => {
    const next = status === 'done' ? 'open' : 'done'
    setStatus(next)
    const r = await setTaskStatus(task.id, next)
    if (!r.ok) { setStatus(status); setErr(r.error) }
  })

  return (
    <li id={`task-${task.id}`} data-testid="task-item" style={{ listStyle: 'none', background: highlight ? 'rgba(180,130,0,0.08)' : '#FFFFFF',
      border: '1px solid rgba(10,10,10,0.1)', borderRadius: '8px', padding: '12px 14px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
        <input type="checkbox" aria-label={`Done: ${task.title}`} checked={status === 'done'} disabled={!canEdit || pending}
          onChange={toggle} style={{ width: '22px', height: '22px', marginTop: '2px', flex: '0 0 auto', accentColor: '#007A33' }} />
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '15px', fontWeight: 600, textDecoration: status === 'done' ? 'line-through' : 'none',
              color: status === 'done' ? 'rgba(10,10,10,0.45)' : '#0A0A0A', overflowWrap: 'anywhere' }}>{task.title}</span>
            {overdue && <Pill {...TONES.red}>Overdue</Pill>}
            {dueToday && <Pill {...TONES.amber}>Today</Pill>}
            {task.priority === 'high' && status === 'open' && <Pill {...TONES.red}>High</Pill>}
            {status === 'cancelled' && <Pill {...TONES.grey}>Cancelled</Pill>}
          </div>
          <Meta>
            {[
              task.assigned_to === currentUserId ? 'You' : who,
              task.due_on ? `Due ${formatDay(task.due_on)}` : 'No due date',
              task.remind_on && status === 'open' ? `Reminder ${formatDay(task.remind_on)}` : null,
            ].filter(Boolean).join(' · ')}
            {showSubject && task.subject_type && task.subject_id && (
              <> · <Link href={subjectHref(task.subject_type, task.subject_id)} style={{ color: '#0A2548' }}>
                {SUBJECT_LABELS[task.subject_type]}{task.subject_label ? `: ${task.subject_label}` : ''}
              </Link></>
            )}
          </Meta>
          {task.notes && !editing && <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.7)', margin: '6px 0 0', whiteSpace: 'pre-wrap' }}>{task.notes}</p>}
          {err && <p role="alert" style={{ fontSize: '13px', color: '#CE1126', margin: '6px 0 0' }}>{err}</p>}
          {editing && (
            <form action={(fd) => start(async () => {
              const r = await updateTask(task.id, fd)
              if (r.ok) { setEditing(false); setErr(null) } else setErr(r.error)
            })} style={{ display: 'grid', gap: '8px', marginTop: '10px' }}>
              <input name="title" defaultValue={task.title} required aria-label="Title" style={inputStyle} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                <label style={{ fontSize: '12px' }}>Due<input name="due_on" type="date" defaultValue={task.due_on ?? ''} style={inputStyle} /></label>
                <label style={{ fontSize: '12px' }}>Reminder<input name="remind_on" type="date" defaultValue={task.remind_on ?? ''} style={inputStyle} /></label>
                <label style={{ fontSize: '12px' }}>For
                  <select name="assigned_to" defaultValue={task.assigned_to} style={inputStyle}>
                    {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.display_name}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '12px' }}>Priority
                  <select name="priority" defaultValue={task.priority} style={inputStyle}>
                    {(['high', 'normal', 'low'] as const).map((p) => <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>)}
                  </select>
                </label>
              </div>
              <textarea name="notes" defaultValue={task.notes ?? ''} aria-label="Notes" style={{ ...textareaStyle, minHeight: '56px' }} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="submit" disabled={pending} style={miniBtn(pending)}>Save</button>
                <button type="button" onClick={() => setEditing(false)} style={miniBtn()}>Cancel</button>
                {status === 'open' && (
                  <button type="button" style={miniBtn(pending, true)} onClick={() => start(async () => {
                    const r = await setTaskStatus(task.id, 'cancelled')
                    if (r.ok) { setStatus('cancelled'); setEditing(false) } else setErr(r.error)
                  })}>Cancel task</button>
                )}
              </div>
            </form>
          )}
        </div>
        {canEdit && !editing && <button type="button" onClick={() => setEditing(true)} style={{ ...miniBtn(), flex: '0 0 auto' }}>Edit</button>}
      </div>
    </li>
  )
}

export function AddTaskForm({
  staff, currentUserId, subject, today, onDone, canAssignOthers = true,
}: {
  staff: StaffMember[]
  currentUserId: string
  subject?: { type: SubjectType; id: string }
  today: string
  onDone?: () => void
  canAssignOthers?: boolean
}) {
  const [open, setOpen] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, start] = useTransition()
  if (!open) {
    return (
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button type="button" data-testid="add-task-open" onClick={() => { setOpen(true); setSaved(false) }} style={{ ...secondaryBtn(), minHeight: '44px' }}>+ Task</button>
        {saved && <span role="status" style={{ fontSize: '13px', color: '#007A33' }}>Task added.</span>}
      </div>
    )
  }
  return (
    <form data-testid="add-task-form" action={(fd) => start(async () => {
      if (subject) { fd.set('subject_type', subject.type); fd.set('subject_id', subject.id) }
      const r = await createTask(fd)
      if (r.ok) { setOpen(false); setErr(null); setSaved(true); onDone?.() } else setErr(r.error)
    })} style={{ display: 'grid', gap: '8px', background: '#FFFFFF', border: '1px solid rgba(10,10,10,0.1)', borderRadius: '8px', padding: '14px' }}>
      <input name="title" required maxLength={300} placeholder="What needs doing?" aria-label="Task" style={{ ...inputStyle, fontSize: '16px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>Due<input name="due_on" type="date" defaultValue={today} style={{ ...inputStyle, fontSize: '16px' }} /></label>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>Reminder<input name="remind_on" type="date" style={{ ...inputStyle, fontSize: '16px' }} /></label>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>For
          <select name="assigned_to" defaultValue={currentUserId} disabled={!canAssignOthers} aria-label="Assign to" style={{ ...inputStyle, fontSize: '16px' }}>
            {staff.map((s) => <option key={s.user_id} value={s.user_id}>{s.user_id === currentUserId ? `Me (${s.display_name})` : s.display_name}</option>)}
          </select>
        </label>
        <label style={{ fontSize: '12px', color: 'rgba(10,10,10,0.6)' }}>Priority
          <select name="priority" defaultValue="normal" style={{ ...inputStyle, fontSize: '16px' }}>
            <option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
          </select>
        </label>
      </div>
      <textarea name="notes" placeholder="Notes (optional)" aria-label="Notes" style={{ ...textareaStyle, minHeight: '56px', fontSize: '16px' }} />
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button type="submit" disabled={pending} style={{ ...primaryBtn(pending), minHeight: '44px' }}>{pending ? 'Saving…' : 'Add task'}</button>
        <button type="button" onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: '#CE1126', cursor: 'pointer', minHeight: '44px' }}>Cancel</button>
        {err && <span role="alert" style={{ fontSize: '13px', color: '#CE1126' }}>{err}</span>}
      </div>
    </form>
  )
}
