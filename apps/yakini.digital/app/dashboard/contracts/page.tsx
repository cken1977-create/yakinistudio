'use client'

import { useState, useEffect } from 'react'
import { SIGN_BASE_URL, contractTitle } from '@/lib/dashboard/contracts'


// ── Types ──────────────────────────────────────────────────────────────────
type Contract = {
  id: string
  client_name: string
  client_email: string
  client_business: string
  client_phone: string
  contract_type: string
  contract_title: string
  status: string
  signing_token: string | null
  sent_at: string | null
  viewed_at: string | null
  signed_at: string | null
  created_at: string
  notes: string
}

type View = 'list' | 'new' | 'detail'

type NewContract = {
  client_name: string
  client_email: string
  client_business: string
  client_phone: string
  contract_type: string
  setup_fee: string
  monthly_retainer: string
  min_term: string
  services: string[]
  special_terms: string
  notes: string
}

const EMPTY_CONTRACT: NewContract = {
  client_name: '',
  client_email: '',
  client_business: '',
  client_phone: '',
  contract_type: 'msa_sow',
  setup_fee: '',
  monthly_retainer: '',
  min_term: '3',
  services: [],
  special_terms: '',
  notes: '',
}

const SERVICE_OPTIONS = [
  'Website Design & Development',
  'Brand Identity & Logo',
  'Social Media Content',
  'Email Marketing',
  'SEO / Local Search',
  'Client Portal / Dashboard',
  'AI Tools & Automation',
  'Paid Ads Management',
  'Mobile App Development',
  'Video Production',
  'Google Business Profile',
  'Custom AI Tool Build',
]

const CONTRACT_TYPES = [
  { val: 'msa_sow', label: 'MSA + Statement of Work' },
  { val: 'msa', label: 'Master Services Agreement Only' },
  { val: 'sow', label: 'Statement of Work Only' },
  { val: 'nda', label: 'Non-Disclosure Agreement' },
  { val: 'custom', label: 'Custom Contract' },
]

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  draft:   { bg: 'rgba(136,136,136,0.12)', color: '#888' },
  sent:    { bg: 'rgba(200,168,75,0.12)',  color: '#C8A84B' },
  viewed:  { bg: 'rgba(74,144,217,0.12)',  color: '#4A90D9' },
  signed:  { bg: 'rgba(42,122,58,0.12)',   color: '#2A7A3A' },
  voided:  { bg: 'rgba(200,22,29,0.12)',   color: '#C8161D' },
}

