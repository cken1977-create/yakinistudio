// VIZIONZ SANKOFA · HR records model (pure; shared by server and client).

export const HR_FILES_BUCKET = 'vs-hr-files'
export const MAX_HR_FILE_BYTES = 25 * 1024 * 1024

export type JobDescription = {
  id: string; title: string; summary: string | null; duties: string | null; qualifications: string | null
  reports_to: string | null; version: number; archived_at: string | null; updated_at: string
}
export type JdAssignment = {
  id: string; job_description_id: string; user_id: string | null; invite_id: string | null
  assigned_at: string; acknowledged_at: string | null; acknowledged_version: number | null; ended_at: string | null
}
export type Handbook = { id: string; title: string; description: string | null; archived_at: string | null }
export type HandbookVersion = {
  id: string; handbook_id: string; version: number; body: string | null; storage_path: string | null
  file_name: string | null; file_size: number | null; change_note: string | null; published_at: string
}
export type HandbookAssignment = { id: string; handbook_id: string; user_id: string | null; invite_id: string | null; assigned_at: string; ended_at: string | null }
export type HandbookAck = { version_id: string; user_id: string; read_at: string | null; signed_at: string | null; signed_name: string | null }
export type Onboarding = {
  id: string; full_name: string; email: string; start_date: string | null; invite_id: string | null; user_id: string | null
  job_description_id: string | null; handbook_id: string | null; status: 'open' | 'complete' | 'cancelled'; notes: string | null; created_at: string
}
export type InviteLite = { id: string; email: string; accepted_at: string | null; accepted_user_id: string | null; revoked_at: string | null }

export const JD_COLUMNS = 'id, title, summary, duties, qualifications, reports_to, version, archived_at, updated_at'
export const JD_ASSIGNMENT_COLUMNS = 'id, job_description_id, user_id, invite_id, assigned_at, acknowledged_at, acknowledged_version, ended_at'
export const HANDBOOK_VERSION_COLUMNS = 'id, handbook_id, version, body, storage_path, file_name, file_size, change_note, published_at'
export const ONBOARDING_COLUMNS = 'id, full_name, email, start_date, invite_id, user_id, job_description_id, handbook_id, status, notes, created_at'

/** Duties / qualifications are stored one per line. */
export function lines(text: string | null | undefined): string[] {
  return (text ?? '').split(/\r?\n/).map((l) => l.replace(/^\s*[-•*]\s*/, '').trim()).filter(Boolean)
}

export type AckState = 'acknowledged' | 'needs_reack' | 'pending'
export function jdAckState(a: Pick<JdAssignment, 'acknowledged_at' | 'acknowledged_version'>, currentVersion: number): AckState {
  if (!a.acknowledged_at || a.acknowledged_version == null) return 'pending'
  return a.acknowledged_version < currentVersion ? 'needs_reack' : 'acknowledged'
}
export const ACK_LABELS: Record<AckState, string> = {
  acknowledged: 'Acknowledged', needs_reack: 'Updated, needs acknowledging again', pending: 'Not yet acknowledged',
}

export function latestVersion<T extends { handbook_id: string; version: number }>(versions: T[], handbookId: string): T | null {
  let best: T | null = null
  for (const v of versions) if (v.handbook_id === handbookId && (!best || v.version > best.version)) best = v
  return best
}

export type HandbookState = 'signed' | 'read' | 'unread' | 'no_version'
export function handbookState(latest: HandbookVersion | null, ack: HandbookAck | undefined): HandbookState {
  if (!latest) return 'no_version'
  if (ack?.signed_at) return 'signed'
  if (ack?.read_at) return 'read'
  return 'unread'
}
export const HANDBOOK_STATE_LABELS: Record<HandbookState, string> = {
  signed: 'Signed', read: 'Opened, not signed', unread: 'Not opened', no_version: 'No version published',
}

export type ChecklistItem = { key: string; label: string; done: boolean; detail?: string }
/** New-hire checklist, computed live from the invite / JD / handbook records. */
export function onboardingChecklist(input: {
  onboarding: Onboarding
  invite: InviteLite | null
  jdAssignment: JdAssignment | null
  jdVersion: number | null
  handbookLatest: HandbookVersion | null
  handbookAck: HandbookAck | undefined
}): ChecklistItem[] {
  const { onboarding: o, invite, jdAssignment, jdVersion, handbookLatest, handbookAck } = input
  const items: ChecklistItem[] = []
  items.push({ key: 'invite', label: 'Invite saved', done: !!invite && !invite.revoked_at, detail: invite?.revoked_at ? 'Invite was revoked' : undefined })
  items.push({ key: 'signin', label: 'Signed in for the first time', done: !!invite?.accepted_at || !!o.user_id })
  if (o.job_description_id) {
    const st = jdAssignment && jdVersion != null ? jdAckState(jdAssignment, jdVersion) : 'pending'
    items.push({ key: 'jd', label: 'Job description acknowledged', done: st === 'acknowledged', detail: jdAssignment ? undefined : 'Not assigned' })
  }
  if (o.handbook_id) {
    items.push({ key: 'handbook', label: 'Handbook signed', done: handbookState(handbookLatest, handbookAck) === 'signed' })
  }
  return items
}
export function checklistProgress(items: ChecklistItem[]): { done: number; total: number } {
  return { done: items.filter((i) => i.done).length, total: items.length }
}

export function hrFilePath(handbookId: string, fileName: string, now = Date.now()): string {
  const safe = fileName.normalize('NFKD').replace(/[^\w.\- ]+/g, '').replace(/\s+/g, '-').slice(-120) || 'file'
  return `handbooks/${handbookId}/${now}-${safe}`
}
