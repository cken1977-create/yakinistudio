'use client'

import { useState, useEffect, useCallback } from 'react'

const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0'

type Intake = {
  id: string
  created_at: string
  first_name: string
  last_name: string
  biz_name: string
  phone: string
  email: string
  location: string
  referral: string
  industry: string
  biz_desc: string
  ideal_customer: string
  years_in_biz: string
  has_website: string
  existing_url: string
  services: string[]
  other_services: string
  primary_goal: string
  success_vision: string
  budget: string
  timeline: string
  has_branding: string
  competitors: string
  brand_feeling: string
  digital_score: number | null
  anything_else: string
  contact_pref: string
  status: string
  notes: string
}

const STATUS_COLORS: Record<string, string> = {
  new: '#C8A84B',
  contacted: '#4A90D9',
  active: '#4CAF7D',
  closed: '#E8924A',
  lost: '#E05555',
}

const STATUS_BG: Record<string, string> = {
  new: 'rgba(200,168,75,0.12)',
  contacted: 'rgba(74,144,217,0.12)',
  active: 'rgba(76,175,125,0.12)',
  closed: 'rgba(232,146,74,0.12)',
  lost: 'rgba(224,85,85,0.12)',
}

export default function DashboardPage() {
  const [intakes, setIntakes] = useState<Intake[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Intake | null>(null)
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [toast, setToast] = useState('')
  const [toastVisible, setToastVisible] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')

  const showToast = (msg: string) => {
    setToast(msg)
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 3000)
  }

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/client_intake?order=created_at.desc`, {
        headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      })
      if (!res.ok) throw new Error(await res.text())
      setIntakes(await res.json())
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = intakes.filter(r => {
    const matchFilter = filter === 'all' || r.status === filter
    const q = search.toLowerCase()
    const matchSearch = !q ||
      (r.first_name || '').toLowerCase().includes(q) ||
      (r.last_name || '').toLowerCase().includes(q) ||
      (r.biz_name || '').toLowerCase().includes(q) ||
      (r.email || '').toLowerCase().includes(q) ||
      (r.industry || '').toLowerCase().includes(q)
    return matchFilter && matchSearch
  })

  const stat = (s: string) => intakes.filter(r => r.status === s).length

  const updateStatus = async (id: string, status: string) => {
    setUpdatingStatus(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/client_intake?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setIntakes(prev => prev.map(r => r.id === id ? { ...r, status } : r))
        if (selected?.id === id) setSelected(prev => prev ? { ...prev, status } : null)
        showToast(`Status updated → ${status}`)
      }
    } catch (e) { console.error(e) }
    setUpdatingStatus(false)
  }

  return (
    <>
      <style>{css}</style>
      <div className="yd-layout">

        {/* Sidebar */}
        <aside className="yd-sidebar">
          <div className="yd-sidebar-logo">
            <div className="yd-logo-name">Yakini</div>
            <div className="yd-logo-sub">Digital Infrastructure</div>
          </div>
          <nav className="yd-nav">
            <div className="yd-nav-item yd-nav-active"><span className="yd-nav-icon">⬡</span>Pipeline</div>
            <div className="yd-nav-item"><span className="yd-nav-icon">◈</span>Clients</div>
            <div className="yd-nav-item"><span className="yd-nav-icon">◇</span>Projects</div>
            <div className="yd-nav-item"><span className="yd-nav-icon">○</span>Analytics</div>
            <div className="yd-nav-item"><span className="yd-nav-icon">◻</span>Settings</div>
          </nav>
          <div className="yd-sidebar-footer">yakini.digital</div>
        </aside>

        {/* Main */}
        <main className="yd-main">

          {/* Topbar */}
          <div className="yd-topbar">
            <div>
              <div className="yd-page-title">Client <span className="yd-gold">Pipeline</span></div>
            </div>
            <div className="yd-topbar-right">
              {lastUpdated && <span className="yd-updated">Updated {lastUpdated}</span>}
              <button className="yd-btn-refresh" onClick={load}>↻ Refresh</button>
            </div>
          </div>

          {/* Stats */}
          <div className="yd-stats">
            {[
              { label: 'Total Intakes', value: intakes.length, accent: '#C8A84B' },
              { label: 'New', value: stat('new'), accent: '#C8A84B' },
              { label: 'Active Clients', value: stat('active'), accent: '#4CAF7D' },
              { label: 'Contacted', value: stat('contacted'), accent: '#4A90D9' },
            ].map(s => (
              <div key={s.label} className="yd-stat-card" style={{ '--accent': s.accent } as React.CSSProperties}>
                <div className="yd-stat-label">{s.label}</div>
                <div className="yd-stat-value" style={{ color: s.accent }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="yd-filters">
            {['all', 'new', 'contacted', 'active', 'closed', 'lost'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`yd-filter-btn ${filter === f ? 'yd-filter-active' : ''}`}>
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
            <input
              className="yd-search"
              type="text"
              placeholder="Search name, business..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="yd-table-wrap">
            {loading ? (
              <div className="yd-empty">
                <div className="yd-spinner" />
                <div style={{ color: '#555', fontSize: 14 }}>Loading pipeline...</div>
              </div>
            ) : error ? (
              <div className="yd-empty">
                <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
                <div style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>Could not load data</div>
                <div style={{ color: '#555', fontSize: 13 }}>{error}</div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="yd-empty">
                <div style={{ fontSize: 36, marginBottom: 12, color: '#2A2A2A' }}>◇</div>
                <div style={{ color: '#888', fontSize: 15, marginBottom: 6 }}>No intakes found</div>
                <div style={{ color: '#555', fontSize: 13 }}>Share yakini.digital/intake to get your first submission.</div>
              </div>
            ) : (
              <table className="yd-table">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Contact</th>
                    <th>Status</th>
                    <th className="yd-hide-sm">Budget</th>
                    <th className="yd-hide-sm">Services</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r.id} onClick={() => setSelected(r)} className="yd-row">
                      <td>
                        <div className="yd-client-name">{`${r.first_name || ''} ${r.last_name || ''}`.trim() || '—'}</div>
                        <div className="yd-client-biz">{r.biz_name || '—'}</div>
                      </td>
                      <td>
                        <div className="yd-contact">{r.phone || '—'}</div>
                        <div className="yd-contact">{r.email || ''}</div>
                      </td>
                      <td>
                        <span className="yd-badge" style={{ color: STATUS_COLORS[r.status] || '#888', background: STATUS_BG[r.status] || 'rgba(255,255,255,0.05)' }}>
                          <span className="yd-dot" style={{ background: STATUS_COLORS[r.status] || '#888' }} />
                          {r.status || 'new'}
                        </span>
                      </td>
                      <td className="yd-hide-sm">
                        <span className="yd-pill">{r.budget || '—'}</span>
                      </td>
                      <td className="yd-hide-sm">
                        <div className="yd-chips">
                          {(r.services || []).slice(0, 2).map(s => (
                            <span key={s} className="yd-chip">{s}</span>
                          ))}
                          {(r.services || []).length > 2 && (
                            <span className="yd-chip">+{(r.services || []).length - 2}</span>
                          )}
                        </div>
                      </td>
                      <td className="yd-date">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </main>

        {/* Drawer overlay */}
        {selected && (
          <div className="yd-overlay" onClick={() => setSelected(null)}>
            <div className="yd-drawer" onClick={e => e.stopPropagation()}>
              <button className="yd-drawer-close" onClick={() => setSelected(null)}>✕</button>

              <div className="yd-drawer-name">{`${selected.first_name || ''} ${selected.last_name || ''}`.trim()}</div>
              <div className="yd-drawer-biz">{selected.biz_name || '—'}</div>

              {/* Status selector */}
              <div className="yd-drawer-section">
                <div className="yd-drawer-label">Status</div>
                <select
                  className="yd-status-select"
                  value={selected.status || 'new'}
                  disabled={updatingStatus}
                  onChange={e => updateStatus(selected.id, e.target.value)}
                >
                  {['new', 'contacted', 'active', 'closed', 'lost'].map(s => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>

              <div className="yd-drawer-divider" />

              <div className="yd-drawer-section">
                <div className="yd-drawer-label">Contact</div>
                {[
                  ['Phone', selected.phone],
                  ['Email', selected.email],
                  ['Location', selected.location],
                  ['Prefers', selected.contact_pref],
                  ['Referred by', selected.referral],
                ].map(([l, v]) => v ? (
                  <div key={l} className="yd-drawer-row">
                    <span className="yd-drawer-dl">{l}</span>
                    <span className="yd-drawer-dv">{v}</span>
                  </div>
                ) : null)}
              </div>

              <div className="yd-drawer-divider" />

              <div className="yd-drawer-section">
                <div className="yd-drawer-label">Business</div>
                {[
                  ['Industry', selected.industry],
                  ['In Business', selected.years_in_biz],
                  ['Has Website', selected.has_website],
                  ['Has Branding', selected.has_branding],
                ].map(([l, v]) => v ? (
                  <div key={l} className="yd-drawer-row">
                    <span className="yd-drawer-dl">{l}</span>
                    <span className="yd-drawer-dv">{v}</span>
                  </div>
                ) : null)}
                {selected.existing_url && (
                  <div className="yd-drawer-row">
                    <span className="yd-drawer-dl">Current URL</span>
                    <a href={selected.existing_url} target="_blank" rel="noreferrer" className="yd-drawer-link">{selected.existing_url}</a>
                  </div>
                )}
              </div>

              {selected.biz_desc && (
                <div className="yd-drawer-section">
                  <div className="yd-drawer-label">Description</div>
                  <div className="yd-drawer-text">{selected.biz_desc}</div>
                </div>
              )}

              <div className="yd-drawer-divider" />

              <div className="yd-drawer-section">
                <div className="yd-drawer-label">Project</div>
                {[
                  ['Goal', selected.primary_goal],
                  ['Budget', selected.budget],
                  ['Timeline', selected.timeline],
                  ['Digital Score', selected.digital_score ? `${selected.digital_score}/10` : null],
                  ['Branding', selected.brand_feeling],
                ].map(([l, v]) => v ? (
                  <div key={String(l)} className="yd-drawer-row">
                    <span className="yd-drawer-dl">{l}</span>
                    <span className="yd-drawer-dv">{v}</span>
                  </div>
                ) : null)}
              </div>

              {(selected.services || []).length > 0 && (
                <div className="yd-drawer-section">
                  <div className="yd-drawer-label">Services Requested</div>
                  <div className="yd-drawer-chips">
                    {selected.services.map(s => <span key={s} className="yd-chip" style={{ fontSize: 12, padding: '4px 10px' }}>{s}</span>)}
                  </div>
                </div>
              )}

              {selected.success_vision && (
                <div className="yd-drawer-section">
                  <div className="yd-drawer-label">Success Vision</div>
                  <div className="yd-drawer-text">{selected.success_vision}</div>
                </div>
              )}

              {selected.anything_else && (
                <div className="yd-drawer-section">
                  <div className="yd-drawer-label">Additional Notes</div>
                  <div className="yd-drawer-text">{selected.anything_else}</div>
                </div>
              )}

              <div className="yd-drawer-divider" />
              <div className="yd-drawer-meta">
                Submitted {selected.created_at ? new Date(selected.created_at).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
              </div>

              <button className="yd-action-btn" onClick={() => selected.phone && (window.location.href = `tel:${selected.phone}`)}>
                📞 Call {selected.phone || 'Client'}
              </button>
              <button className="yd-action-btn yd-action-secondary" onClick={() => selected.email && (window.location.href = `mailto:${selected.email}?subject=Following up — Yakini Digital`)}>
                ✉ Email Client
              </button>
            </div>
          </div>
        )}

        {/* Toast */}
        <div className={`yd-toast ${toastVisible ? 'yd-toast-show' : ''}`}>{toast}</div>
      </div>
    </>
  )
}

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .yd-layout {
    display: flex;
    min-height: 100vh;
    background: #0A0A0A;
    color: #F8F5EF;
    font-family: 'DM Sans', sans-serif;
    position: relative;
  }

  .yd-layout::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 0% 0%, rgba(200,168,75,0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(200,168,75,0.03) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  /* Sidebar */
  .yd-sidebar {
    width: 220px;
    flex-shrink: 0;
    background: #111;
    border-right: 1px solid #1E1E1E;
    padding: 28px 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 10;
  }

  .yd-sidebar-logo {
    padding: 0 24px 28px;
    border-bottom: 1px solid #1E1E1E;
    margin-bottom: 20px;
  }

  .yd-logo-name {
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    color: #F8F5EF;
  }

  .yd-logo-sub {
    font-size: 9px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #C8A84B;
    margin-top: 4px;
  }

  .yd-nav { flex: 1; }

  .yd-nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 24px;
    font-size: 13px;
    color: #555;
    cursor: pointer;
    transition: all 0.2s;
    border-left: 2px solid transparent;
    letter-spacing: 0.03em;
  }

  .yd-nav-item:hover { color: #F8F5EF; background: rgba(255,255,255,0.02); }
  .yd-nav-active { color: #C8A84B !important; border-left-color: #C8A84B !important; background: rgba(200,168,75,0.08) !important; }
  .yd-nav-icon { font-size: 14px; width: 18px; text-align: center; }

  .yd-sidebar-footer {
    padding: 20px 24px;
    border-top: 1px solid #1E1E1E;
    font-size: 11px;
    color: #333;
    letter-spacing: 0.05em;
  }

  /* Main */
  .yd-main {
    margin-left: 220px;
    flex: 1;
    padding: 36px 40px;
    min-width: 0;
    position: relative;
    z-index: 1;
  }

  /* Topbar */
  .yd-topbar {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 36px;
  }

  .yd-page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 34px;
    font-weight: 600;
    color: #F8F5EF;
    line-height: 1;
  }

  .yd-gold { color: #C8A84B; }

  .yd-topbar-right { display: flex; align-items: center; gap: 14px; }

  .yd-updated { font-size: 12px; color: #333; }

  .yd-btn-refresh {
    background: transparent;
    border: 1px solid #2A2A2A;
    color: #555;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 9px 18px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .yd-btn-refresh:hover { border-color: #C8A84B; color: #C8A84B; }

  /* Stats */
  .yd-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .yd-stat-card {
    background: #161616;
    border: 1px solid #1E1E1E;
    border-top: 2px solid var(--accent, #C8A84B);
    border-radius: 4px;
    padding: 20px;
  }

  .yd-stat-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #555;
    margin-bottom: 10px;
  }

  
  .yd-stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 42px;
    font-weight: 600;
    line-height: 1;
  }

  /* Filters */
  .yd-filters {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    flex-wrap: wrap;
    align-items: center;
  }

  .yd-filter-btn {
    background: #161616;
    border: 1px solid #2A2A2A;
    color: #555;
    font-family: 'DM Sans', sans-serif;
    font-size: 11px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 7px 16px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .yd-filter-btn:hover { border-color: #555; color: #F8F5EF; }
  .yd-filter-active { border-color: #C8A84B !important; color: #C8A84B !important; background: rgba(200,168,75,0.1) !important; }

  .yd-search {
    margin-left: auto;
    background: #161616;
    border: 1px solid #2A2A2A;
    color: #F8F5EF;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 2px;
    outline: none;
    width: 220px;
    transition: border-color 0.2s;
  }

  .yd-search:focus { border-color: #C8A84B; }
  .yd-search::placeholder { color: #333; }

  /* Table */
  .yd-table-wrap {
    background: #161616;
    border: 1px solid #1E1E1E;
    border-radius: 4px;
    overflow: hidden;
  }

  .yd-empty {
    text-align: center;
    padding: 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .yd-spinner {
    width: 28px; height: 28px;
    border: 2px solid #2A2A2A;
    border-top-color: #C8A84B;
    border-radius: 50%;
    animation: yd-spin 0.8s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes yd-spin { to { transform: rotate(360deg); } }

  .yd-table { width: 100%; border-collapse: collapse; }

  .yd-table thead tr { background: #111; border-bottom: 1px solid #1E1E1E; }

  .yd-table th {
    text-align: left;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #444;
    font-weight: 500;
    padding: 14px 16px;
    white-space: nowrap;
  }

  .yd-row {
    border-bottom: 1px solid #1E1E1E;
    cursor: pointer;
    transition: background 0.15s;
  }

  .yd-row:last-child { border-bottom: none; }
  .yd-row:hover { background: rgba(255,255,255,0.02); }

  .yd-table td { padding: 14px 16px; vertical-align: middle; }

  .yd-client-name { font-size: 14px; font-weight: 500; color: #F8F5EF; }
  .yd-client-biz { font-size: 12px; color: #C8A84B; margin-top: 3px; }
  .yd-contact { font-size: 12px; color: #555; line-height: 1.6; }

  .yd-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    font-weight: 500;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 10px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .yd-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }

  .yd-pill {
    font-size: 11px;
    color: #555;
    background: rgba(255,255,255,0.04);
    border: 1px solid #2A2A2A;
    padding: 3px 8px;
    border-radius: 2px;
  }

  .yd-chips { display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px; }

  .yd-chip {
    font-size: 10px;
    color: #555;
    background: rgba(255,255,255,0.04);
    border: 1px solid #2A2A2A;
    padding: 2px 7px;
    border-radius: 2px;
    white-space: nowrap;
  }

  .yd-date { font-size: 12px; color: #333; white-space: nowrap; }

  .yd-hide-sm { }

  /* Drawer */
  .yd-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    z-index: 100;
    animation: yd-fadein 0.2s ease;
  }

  @keyframes yd-fadein { from { opacity: 0; } to { opacity: 1; } }
  @keyframes yd-slidein { from { transform: translateX(100%); } to { transform: translateX(0); } }

  .yd-drawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 480px;
    background: #111;
    border-left: 1px solid #1E1E1E;
    z-index: 101;
    overflow-y: auto;
    padding: 36px 32px;
    animation: yd-slidein 0.3s cubic-bezier(0.4,0,0.2,1);
  }

  .yd-drawer-close {
    position: absolute;
    top: 20px; right: 20px;
    background: none; border: none;
    color: #444; font-size: 18px;
    cursor: pointer; padding: 4px 8px;
    transition: color 0.2s;
  }

  .yd-drawer-close:hover { color: #F8F5EF; }

  .yd-drawer-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 30px;
    font-weight: 600;
    color: #F8F5EF;
    margin-bottom: 4px;
    padding-right: 40px;
  }

  .yd-drawer-biz { font-size: 14px; color: #C8A84B; margin-bottom: 24px; }

  .yd-drawer-section { margin-bottom: 20px; }

  .yd-drawer-label {
    font-size: 10px;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: #C8A84B;
    margin-bottom: 12px;
    font-weight: 500;
  }

  .yd-drawer-row {
    display: flex;
    gap: 12px;
    margin-bottom: 9px;
    font-size: 13px;
  }

  .yd-drawer-dl { color: #444; min-width: 110px; flex-shrink: 0; }
  .yd-drawer-dv { color: #F8F5EF; }
  .yd-drawer-link { color: #C8A84B; font-size: 13px; text-decoration: none; }
  .yd-drawer-link:hover { text-decoration: underline; }

  .yd-drawer-text {
    font-size: 13px;
    color: #666;
    line-height: 1.7;
    background: #161616;
    border: 1px solid #1E1E1E;
    border-radius: 3px;
    padding: 14px;
  }

  .yd-drawer-chips { display: flex; flex-wrap: wrap; gap: 6px; }

  .yd-status-select {
    width: 100%;
    background: #161616;
    border: 1px solid #2A2A2A;
    color: #F8F5EF;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 10px 14px;
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: border-color 0.2s;
    appearance: none;
  }

  .yd-status-select:focus { border-color: #C8A84B; }
  .yd-status-select option { background: #111; }

  .yd-drawer-divider { height: 1px; background: #1E1E1E; margin: 20px 0; }

  .yd-drawer-meta { font-size: 11px; color: #333; margin-bottom: 20px; }

  .yd-action-btn {
    width: 100%;
    background: #C8A84B;
    border: none;
    color: #0A0A0A;
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 13px;
    border-radius: 2px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background 0.2s;
  }

  .yd-action-btn:hover { background: #E2C97A; }

  .yd-action-secondary {
    background: transparent !important;
    border: 1px solid #2A2A2A !important;
    color: #555 !important;
  }

  .yd-action-secondary:hover { border-color: #555 !important; color: #F8F5EF !important; background: transparent !important; }

  /* Toast */
  .yd-toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: #161616;
    border: 1px solid #C8A84B;
    color: #F8F5EF;
    font-size: 13px;
    padding: 14px 20px;
    border-radius: 3px;
    z-index: 200;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s;
    pointer-events: none;
    font-family: 'DM Sans', sans-serif;
  }

  .yd-toast-show { transform: translateY(0) !important; opacity: 1 !important; }

  /* Responsive */
  @media (max-width: 900px) {
    .yd-sidebar { display: none; }
    .yd-main { margin-left: 0; padding: 24px 16px; }
    .yd-stats { grid-template-columns: 1fr 1fr; }
    .yd-drawer { width: 100%; }
    .yd-hide-sm { display: none; }
    .yd-search { width: 160px; }
  }
`