// ── Helpers ────────────────────────────────────────────────────────────────
// ── Main Component ─────────────────────────────────────────────────────────
export default function ContractsPage() {
  const [view, setView] = useState<View>('list')
  const [contracts, setContracts] = useState<Contract[]>([])
  const [selected, setSelected] = useState<Contract | null>(null)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<NewContract>(EMPTY_CONTRACT)
  const [sending, setSending] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('all')

  const loadContracts = async () => {
    try {
      const res = await fetch('/api/dashboard/contracts', { cache: 'no-store' })
      if (res.status === 401) { window.location.href = '/dashboard/login'; return }
      if (!res.ok) throw new Error(`load failed (${res.status})`)
      setContracts((await res.json()).contracts ?? [])
    } catch (e) { console.error(e) }
    setLoading(false)
  }

  useEffect(() => {
    // Server list, loaded once after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadContracts()
  }, [])

  const showToast = (msg: string) => {
    setToast(msg); setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3500)
  }

  const set = (key: keyof NewContract, val: string | string[]) =>
    setForm(f => ({ ...f, [key]: val }))

  const toggleService = (svc: string) => {
    const curr = form.services
    set('services', curr.includes(svc) ? curr.filter(s => s !== svc) : [...curr, svc])
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.client_name.trim()) e.client_name = 'Required'
    if (!form.client_email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.client_email)) e.client_email = 'Valid email required'
    if (!form.client_business.trim()) e.client_business = 'Required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Create & Send Contract ───────────────────────────────────────────────
  const createAndSend = async () => {
    if (!validate()) return
    setSending(true)

    try {
      const res = await fetch('/api/dashboard/contracts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.status === 401) { window.location.href = '/dashboard/login'; return }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || `create failed (${res.status})`)

      showToast(data.emailed ? `✓ Contract sent to ${form.client_email}` : `Contract created; no email sent (${data.email_note || 'test address'})`)
      setForm(EMPTY_CONTRACT)
      setView('list')
      await loadContracts()

    } catch (e) {
      console.error(e)
      showToast('Error sending contract. Try again.')
    }
    setSending(false)
  }

  // ── Void contract ────────────────────────────────────────────────────────
  const voidContract = async (id: string) => {
    if (!confirm('Void this contract? The signing link will be deactivated.')) return
    const res = await fetch(`/api/dashboard/contracts/${id}/void`, { method: 'POST' })
    if (!res.ok) { showToast('Could not void the contract. Try again.'); return }
    showToast('Contract voided')
    await loadContracts()
    setView('list')
    setSelected(null)
  }

  // ── Resend contract ──────────────────────────────────────────────────────
  const resendContract = async (c: Contract) => {
    if (!c.signing_token) return
    const res = await fetch(`/api/dashboard/contracts/${c.id}/remind`, { method: 'POST' })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { showToast(data.error || 'Could not send the reminder.'); return }
    if (!data.emailed) { showToast(`No email sent (${data.email_note || 'test address'})`); return }
    showToast(`Reminder sent to ${c.client_email}`)
  }

  // ── Stats ────────────────────────────────────────────────────────────────
  const stats = {
    total:  contracts.length,
    sent:   contracts.filter(c => c.status === 'sent').length,
    viewed: contracts.filter(c => c.status === 'viewed').length,
    signed: contracts.filter(c => c.status === 'signed').length,
  }

  const filtered = filter === 'all'
    ? contracts
    : contracts.filter(c => c.status === filter)

  // ── RENDER ─────────────────────────────────────────────────────────────
  return (
    <>
      <style>{CSS}</style>
      <div className="yc-layout">

        {/* Sidebar */}
        <aside className="yc-sidebar">
          <div className="yc-sidebar-logo">
            <div className="yc-logo-name">Yakini</div>
            <div className="yc-logo-sub">Digital Infrastructure</div>
          </div>
          <nav className="yc-nav">
            <div className="yc-nav-item"><span>⬡</span> Pipeline</div>
            <div className="yc-nav-item yc-nav-active"><span>✍</span> Contracts</div>
            <a className="yc-nav-item" href="/dashboard/class" style={{ textDecoration: 'none' }}><span>◆</span> Yakini Academy</a>
            <div className="yc-nav-item"><span>◈</span> Clients</div>
            <div className="yc-nav-item"><span>○</span> Analytics</div>
            <div className="yc-nav-item"><span>◻</span> Settings</div>
          </nav>
          <div className="yc-sidebar-footer">
            <form action="/api/auth/signout?to=dashboard" method="post">
              <button type="submit" style={{ background: 'none', border: 0, color: 'inherit', font: 'inherit', cursor: 'pointer', padding: 0 }}>Sign out</button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <main className="yc-main">

          {/* ── LIST VIEW ── */}
          {view === 'list' && (
            <>
              {/* Topbar */}
              <div className="yc-topbar">
                <div>
                  <div className="yc-page-title">Contracts <span className="yc-gold">& E-Sign</span></div>
                </div>
                <button className="yc-btn-new" onClick={() => { setForm(EMPTY_CONTRACT); setView('new') }}>
                  + New Contract
                </button>
              </div>

              {/* Stats */}
              <div className="yc-stats">
                {[
                  { label: 'Total', value: stats.total, color: '#C8A84B' },
                  { label: 'Awaiting Signature', value: stats.sent, color: '#C8A84B' },
                  { label: 'Viewed', value: stats.viewed, color: '#4A90D9' },
                  { label: 'Signed', value: stats.signed, color: '#2A7A3A' },
                ].map(s => (
                  <div key={s.label} className="yc-stat">
                    <div className="yc-stat-label">{s.label}</div>
                    <div className="yc-stat-val" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div className="yc-filters">
                {['all', 'draft', 'sent', 'viewed', 'signed', 'voided'].map(f => (
                  <button key={f}
                    className={`yc-filter ${filter === f ? 'yc-filter-active' : ''}`}
                    onClick={() => setFilter(f)}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>

              {/* Table */}
              <div className="yc-table-wrap">
                {loading ? (
                  <div className="yc-empty"><div className="yc-spinner" /><span>Loading contracts...</span></div>
                ) : filtered.length === 0 ? (
                  <div className="yc-empty">
                    <div style={{ fontSize: 32, marginBottom: 12, color: '#2A2A2A' }}>✍</div>
                    <div style={{ color: '#888', fontSize: 15 }}>No contracts yet</div>
                    <div style={{ color: '#555', fontSize: 13, marginTop: 4 }}>
                      Click &ldquo;+ New Contract&rdquo; to send your first one
                    </div>
                  </div>
                ) : (
                  <table className="yc-table">
                    <thead>
                      <tr>
                        <th>Client</th>
                        <th>Document</th>
                        <th>Status</th>
                        <th>Sent</th>
                        <th>Signed</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(c => {
                        const sc = STATUS_COLORS[c.status] || STATUS_COLORS.draft
                        return (
                          <tr key={c.id} className="yc-row" onClick={() => { setSelected(c); setView('detail') }}>
                            <td>
                              <div className="yc-client-name">{c.client_name}</div>
                              <div className="yc-client-biz">{c.client_business}</div>
                            </td>
                            <td>
                              <div style={{ fontSize: 13, color: '#F8F5EF' }}>{c.contract_title}</div>
                            </td>
                            <td>
                              <span className="yc-badge" style={{ background: sc.bg, color: sc.color }}>
                                <span className="yc-dot" style={{ background: sc.color }} />
                                {c.status}
                              </span>
                            </td>
                            <td className="yc-date">{c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td className="yc-date">{c.signed_at ? new Date(c.signed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</td>
                            <td onClick={e => e.stopPropagation()}>
                              <div className="yc-row-actions">
                                {c.status === 'sent' || c.status === 'viewed' ? (
                                  <button className="yc-action-btn yc-action-resend"
                                    onClick={() => resendContract(c)}>↻ Remind</button>
                                ) : null}
                                {c.signing_token && c.status !== 'voided' ? (
                                  <button className="yc-action-btn yc-action-copy"
                                    onClick={() => { navigator.clipboard.writeText(`${SIGN_BASE_URL}/${c.signing_token}`); showToast('Link copied') }}>
                                    Copy Link
                                  </button>
                                ) : null}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}

          {/* ── NEW CONTRACT VIEW ── */}
          {view === 'new' && (
            <>
              <div className="yc-topbar">
                <div>
                  <div className="yc-page-title">New <span className="yc-gold">Contract</span></div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>Fill in the details and send for signature</div>
                </div>
                <button className="yc-btn-back" onClick={() => setView('list')}>← Back</button>
              </div>

              <div className="yc-form-wrap">

                {/* Client Info */}
                <div className="yc-form-section">
                  <div className="yc-form-section-title">Client Information</div>
                  <div className="yc-form-grid">
                    <div className="yc-field">
                      <label className="yc-label">Client Name <span className="yc-req">*</span></label>
                      <input className={`yc-input ${errors.client_name ? 'yc-input-err' : ''}`}
                        value={form.client_name} onChange={e => set('client_name', e.target.value)}
                        placeholder="Full name" />
                      {errors.client_name && <div className="yc-err">{errors.client_name}</div>}
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Business Name <span className="yc-req">*</span></label>
                      <input className={`yc-input ${errors.client_business ? 'yc-input-err' : ''}`}
                        value={form.client_business} onChange={e => set('client_business', e.target.value)}
                        placeholder="Business or DBA name" />
                      {errors.client_business && <div className="yc-err">{errors.client_business}</div>}
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Email Address <span className="yc-req">*</span></label>
                      <input className={`yc-input ${errors.client_email ? 'yc-input-err' : ''}`}
                        type="email" value={form.client_email} onChange={e => set('client_email', e.target.value)}
                        placeholder="client@email.com" />
                      {errors.client_email && <div className="yc-err">{errors.client_email}</div>}
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Phone Number</label>
                      <input className="yc-input" type="tel" value={form.client_phone}
                        onChange={e => set('client_phone', e.target.value)} placeholder="(000) 000-0000" />
                    </div>
                  </div>
                </div>

                {/* Contract Type */}
                <div className="yc-form-section">
                  <div className="yc-form-section-title">Contract Type</div>
                  <div className="yc-type-grid">
                    {CONTRACT_TYPES.map(t => (
                      <div key={t.val}
                        className={`yc-type-card ${form.contract_type === t.val ? 'yc-type-active' : ''}`}
                        onClick={() => set('contract_type', t.val)}>
                        <div className="yc-type-radio" />
                        <span>{t.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Investment */}
                <div className="yc-form-section">
                  <div className="yc-form-section-title">Investment</div>
                  <div className="yc-form-grid">
                    <div className="yc-field">
                      <label className="yc-label">Setup Fee</label>
                      <div className="yc-input-prefix-wrap">
                        <span className="yc-prefix">$</span>
                        <input className="yc-input yc-input-prefixed" value={form.setup_fee}
                          onChange={e => set('setup_fee', e.target.value)} placeholder="Amount" />
                      </div>
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Monthly Retainer</label>
                      <div className="yc-input-prefix-wrap">
                        <span className="yc-prefix">$</span>
                        <input className="yc-input yc-input-prefixed" value={form.monthly_retainer}
                          onChange={e => set('monthly_retainer', e.target.value)} placeholder="Amount" />
                      </div>
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Minimum Term (months)</label>
                      <select className="yc-input yc-select" value={form.min_term}
                        onChange={e => set('min_term', e.target.value)}>
                        <option value="0">Month-to-Month</option>
                        <option value="3">3 months</option>
                        <option value="6">6 months</option>
                        <option value="12">12 months</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="yc-form-section">
                  <div className="yc-form-section-title">Services Included</div>
                  <div className="yc-services-grid">
                    {SERVICE_OPTIONS.map(svc => (
                      <div key={svc}
                        className={`yc-svc ${form.services.includes(svc) ? 'yc-svc-active' : ''}`}
                        onClick={() => toggleService(svc)}>
                        <span className={`yc-svc-check ${form.services.includes(svc) ? 'yc-svc-check-active' : ''}`}>
                          {form.services.includes(svc) ? '✓' : ''}
                        </span>
                        {svc}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Terms */}
                <div className="yc-form-section">
                  <div className="yc-form-section-title">Special Terms & Notes</div>
                  <div className="yc-form-grid yc-form-full">
                    <div className="yc-field">
                      <label className="yc-label">Special Terms (visible to client)</label>
                      <textarea className="yc-textarea" value={form.special_terms}
                        onChange={e => set('special_terms', e.target.value)}
                        placeholder="Any project-specific terms, deliverable details, or custom conditions..." />
                    </div>
                    <div className="yc-field">
                      <label className="yc-label">Internal Notes (not visible to client)</label>
                      <textarea className="yc-textarea yc-textarea-sm" value={form.notes}
                        onChange={e => set('notes', e.target.value)}
                        placeholder="Internal reminders, context, or follow-up notes..." />
                    </div>
                  </div>
                </div>

                {/* Preview & Send */}
                <div className="yc-send-section">
                  <div className="yc-send-preview">
                    <div className="yc-send-preview-label">Document Preview</div>
                    <div className="yc-send-preview-title">
                      {form.client_business
                        ? contractTitle(form.contract_type, form.client_business)
                        : 'Fill in client details above'}
                    </div>
                    {form.client_email && (
                      <div className="yc-send-preview-email">
                        Will be sent to: <strong>{form.client_email}</strong>
                      </div>
                    )}
                    <div className="yc-send-preview-details">
                      {form.setup_fee && <span>Setup: ${form.setup_fee}</span>}
                      {form.monthly_retainer && <span>Monthly: ${form.monthly_retainer}/mo</span>}
                      {form.services.length > 0 && <span>{form.services.length} service{form.services.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>

                  <button className="yc-btn-send" onClick={createAndSend} disabled={sending}>
                    {sending ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
                        <span className="yc-mini-spinner" />
                        Sending contract...
                      </span>
                    ) : (
                      '✉ Send Contract for Signature'
                    )}
                  </button>

                  <p className="yc-send-note">
                    Client receives a secure signing link at sign.yakini.digital. Valid for 30 days.
                    Both parties receive a copy upon execution. ESIGN Act compliant.
                  </p>
                </div>

              </div>
            </>
          )}

          {/* ── DETAIL VIEW ── */}
          {view === 'detail' && selected && (
            <>
              <div className="yc-topbar">
                <div>
                  <div className="yc-page-title" style={{ fontSize: 22 }}>{selected.contract_title}</div>
                  <div style={{ fontSize: 13, color: '#555', marginTop: 4 }}>
                    {selected.client_name} · {selected.client_business}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="yc-btn-back" onClick={() => { setView('list'); setSelected(null) }}>← Back</button>
                  {selected.status !== 'voided' && selected.status !== 'signed' && (
                    <button className="yc-btn-void" onClick={() => voidContract(selected.id)}>Void</button>
                  )}
                </div>
              </div>

              <div className="yc-detail-wrap">

                {/* Status card */}
                <div className="yc-detail-card">
                  <div className="yc-detail-card-title">Status</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span className="yc-badge yc-badge-lg"
                      style={{ background: STATUS_COLORS[selected.status]?.bg, color: STATUS_COLORS[selected.status]?.color }}>
                      <span className="yc-dot" style={{ background: STATUS_COLORS[selected.status]?.color }} />
                      {selected.status}
                    </span>
                  </div>
                  <div className="yc-detail-timeline">
                    {[
                      { label: 'Created', val: selected.created_at },
                      { label: 'Sent', val: selected.sent_at },
                      { label: 'Viewed', val: selected.viewed_at },
                      { label: 'Signed', val: selected.signed_at },
                    ].map(item => (
                      <div key={item.label} className="yc-timeline-item">
                        <div className={`yc-timeline-dot ${item.val ? 'yc-timeline-dot-done' : ''}`} />
                        <div>
                          <div className="yc-timeline-label">{item.label}</div>
                          <div className="yc-timeline-val">
                            {item.val
                              ? new Date(item.val).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                              : 'Pending'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Client info */}
                <div className="yc-detail-card">
                  <div className="yc-detail-card-title">Client</div>
                  {[
                    ['Name', selected.client_name],
                    ['Business', selected.client_business],
                    ['Email', selected.client_email],
                    ['Phone', selected.client_phone || '—'],
                  ].map(([label, val]) => (
                    <div key={label} className="yc-detail-row">
                      <span className="yc-detail-label">{label}</span>
                      <span className="yc-detail-val">{val}</span>
                    </div>
                  ))}
                </div>

                {/* Signing link */}
                {selected.signing_token && selected.status !== 'voided' && (
                  <div className="yc-detail-card yc-link-card">
                    <div className="yc-detail-card-title">Signing Link</div>
                    <div className="yc-link-display">
                      <code className="yc-link-code">
                        {SIGN_BASE_URL}/{selected.signing_token.slice(0, 16)}...
                      </code>
                      <button className="yc-copy-btn"
                        onClick={() => { navigator.clipboard.writeText(`${SIGN_BASE_URL}/${selected.signing_token}`); showToast('Link copied') }}>
                        Copy
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
                      <button className="yc-action-btn yc-action-resend"
                        onClick={() => resendContract(selected)}>
                        ↻ Resend to {selected.client_email}
                      </button>
                      <button className="yc-action-btn yc-action-copy"
                        onClick={() => window.open(`${SIGN_BASE_URL}/${selected.signing_token}`, '_blank')}>
                        Open Link ↗
                      </button>
                    </div>
                  </div>
                )}

                {selected.notes && (
                  <div className="yc-detail-card">
                    <div className="yc-detail-card-title">Internal Notes</div>
                    <p style={{ fontSize: 13, color: '#888', lineHeight: 1.7 }}>{selected.notes}</p>
                  </div>
                )}
              </div>
            </>
          )}

        </main>
      </div>

      {/* Toast */}
      <div className={`yc-toast ${toastVisible ? 'yc-toast-show' : ''}`}>{toast}</div>
    </>
  )
}

// ── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body { background: #0A0A0A; color: #F8F5EF; font-family: 'DM Sans', sans-serif; }

  .yc-layout { display: flex; min-height: 100vh; }

  /* Sidebar */
  .yc-sidebar {
    width: 220px; flex-shrink: 0;
    background: #111; border-right: 1px solid #1E1E1E;
    padding: 28px 0; display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; bottom: 0; z-index: 10;
  }

  .yc-sidebar-logo { padding: 0 24px 28px; border-bottom: 1px solid #1E1E1E; margin-bottom: 20px; }
  .yc-logo-name { font-weight: 600; font-size: 16px; letter-spacing: 0.1em; text-transform: uppercase; color: #F8F5EF; }
  .yc-logo-sub { font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase; color: #C8A84B; margin-top: 4px; }

  .yc-nav { flex: 1; }
  .yc-nav-item {
    display: flex; align-items: center; gap: 10px;
    padding: 11px 24px; font-size: 13px; color: #555;
    cursor: pointer; transition: all 0.2s;
    border-left: 2px solid transparent;
  }
  .yc-nav-item:hover { color: #F8F5EF; background: rgba(255,255,255,0.02); }
  .yc-nav-active { color: #C8A84B !important; border-left-color: #C8A84B !important; background: rgba(200,168,75,0.08) !important; }

  .yc-sidebar-footer { padding: 20px 24px; border-top: 1px solid #1E1E1E; font-size: 11px; color: #333; }

  /* Main */
  .yc-main { margin-left: 220px; flex: 1; padding: 36px 40px; min-width: 0; }

  /* Topbar */
  .yc-topbar { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 32px; gap: 16px; }
  .yc-page-title { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 600; color: #F8F5EF; line-height: 1; }
  .yc-gold { color: #C8A84B; }

  /* Stats */
  .yc-stats { display: grid; grid-template-columns: repeat(4,1fr); gap: 16px; margin-bottom: 28px; }
  .yc-stat {
    background: #161616; border: 1px solid #1E1E1E;
    border-radius: 4px; padding: 20px;
    border-top: 2px solid #C8A84B;
  }
  .yc-stat-label { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #555; margin-bottom: 10px; }
  .yc-stat-val { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 600; line-height: 1; }

  /* Filters */
  .yc-filters { display: flex; gap: 8px; margin-bottom: 20px; flex-wrap: wrap; }
  .yc-filter {
    background: #161616; border: 1px solid #2A2A2A;
    color: #555; font-family: 'DM Sans', sans-serif;
    font-size: 11px; font-weight: 600; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 7px 16px;
    border-radius: 2px; cursor: pointer; transition: all 0.2s;
  }
  .yc-filter:hover { border-color: #555; color: #F8F5EF; }
  .yc-filter-active { border-color: #C8A84B !important; color: #C8A84B !important; background: rgba(200,168,75,0.1) !important; }

  /* Table */
  .yc-table-wrap { background: #161616; border: 1px solid #1E1E1E; border-radius: 4px; overflow: hidden; }

  .yc-empty { padding: 72px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px; color: #555; font-size: 14px; }

  .yc-spinner { width: 28px; height: 28px; border: 2px solid #2A2A2A; border-top-color: #C8A84B; border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  .yc-table { width: 100%; border-collapse: collapse; }
  .yc-table thead tr { background: #111; border-bottom: 1px solid #1E1E1E; }
  .yc-table th { text-align: left; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #444; font-weight: 500; padding: 13px 16px; }
  .yc-row { border-bottom: 1px solid #1E1E1E; cursor: pointer; transition: background 0.15s; }
  .yc-row:last-child { border-bottom: none; }
  .yc-row:hover { background: rgba(255,255,255,0.02); }
  .yc-table td { padding: 14px 16px; vertical-align: middle; }

  .yc-client-name { font-size: 14px; font-weight: 500; color: #F8F5EF; }
  .yc-client-biz { font-size: 12px; color: #C8A84B; margin-top: 3px; }
  .yc-date { font-size: 12px; color: #444; }

  .yc-badge {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 11px; font-weight: 500; letter-spacing: 0.08em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 2px;
  }
  .yc-badge-lg { padding: 6px 14px; font-size: 12px; }
  .yc-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  .yc-row-actions { display: flex; gap: 6px; }
  .yc-action-btn {
    font-family: 'DM Sans', sans-serif; font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    padding: 5px 12px; border-radius: 2px; border: none; cursor: pointer; transition: all 0.2s;
  }
  .yc-action-resend { background: rgba(200,168,75,0.1); color: #C8A84B; }
  .yc-action-resend:hover { background: rgba(200,168,75,0.2); }
  .yc-action-copy { background: rgba(255,255,255,0.06); color: #888; }
  .yc-action-copy:hover { background: rgba(255,255,255,0.1); color: #F8F5EF; }

  /* Buttons */
  .yc-btn-new {
    background: #C8A84B; color: #0A0A0A;
    font-family: 'DM Sans', sans-serif; font-size: 13px;
    font-weight: 700; letter-spacing: 0.1em;
    padding: 12px 24px; border: none; border-radius: 2px;
    cursor: pointer; transition: all 0.2s; white-space: nowrap;
  }
  .yc-btn-new:hover { background: #E2C97A; transform: translateY(-1px); }

  .yc-btn-back {
    background: transparent; border: 1px solid #2A2A2A; color: #555;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    letter-spacing: 0.1em; padding: 10px 20px; border-radius: 2px;
    cursor: pointer; transition: all 0.2s;
  }
  .yc-btn-back:hover { border-color: #888; color: #F8F5EF; }

  .yc-btn-void {
    background: transparent; border: 1px solid rgba(200,22,29,0.3); color: #C8161D;
    font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 500;
    letter-spacing: 0.1em; padding: 10px 20px; border-radius: 2px;
    cursor: pointer; transition: all 0.2s;
  }
  .yc-btn-void:hover { background: rgba(200,22,29,0.1); }

  /* Form */
  .yc-form-wrap { display: flex; flex-direction: column; gap: 24px; max-width: 900px; }

  .yc-form-section {
    background: #161616; border: 1px solid #1E1E1E;
    border-radius: 4px; padding: 28px;
  }

  .yc-form-section-title {
    font-size: 10px; font-weight: 700; letter-spacing: 0.2em;
    text-transform: uppercase; color: #C8A84B; margin-bottom: 20px;
  }

  .yc-form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .yc-form-full { grid-template-columns: 1fr; }

  .yc-field { display: flex; flex-direction: column; gap: 6px; }

  .yc-label { font-size: 10px; font-weight: 600; letter-spacing: 0.15em; text-transform: uppercase; color: #666; }
  .yc-req { color: #C8A84B; }

  .yc-input {
    background: #1C1C1C; border: 1px solid #2A2A2A; color: #F8F5EF;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    padding: 12px 14px; border-radius: 2px; outline: none;
    transition: border-color 0.2s; width: 100%;
  }
  .yc-input:focus { border-color: #C8A84B; }
  .yc-input::placeholder { color: #444; }
  .yc-input-err { border-color: #C8161D !important; }
  .yc-err { font-size: 11px; color: #C8161D; }

  .yc-select { appearance: none; cursor: pointer; }
  .yc-select option { background: #111; }

  .yc-input-prefix-wrap { position: relative; }
  .yc-prefix { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #C8A84B; font-weight: 600; font-size: 14px; }
  .yc-input-prefixed { padding-left: 28px; }

  .yc-textarea {
    background: #1C1C1C; border: 1px solid #2A2A2A; color: #F8F5EF;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    padding: 12px 14px; border-radius: 2px; outline: none;
    resize: vertical; min-height: 100px; line-height: 1.6;
    transition: border-color 0.2s; width: 100%;
  }
  .yc-textarea-sm { min-height: 72px; }
  .yc-textarea:focus { border-color: #C8A84B; }

  /* Contract types */
  .yc-type-grid { display: flex; flex-direction: column; gap: 8px; }
  .yc-type-card {
    display: flex; align-items: center; gap: 12px;
    background: #1C1C1C; border: 1px solid #2A2A2A;
    padding: 14px 16px; border-radius: 2px; cursor: pointer;
    font-size: 14px; color: #888; transition: all 0.2s;
  }
  .yc-type-card:hover { border-color: #C8A84B; color: #F8F5EF; }
  .yc-type-active { border-color: #C8A84B !important; color: #F8F5EF !important; background: rgba(200,168,75,0.08) !important; }
  .yc-type-radio {
    width: 14px; height: 14px; border-radius: 50%;
    border: 2px solid #444; flex-shrink: 0; transition: all 0.2s;
  }
  .yc-type-active .yc-type-radio { border-color: #C8A84B; background: #C8A84B; }

  /* Services */
  .yc-services-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; }
  .yc-svc {
    display: flex; align-items: center; gap: 10px;
    background: #1C1C1C; border: 1px solid #2A2A2A;
    padding: 10px 12px; border-radius: 2px; cursor: pointer;
    font-size: 13px; color: #888; transition: all 0.2s;
  }
  .yc-svc:hover { border-color: #C8A84B; color: #F8F5EF; }
  .yc-svc-active { border-color: #C8A84B !important; color: #F8F5EF !important; background: rgba(200,168,75,0.08) !important; }
  .yc-svc-check {
    width: 16px; height: 16px; border-radius: 2px;
    border: 1.5px solid #444; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: transparent;
    transition: all 0.2s;
  }
  .yc-svc-check-active { border-color: #C8A84B; background: #C8A84B; color: #0A0A0A; }

  /* Send section */
  .yc-send-section {
    background: #161616; border: 1px solid #1E1E1E;
    border-top: 3px solid #C8A84B;
    border-radius: 4px; padding: 28px;
  }

  .yc-send-preview { margin-bottom: 20px; }
  .yc-send-preview-label { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C8A84B; margin-bottom: 8px; }
  .yc-send-preview-title { font-size: 15px; font-weight: 600; color: #F8F5EF; margin-bottom: 6px; }
  .yc-send-preview-email { font-size: 13px; color: #888; margin-bottom: 8px; }
  .yc-send-preview-details { display: flex; gap: 16px; }
  .yc-send-preview-details span { font-size: 12px; color: #555; background: rgba(255,255,255,0.04); border: 1px solid #2A2A2A; padding: 3px 10px; border-radius: 2px; }

  .yc-btn-send {
    width: 100%; background: #C8A84B; color: #0A0A0A;
    font-family: 'DM Sans', sans-serif; font-size: 14px;
    font-weight: 700; letter-spacing: 0.12em;
    padding: 18px; border: none; border-radius: 2px;
    cursor: pointer; transition: all 0.2s; margin-bottom: 12px;
  }
  .yc-btn-send:hover:not(:disabled) { background: #E2C97A; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(200,168,75,0.25); }
  .yc-btn-send:disabled { opacity: 0.7; cursor: not-allowed; }

  .yc-mini-spinner { width: 16px; height: 16px; border: 2px solid rgba(0,0,0,0.2); border-top-color: #0A0A0A; border-radius: 50%; animation: spin 0.7s linear infinite; }

  .yc-send-note { font-size: 11px; color: #555; line-height: 1.6; text-align: center; }

  /* Detail view */
  .yc-detail-wrap { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .yc-detail-card { background: #161616; border: 1px solid #1E1E1E; border-radius: 4px; padding: 24px; }
  .yc-link-card { grid-column: 1 / -1; }
  .yc-detail-card-title { font-size: 10px; font-weight: 700; letter-spacing: 0.2em; text-transform: uppercase; color: #C8A84B; margin-bottom: 16px; }

  .yc-detail-row { display: flex; gap: 12px; margin-bottom: 10px; font-size: 13px; }
  .yc-detail-label { color: #555; min-width: 80px; flex-shrink: 0; }
  .yc-detail-val { color: #F8F5EF; }

  .yc-detail-timeline { display: flex; flex-direction: column; gap: 14px; }
  .yc-timeline-item { display: flex; gap: 14px; align-items: flex-start; }
  .yc-timeline-dot { width: 10px; height: 10px; border-radius: 50%; border: 2px solid #2A2A2A; background: transparent; flex-shrink: 0; margin-top: 3px; transition: all 0.2s; }
  .yc-timeline-dot-done { border-color: #C8A84B; background: #C8A84B; }
  .yc-timeline-label { font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #555; margin-bottom: 2px; }
  .yc-timeline-val { font-size: 13px; color: #F8F5EF; }

  .yc-link-display { display: flex; gap: 10px; align-items: center; margin-bottom: 8px; }
  .yc-link-code { font-family: monospace; font-size: 13px; color: #C8A84B; background: rgba(200,168,75,0.08); padding: 8px 12px; border-radius: 2px; flex: 1; overflow: hidden; }
  .yc-copy-btn { background: rgba(200,168,75,0.1); border: 1px solid rgba(200,168,75,0.3); color: #C8A84B; font-family: 'DM Sans', sans-serif; font-size: 12px; font-weight: 600; padding: 8px 16px; border-radius: 2px; cursor: pointer; white-space: nowrap; transition: all 0.2s; }
  .yc-copy-btn:hover { background: rgba(200,168,75,0.2); }

  /* Toast */
  .yc-toast {
    position: fixed; bottom: 28px; right: 28px;
    background: #161616; border: 1px solid #C8A84B;
    color: #F8F5EF; font-size: 13px;
    padding: 14px 20px; border-radius: 3px; z-index: 200;
    transform: translateY(20px); opacity: 0;
    transition: all 0.3s; pointer-events: none;
    font-family: 'DM Sans', sans-serif;
  }
  .yc-toast-show { transform: translateY(0) !important; opacity: 1 !important; }

  @media (max-width: 900px) {
    .yc-sidebar { display: none; }
    .yc-main { margin-left: 0; padding: 20px 16px; }
    .yc-stats { grid-template-columns: 1fr 1fr; }
    .yc-services-grid { grid-template-columns: 1fr 1fr; }
    .yc-detail-wrap { grid-template-columns: 1fr; }
    .yc-form-grid { grid-template-columns: 1fr; }
  }
`
