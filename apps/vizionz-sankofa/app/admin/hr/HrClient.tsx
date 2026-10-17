'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { useUrlState } from '@/components/admin/nav/useUrlState'
import { Modal } from '@/components/admin/Modal'
import {
  Card, EmptyState, Field, Meta, Notice, Pill, SectionLabel, SERIF, TONES, TabBar,
  inputStyle, miniBtn, primaryBtn, secondaryBtn, textareaStyle,
} from '@/components/admin/ui'
import { createClient } from '@/lib/supabase/client'
import type { StaffMember } from '@/lib/crm/model'
import {
  ACK_LABELS, HANDBOOK_STATE_LABELS, HR_FILES_BUCKET, MAX_HR_FILE_BYTES, checklistProgress, handbookState, hrFilePath,
  jdAckState, latestVersion, lines, onboardingChecklist,
  type Handbook, type HandbookAck, type HandbookAssignment, type HandbookVersion, type InviteLite,
  type JdAssignment, type JobDescription, type Onboarding,
} from '@/lib/hr/model'
import {
  assignHandbook, assignJobDescription, createHandbook, createOnboarding, endHandbookAssignment, endJdAssignment,
  publishHandbookVersion, saveJobDescription, setJobDescriptionArchived, setOnboardingStatus,
} from '../actions/hr'
import { formatMountain } from '../team/types'

type Invite = InviteLite & { display_name: string | null }
type Tab = 'jds' | 'handbooks' | 'onboarding'
const ROLE_LABELS: Record<string, string> = { executive: 'Executive', operator: 'Operator', case_manager: 'Case manager', leadership_readonly: 'Leadership (read-only)' }
const ACK_TONE = { acknowledged: TONES.green, needs_reack: TONES.amber, pending: TONES.grey } as const
const HB_TONE = { signed: TONES.green, read: TONES.amber, unread: TONES.grey, no_version: TONES.grey } as const

