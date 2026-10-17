'use client'

import { useRouter } from 'next/navigation'
import { useMemo, useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ACCESS_ROLE_LABELS } from '@/lib/supabase/roles'
import type { VsAccessRole } from '@/lib/supabase/auth'
import {
  Card,
  Field,
  MONO,
  Notice,
  Pill,
  SectionLabel,
  TONES,
  inputStyle,
  miniBtn,
  primaryBtn,
} from '@/components/admin/ui'
import {
  ROLE_OPTIONS,
  accountRoleFor,
  formatMountain,
  type Activity,
  type Invite,
  type RoleChange,
  type StaffOption,
  type TeamMember,
} from './types'

const th = { textAlign: 'left' as const, fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase' as const, color: 'rgba(10,10,10,0.55)', fontFamily: MONO, padding: '6px 8px', borderBottom: '1px solid rgba(10,10,10,0.12)', whiteSpace: 'nowrap' as const }
const td = { fontSize: '14px', padding: '8px', borderBottom: '1px solid rgba(10,10,10,0.06)', verticalAlign: 'top' as const }
const num = { ...td, textAlign: 'right' as const, fontVariantNumeric: 'tabular-nums' as const }

function roleText(r: string | null | undefined): string {
  return r ? ACCESS_ROLE_LABELS[r as VsAccessRole] ?? r : 'No role'
}

export function TeamClient(props: {
  selfId: string
  team: TeamMember[]
  invites: Invite[]
  invitesMissing: boolean
  activity: Activity[]
  activityMissing: boolean
  roleChanges: RoleChange[]
  staff: StaffOption[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [msg, setMsg] = useState<{ tone: 'green' | 'red'; text: string } | null>(null)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [accessRole, setAccessRole] = useState<VsAccessRole>('case_manager')
  const [staffId, setStaffId] = useState('')

  const activityById = useMemo(() => new Map(props.activity.map((a) => [a.actor_user_id, a])), [props.activity])
  const nameById = useMemo(() => new Map(props.team.map((m) => [m.user_id, m.display_name || m.email])), [props.team])
  const openInvites = props.invites.filter((i) => !i.accepted_at && !i.revoked_at)

  function run(fn: () => Promise<string | null>, ok: string) {
    setMsg(null)
    startTransition(async () => {
      const err = await fn()
      if (err) setMsg({ tone: 'red', text: err })
      else {
        setMsg({ tone: 'green', text: ok })
        router.refresh()
      }
    })
  }

  function createInvite() {
    const e = email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return setMsg({ tone: 'red', text: 'Enter a valid email address.' })
    run(async () => {
      const { error } = await createClient()
        .from('vs_invites')
        .insert({ email: e, display_name: name.trim() || null, access_role: accessRole, staff_id: staffId || null })
      if (error) return error.code === '23505' ? 'That email already has an open invite.' : error.message
      setEmail('')
      setName('')
      setStaffId('')
      return null
    }, `Invite saved for ${e} as ${roleText(accessRole)}. They sign in at /admin/login with that email and get the role automatically.`)
  }

  function sendLink(inv: Invite) {
    run(async () => {
      const { error } = await createClient().auth.signInWithOtp({
        email: inv.email,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      })
      return error ? error.message : null
    }, `Sign-in link sent to ${inv.email}.`)
  }

  function revokeInvite(inv: Invite) {
    run(async () => {
      const { error } = await createClient().from('vs_invites').update({ revoked_at: new Date().toISOString() }).eq('id', inv.id)
      return error ? error.message : null
    }, `Invite for ${inv.email} withdrawn.`)
  }

  function changeRole(m: TeamMember, next: VsAccessRole) {
    if (next === m.access_role) return
    run(async () => {
      const { error } = await createClient()
        .from('vs_operators')
        .update({ access_role: next, role: accountRoleFor(next, m.role), activated_at: m.activated_at ?? new Date().toISOString() })
        .eq('user_id', m.user_id)
      return error ? error.message : null
    }, `${m.display_name || m.email} is now ${roleText(next)}.`)
  }

  function setRevoked(m: TeamMember, revoke: boolean) {
    if (revoke && !window.confirm(`Remove access for ${m.display_name || m.email}? They will be signed out of admin on their next page load.`)) return
    run(async () => {
      const { error } = await createClient()
        .from('vs_operators')
        .update(revoke ? { revoked_at: new Date().toISOString(), revoked_reason: 'Removed from Team screen' } : { revoked_at: null, revoked_reason: null })
        .eq('user_id', m.user_id)
      return error ? error.message : null
    }, revoke ? `Access removed for ${m.display_name || m.email}.` : `Access restored for ${m.display_name || m.email}.`)
  }

  return (
    <div>
      {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}

      {/* ── Invite ── */}
      <Card style={{ marginBottom: '24px' }}>
        <SectionLabel>Invite someone</SectionLabel>
        {props.invitesMissing ? (
          <p style={{ margin: 0, fontSize: '14px' }}>Invites are available once the invites database update is applied.</p>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0 16px' }}>
              <Field label="Email">
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} data-testid="invite-email" autoComplete="off" />
              </Field>
              <Field label="Name (optional)">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} data-testid="invite-name" />
              </Field>
              <Field label="Role" hint={ROLE_OPTIONS.find((r) => r.value === accessRole)?.help}>
                <select value={accessRole} onChange={(e) => setAccessRole(e.target.value as VsAccessRole)} style={inputStyle} data-testid="invite-role">
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Staff record (optional)" hint="Links their caseload when they first sign in.">
                <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={inputStyle} data-testid="invite-staff">
                  <option value="">None</option>
                  {props.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name || s.email || s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button type="button" onClick={createInvite} disabled={pending} style={primaryBtn(pending)} data-testid="invite-save">
              Save invite
            </button>
            <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', margin: '10px 0 0', lineHeight: 1.5 }}>
              The role is applied the first time they sign in with the magic link from the normal sign-in page. Use “Send sign-in
              link” to email it to them now.
            </p>
          </>
        )}
      </Card>

      {!props.invitesMissing && openInvites.length > 0 && (
        <Card style={{ marginBottom: '24px' }}>
          <SectionLabel>Open invites</SectionLabel>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="open-invites">
              <thead>
                <tr>
                  <th style={th}>Email</th>
                  <th style={th}>Role</th>
                  <th style={th}>Invited</th>
                  <th style={th} />
                </tr>
              </thead>
              <tbody>
                {openInvites.map((i) => (
                  <tr key={i.id}>
                    <td style={td}>
                      {i.email}
                      {i.display_name && <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)' }}>{i.display_name}</div>}
                    </td>
                    <td style={td}>{roleText(i.access_role)}</td>
                    <td style={td}>
                      {formatMountain(i.invited_at)}
                      {i.invited_by && <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)' }}>by {nameById.get(i.invited_by) ?? 'staff'}</div>}
                    </td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>
                      <button type="button" onClick={() => sendLink(i)} disabled={pending} style={miniBtn(pending)}>
                        Send sign-in link
                      </button>{' '}
                      <button type="button" onClick={() => revokeInvite(i)} disabled={pending} style={miniBtn(pending, true)}>
                        Withdraw
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Team + activity ── */}
      <Card style={{ marginBottom: '24px' }}>
        <SectionLabel>People and activity (last 30 days)</SectionLabel>
        {props.activityMissing && (
          <p style={{ fontSize: '13px', color: 'rgba(10,10,10,0.6)', marginTop: 0 }}>Activity counts appear once the activity database update is applied.</p>
        )}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="team-table">
            <thead>
              <tr>
                <th style={th}>Person</th>
                <th style={th}>Role</th>
                <th style={{ ...th, textAlign: 'right' }}>7 days</th>
                <th style={{ ...th, textAlign: 'right' }}>30 days</th>
                <th style={{ ...th, textAlign: 'right' }}>Contacts</th>
                <th style={{ ...th, textAlign: 'right' }}>Questions</th>
                <th style={{ ...th, textAlign: 'right' }}>Exports</th>
                <th style={th}>Last active</th>
                <th style={th} />
              </tr>
            </thead>
            <tbody>
              {props.team.map((m) => {
                const a = activityById.get(m.user_id)
                const self = m.user_id === props.selfId
                const last = [m.last_active_at, a?.last_action_at].filter(Boolean).sort().pop() ?? null
                return (
                  <tr key={m.user_id} style={{ opacity: m.revoked_at ? 0.55 : 1 }} data-testid={`team-row-${m.email}`}>
                    <td style={td}>
                      <div style={{ fontWeight: 600 }}>{m.display_name || m.email}</div>
                      <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)' }}>{m.email}</div>
                      {m.revoked_at && <Pill {...TONES.red}>Access removed</Pill>}
                      {!m.revoked_at && (m.role === 'pending' || !m.access_role) && <Pill {...TONES.amber}>Needs a role</Pill>}
                    </td>
                    <td style={td}>
                      <select
                        aria-label={`Role for ${m.display_name || m.email}`}
                        value={m.access_role ?? ''}
                        disabled={pending || self || !!m.revoked_at}
                        onChange={(e) => changeRole(m, e.target.value as VsAccessRole)}
                        style={{ ...inputStyle, padding: '6px 8px', minWidth: '150px' }}
                        data-testid={`role-select-${m.email}`}
                      >
                        {!m.access_role && <option value="">No role</option>}
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      {self && <div style={{ fontSize: '11px', color: 'rgba(10,10,10,0.5)', marginTop: '4px' }}>You can’t change your own role</div>}
                    </td>
                    <td style={num}>{a?.actions_7d ?? 0}</td>
                    <td style={num}>{a?.actions_30d ?? 0}</td>
                    <td style={num}>{a?.contacts_30d ?? 0}</td>
                    <td style={num}>{a?.questions_30d ?? 0}</td>
                    <td style={num}>{a?.exports_30d ?? 0}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatMountain(last)}</td>
                    <td style={td}>
                      {!self && (
                        <button type="button" onClick={() => setRevoked(m, !m.revoked_at)} disabled={pending} style={miniBtn(pending, !m.revoked_at)}>
                          {m.revoked_at ? 'Restore' : 'Remove access'}
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)', margin: '10px 0 0' }}>
          Counts come from the audit log: every change, contact logged, Intelligence question and export.
        </p>
      </Card>

      {/* ── Role-change audit ── */}
      <Card>
        <SectionLabel>Role changes (audit log)</SectionLabel>
        {props.roleChanges.length === 0 ? (
          <p style={{ margin: 0, fontSize: '14px', color: 'rgba(10,10,10,0.55)' }}>No role changes recorded yet.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="role-changes">
              <thead>
                <tr>
                  <th style={th}>When</th>
                  <th style={th}>Account</th>
                  <th style={th}>Change</th>
                  <th style={th}>By</th>
                </tr>
              </thead>
              <tbody>
                {props.roleChanges.map((c) => {
                  const d = c.details ?? {}
                  const from = d.from ? (d.from.revoked ? 'Access removed' : roleText(d.from.access_role)) : 'New account'
                  const to = d.to?.revoked ? 'Access removed' : roleText(d.to?.access_role)
                  return (
                    <tr key={c.id}>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>{formatMountain(c.occurred_at)}</td>
                      <td style={td}>{d.email ?? nameById.get(c.record_id ?? '') ?? '—'}</td>
                      <td style={td}>
                        {from} → <strong>{to}</strong>
                        {d.via_invite && (
                          <>
                            {' '}
                            <Pill {...TONES.green}>Invite</Pill>
                          </>
                        )}
                      </td>
                      <td style={td}>
                        {c.actor_email ?? 'System'}
                        {c.actor_role && <div style={{ fontSize: '12px', color: 'rgba(10,10,10,0.55)' }}>{roleText(c.actor_role)}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