export function HrClient(props: {
  jds: JobDescription[]; jdAssignments: JdAssignment[]; handbooks: Handbook[]; versions: HandbookVersion[]
  hbAssignments: HandbookAssignment[]; acks: HandbookAck[]; onboarding: Onboarding[]; invites: Invite[]; staff: StaffMember[]
}) {
  const { jds, jdAssignments, handbooks, versions, hbAssignments, acks, onboarding, invites, staff } = props
  const router = useRouter()
  const [tab, setTab] = useUrlState<Tab>('tab', 'jds', ['jds', 'handbooks', 'onboarding'])
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [pending, start] = useTransition()
  const [modal, setModal] = useState<null | { kind: 'jd'; jd?: JobDescription } | { kind: 'handbook' } | { kind: 'version'; handbook: Handbook } | { kind: 'hire' }>(null)

  const staffById = useMemo(() => new Map(staff.map((s) => [s.user_id, s])), [staff])
  const inviteById = useMemo(() => new Map(invites.map((i) => [i.id, i])), [invites])
  const openInvites = invites.filter((i) => !i.accepted_at && !i.revoked_at)
  const people = [
    ...staff.map((s) => ({ value: `user:${s.user_id}`, label: `${s.display_name} · ${ROLE_LABELS[s.access_role] ?? s.access_role}` })),
    ...openInvites.map((i) => ({ value: `invite:${i.id}`, label: `${i.display_name ?? i.email} (invited)` })),
  ]
  const whoName = (userId: string | null, inviteId: string | null) => {
    if (userId && staffById.get(userId)) return staffById.get(userId)!.display_name
    const inv = inviteId ? inviteById.get(inviteId) : undefined
    if (inv?.accepted_user_id && staffById.get(inv.accepted_user_id)) return staffById.get(inv.accepted_user_id)!.display_name
    return inv ? `${inv.display_name ?? inv.email} (invited)` : 'Former staff'
  }
  const ackUser = (a: { user_id: string | null; invite_id: string | null }) =>
    a.user_id ?? (a.invite_id ? inviteById.get(a.invite_id)?.accepted_user_id ?? null : null)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, ok: string, after?: () => void) {
    setMsg(null)
    start(async () => {
      const r = await fn()
      if (!r.ok) setMsg({ tone: 'red', text: r.error ?? 'Something went wrong.' })
      else { setMsg({ tone: 'green', text: ok }); after?.(); router.refresh() }
    })
  }

  const activeJds = jds.filter((j) => !j.archived_at)
  const activeHbs = handbooks.filter((h) => !h.archived_at)

  return (
    <>
      <TabBar tabs={[
        { key: 'jds', label: 'Job descriptions', count: activeJds.length },
        { key: 'handbooks', label: 'Handbooks', count: activeHbs.length },
        { key: 'onboarding', label: 'New hires', count: onboarding.filter((o) => o.status === 'open').length },
      ]} active={tab} onChange={setTab} />
      {msg && <div role="status" style={{ marginBottom: '16px' }}><Notice tone={msg.tone}>{msg.text}</Notice></div>}

      {tab === 'jds' && (
        <section data-testid="hr-jds">
          <SectionLabel right={<button type="button" onClick={() => setModal({ kind: 'jd' })} style={{ ...primaryBtn(), minHeight: '44px' }}>+ Job description</button>}>
            Job descriptions
          </SectionLabel>
          {jds.length === 0 ? <EmptyState title="No job descriptions yet">Add one, then assign it to a staff member or a new hire.</EmptyState> : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {jds.map((jd) => {
                const assigned = jdAssignments.filter((a) => a.job_description_id === jd.id)
                return (
                  <Card key={jd.id} style={{ opacity: jd.archived_at ? 0.6 : 1 }}>
                    <div data-testid="jd-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{jd.title}</h3>
                        <Meta>Version {jd.version}{jd.reports_to ? ` · reports to ${jd.reports_to}` : ''}{jd.archived_at ? ' · archived' : ''}</Meta>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button type="button" style={miniBtn()} onClick={() => setModal({ kind: 'jd', jd })}>Edit</button>
                        <button type="button" style={miniBtn(pending)} disabled={pending}
                          onClick={() => run(() => setJobDescriptionArchived(jd.id, !jd.archived_at), jd.archived_at ? 'Restored.' : 'Archived.')}>
                          {jd.archived_at ? 'Restore' : 'Archive'}
                        </button>
                      </div>
                    </div>
                    {jd.summary && <p style={{ fontSize: '14px', margin: '10px 0 0', overflowWrap: 'anywhere' }}>{jd.summary}</p>}
                    {lines(jd.duties).length > 0 && (
                      <ul style={{ margin: '8px 0 0', paddingLeft: '20px', fontSize: '14px' }}>{lines(jd.duties).slice(0, 4).map((d, i) => <li key={i}>{d}</li>)}</ul>
                    )}
                    <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
                      {assigned.map((a) => {
                        const st = jdAckState(a, jd.version)
                        return (
                          <div key={a.id} data-testid="jd-assignee" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '14px' }}>
                            <strong style={{ fontWeight: 600 }}>{whoName(a.user_id, a.invite_id)}</strong>
                            <Pill fg={ACK_TONE[st].fg} bg={ACK_TONE[st].bg}>{ACK_LABELS[st]}</Pill>
                            {a.acknowledged_at && <Meta>v{a.acknowledged_version} · {formatMountain(a.acknowledged_at)}</Meta>}
                            <button type="button" style={miniBtn(pending, true)} disabled={pending}
                              onClick={() => run(() => endJdAssignment(a.id), 'Assignment ended.')}>Unassign</button>
                          </div>
                        )
                      })}
                      {!jd.archived_at && <AssignRow people={people} pending={pending} label="Assign to"
                        onAssign={(who) => run(() => assignJobDescription(jd.id, who), 'Assigned. Their previous job description, if any, was ended.')} />}
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'handbooks' && (
        <section data-testid="hr-handbooks">
          <SectionLabel right={<button type="button" onClick={() => setModal({ kind: 'handbook' })} style={{ ...primaryBtn(), minHeight: '44px' }}>+ Handbook</button>}>
            Employee handbooks
          </SectionLabel>
          {handbooks.length === 0 ? <EmptyState title="No handbooks yet">Add a handbook, then publish its first version by writing it here or uploading the file.</EmptyState> : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {handbooks.map((h) => {
                const latest = latestVersion(versions, h.id)
                const assigned = hbAssignments.filter((a) => a.handbook_id === h.id)
                return (
                  <Card key={h.id}>
                    <div data-testid="handbook-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{h.title}</h3>
                        <Meta>{latest ? `Version ${latest.version} · published ${formatMountain(latest.published_at)}${latest.file_name ? ` · ${latest.file_name}` : ''}` : 'No version published yet'}</Meta>
                      </div>
                      <button type="button" style={{ ...secondaryBtn(), minHeight: '40px' }} onClick={() => setModal({ kind: 'version', handbook: h })}>Publish new version</button>
                    </div>
                    {latest?.change_note && <p style={{ fontSize: '13px', margin: '8px 0 0', color: 'rgba(10,10,10,0.65)' }}>What changed: {latest.change_note}</p>}
                    <div style={{ marginTop: '12px', display: 'grid', gap: '6px' }}>
                      {assigned.map((a) => {
                        const uid = ackUser(a)
                        const ack = latest && uid ? acks.find((k) => k.version_id === latest.id && k.user_id === uid) : undefined
                        const st = handbookState(latest, ack)
                        return (
                          <div key={a.id} data-testid="handbook-assignee" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', fontSize: '14px' }}>
                            <strong style={{ fontWeight: 600 }}>{whoName(a.user_id, a.invite_id)}</strong>
                            <Pill fg={HB_TONE[st].fg} bg={HB_TONE[st].bg}>{HANDBOOK_STATE_LABELS[st]}</Pill>
                            {ack?.signed_at && <Meta>signed “{ack.signed_name}” · {formatMountain(ack.signed_at)}</Meta>}
                            <button type="button" style={miniBtn(pending, true)} disabled={pending}
                              onClick={() => run(() => endHandbookAssignment(a.id), 'Assignment ended.')}>Unassign</button>
                          </div>
                        )
                      })}
                      <AssignRow people={people.filter((p) => !assigned.some((a) => p.value === `user:${a.user_id}` || p.value === `invite:${a.invite_id}`))}
                        pending={pending} label="Assign to" onAssign={(who) => run(() => assignHandbook(h.id, who), 'Handbook assigned.')} />
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      {tab === 'onboarding' && (
        <section data-testid="hr-onboarding">
          <SectionLabel right={<button type="button" onClick={() => setModal({ kind: 'hire' })} style={{ ...primaryBtn(), minHeight: '44px' }}>+ New hire</button>}>
            New-hire checklists
          </SectionLabel>
          {onboarding.length === 0 ? <EmptyState title="No new hires">Start a checklist: it saves their invite and assigns their job description and handbook in one step.</EmptyState> : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {onboarding.map((o) => {
                const inv = o.invite_id ? inviteById.get(o.invite_id) ?? null : null
                const jdA = o.job_description_id ? jdAssignments.find((a) => a.job_description_id === o.job_description_id && (a.invite_id === o.invite_id || (inv?.accepted_user_id && a.user_id === inv.accepted_user_id))) ?? null : null
                const jd = o.job_description_id ? jds.find((j) => j.id === o.job_description_id) : undefined
                const latest = o.handbook_id ? latestVersion(versions, o.handbook_id) : null
                const uid = inv?.accepted_user_id ?? o.user_id
                const ack = latest && uid ? acks.find((k) => k.version_id === latest.id && k.user_id === uid) : undefined
                const items = onboardingChecklist({ onboarding: o, invite: inv, jdAssignment: jdA, jdVersion: jd?.version ?? null, handbookLatest: latest, handbookAck: ack })
                const prog = checklistProgress(items)
                return (
                  <Card key={o.id} style={{ opacity: o.status === 'open' ? 1 : 0.65 }}>
                    <div data-testid="onboarding-card" style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ minWidth: 0 }}>
                        <h3 style={{ margin: 0, fontFamily: SERIF, fontSize: '18px', fontWeight: 400 }}>{o.full_name}</h3>
                        <Meta>{o.email}{o.start_date ? ` · starts ${o.start_date}` : ''} · {prog.done}/{prog.total} done{o.status !== 'open' ? ` · ${o.status}` : ''}</Meta>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {o.status === 'open' ? (
                          <>
                            <button type="button" style={miniBtn(pending)} disabled={pending} onClick={() => run(() => setOnboardingStatus(o.id, 'complete'), 'Marked complete.')}>Mark complete</button>
                            <button type="button" style={miniBtn(pending, true)} disabled={pending} onClick={() => run(() => setOnboardingStatus(o.id, 'cancelled'), 'Cancelled.')}>Cancel</button>
                          </>
                        ) : (
                          <button type="button" style={miniBtn(pending)} disabled={pending} onClick={() => run(() => setOnboardingStatus(o.id, 'open'), 'Reopened.')}>Reopen</button>
                        )}
                      </div>
                    </div>
                    <ul style={{ margin: '12px 0 0', padding: 0, display: 'grid', gap: '6px' }}>
                      {items.map((i) => (
                        <li key={i.key} data-testid={`check-${i.key}`} data-done={i.done ? 'yes' : 'no'} style={{ listStyle: 'none', display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' }}>
                          <span aria-hidden style={{ width: '18px', height: '18px', borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px',
                            background: i.done ? '#007A33' : 'transparent', color: '#FFFFFF', border: i.done ? 'none' : '1px solid rgba(10,10,10,0.3)' }}>{i.done ? '✓' : ''}</span>
                          <span>{i.label}{i.done ? '' : ' (to do)'}</span>{i.detail && <Meta>{i.detail}</Meta>}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )
              })}
            </div>
          )}
        </section>
      )}

      {modal?.kind === 'jd' && <JdModal jd={modal.jd} onClose={() => setModal(null)} onSaved={(t) => { setModal(null); setMsg({ tone: 'green', text: t }); router.refresh() }} />}
      {modal?.kind === 'handbook' && <HandbookModal onClose={() => setModal(null)} onSaved={() => { setModal(null); setMsg({ tone: 'green', text: 'Handbook added. Publish its first version next.' }); router.refresh() }} />}
      {modal?.kind === 'version' && <VersionModal handbook={modal.handbook} onClose={() => setModal(null)} onSaved={() => { setModal(null); setMsg({ tone: 'green', text: 'New version published. Everyone assigned will be asked to sign it.' }); router.refresh() }} />}
      {modal?.kind === 'hire' && <HireModal jds={activeJds} handbooks={activeHbs} onClose={() => setModal(null)}
        onSaved={() => { setModal(null); setMsg({ tone: 'green', text: 'New-hire checklist started and invite saved. They sign in at /admin/login with that email (send the link from Team).' }); router.refresh() }} />}
    </>
  )
}

function AssignRow({ people, pending, label, onAssign }: { people: { value: string; label: string }[]; pending: boolean; label: string; onAssign: (who: string) => void }) {
  const [who, setWho] = useState('')
  if (people.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' }}>
      <select aria-label={label} value={who} onChange={(e) => setWho(e.target.value)} style={{ ...inputStyle, width: 'auto', maxWidth: '100%', fontSize: '16px' }}>
        <option value="">{label}…</option>
        {people.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
      </select>
      <button type="button" disabled={!who || pending} style={miniBtn(!who || pending)} onClick={() => { onAssign(who); setWho('') }}>Assign</button>
    </div>
  )
}

function JdModal({ jd, onClose, onSaved }: { jd?: JobDescription; onClose: () => void; onSaved: (msg: string) => void }) {
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <Modal title={jd ? `Edit ${jd.title}` : 'New job description'} subtitle={jd ? 'Saving changes creates a new version; staff will be asked to acknowledge it again.' : undefined} onClose={onClose}>
      <form data-testid="jd-form" action={(fd) => start(async () => {
        if (jd) fd.set('id', jd.id)
        const r = await saveJobDescription(fd)
        if (r.ok) onSaved(jd ? 'Job description saved.' : 'Job description added.'); else setErr(r.error)
      })} style={{ display: 'grid', gap: '12px' }}>
        <Field label="Title"><input name="title" required defaultValue={jd?.title ?? ''} style={inputStyle} /></Field>
        <Field label="Reports to"><input name="reports_to" defaultValue={jd?.reports_to ?? ''} placeholder="e.g. Deputy Director" style={inputStyle} /></Field>
        <Field label="Summary"><textarea name="summary" defaultValue={jd?.summary ?? ''} style={textareaStyle} /></Field>
        <Field label="Duties" hint="One per line."><textarea name="duties" defaultValue={jd?.duties ?? ''} style={{ ...textareaStyle, minHeight: '120px' }} /></Field>
        <Field label="Qualifications" hint="One per line."><textarea name="qualifications" defaultValue={jd?.qualifications ?? ''} style={textareaStyle} /></Field>
        {err && <Notice tone="red">{err}</Notice>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Saving…' : 'Save job description'}</button>
        </div>
      </form>
    </Modal>
  )
}

function HandbookModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <Modal title="New handbook" onClose={onClose}>
      <form data-testid="handbook-form" action={(fd) => start(async () => { const r = await createHandbook(fd); if (r.ok) onSaved(); else setErr(r.error) })} style={{ display: 'grid', gap: '12px' }}>
        <Field label="Title"><input name="title" required placeholder="e.g. Employee Handbook" style={inputStyle} /></Field>
        <Field label="Description"><textarea name="description" style={textareaStyle} /></Field>
        {err && <Notice tone="red">{err}</Notice>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Saving…' : 'Add handbook'}</button>
        </div>
      </form>
    </Modal>
  )
}

function VersionModal({ handbook, onClose, onSaved }: { handbook: Handbook; onClose: () => void; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  const [file, setFile] = useState<File | null>(null)
  return (
    <Modal title={`Publish a new version of ${handbook.title}`} subtitle="Published versions can't be edited. Everyone assigned will be asked to sign the new one." onClose={onClose}>
      <form data-testid="version-form" action={(fd) => start(async () => {
        setErr(null)
        let uploaded: { path: string; name: string; size: number; mime: string } | undefined
        if (file) {
          if (file.size > MAX_HR_FILE_BYTES) { setErr('That file is over 25 MB.'); return }
          const path = hrFilePath(handbook.id, file.name)
          const { error } = await createClient().storage.from(HR_FILES_BUCKET).upload(path, file, { contentType: file.type || 'application/octet-stream' })
          if (error) { setErr(error.message); return }
          uploaded = { path, name: file.name, size: file.size, mime: file.type || 'application/octet-stream' }
        }
        const r = await publishHandbookVersion({ handbookId: handbook.id, body: String(fd.get('body') ?? ''), changeNote: String(fd.get('change_note') ?? ''), file: uploaded })
        if (r.ok) onSaved()
        else {
          setErr(r.error)
          if (uploaded) await createClient().storage.from(HR_FILES_BUCKET).remove([uploaded.path])
        }
      })} style={{ display: 'grid', gap: '12px' }}>
        <Field label="Handbook text" hint="Write it here, or upload the file below (or both)."><textarea name="body" style={{ ...textareaStyle, minHeight: '180px' }} /></Field>
        <Field label="Or upload a file (PDF or Word, up to 25 MB)">
          <input type="file" data-testid="version-file" accept=".pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="What changed (optional)"><input name="change_note" style={inputStyle} /></Field>
        {err && <Notice tone="red">{err}</Notice>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Publishing…' : 'Publish version'}</button>
        </div>
      </form>
    </Modal>
  )
}

function HireModal({ jds, handbooks, onClose, onSaved }: { jds: JobDescription[]; handbooks: Handbook[]; onClose: () => void; onSaved: () => void }) {
  const [err, setErr] = useState<string | null>(null)
  const [pending, start] = useTransition()
  return (
    <Modal title="New hire" subtitle="Saves their invite (same as Team) and assigns their job description and handbook. No email is sent from here." onClose={onClose}>
      <form data-testid="hire-form" action={(fd) => start(async () => { const r = await createOnboarding(fd); if (r.ok) onSaved(); else setErr(r.error) })} style={{ display: 'grid', gap: '12px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <Field label="Full name"><input name="full_name" required style={inputStyle} /></Field>
          <Field label="Work email"><input name="email" type="email" required style={inputStyle} /></Field>
          <Field label="Role">
            <select name="access_role" defaultValue="case_manager" style={inputStyle}>
              {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          <Field label="Start date"><input name="start_date" type="date" style={inputStyle} /></Field>
          <Field label="Job description">
            <select name="job_description_id" defaultValue="" style={inputStyle}>
              <option value="">None yet</option>
              {jds.map((j) => <option key={j.id} value={j.id}>{j.title}</option>)}
            </select>
          </Field>
          <Field label="Handbook">
            <select name="handbook_id" defaultValue="" style={inputStyle}>
              <option value="">None yet</option>
              {handbooks.map((h) => <option key={h.id} value={h.id}>{h.title}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Notes"><textarea name="notes" style={textareaStyle} /></Field>
        {err && <Notice tone="red">{err}</Notice>}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <button type="button" onClick={onClose} style={secondaryBtn()}>Cancel</button>
          <button type="submit" disabled={pending} style={primaryBtn(pending)}>{pending ? 'Saving…' : 'Start checklist'}</button>
        </div>
      </form>
    </Modal>
  )
}
