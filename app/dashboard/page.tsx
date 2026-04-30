<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yakini — Client Pipeline</title>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
  :root {
    --black: #0A0A0A;
    --dark: #111111;
    --card: #161616;
    --card2: #1C1C1C;
    --border: #2A2A2A;
    --gold: #C8A84B;
    --gold-light: #E2C97A;
    --gold-dim: rgba(200,168,75,0.12);
    --white: #F8F5EF;
    --soft: #888;
    --mid: #555;
    --green: #4CAF7D;
    --green-dim: rgba(76,175,125,0.12);
    --blue: #4A90D9;
    --blue-dim: rgba(74,144,217,0.12);
    --orange: #E8924A;
    --orange-dim: rgba(232,146,74,0.12);
    --red: #E05555;
    --red-dim: rgba(224,85,85,0.12);
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--black);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    min-height: 100vh;
  }

  body::before {
    content: '';
    position: fixed;
    inset: 0;
    background:
      radial-gradient(ellipse at 0% 0%, rgba(200,168,75,0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 100% 100%, rgba(200,168,75,0.03) 0%, transparent 40%);
    pointer-events: none;
    z-index: 0;
  }

  /* Layout */
  .layout { display: flex; min-height: 100vh; position: relative; z-index: 1; }

  /* Sidebar */
  .sidebar {
    width: 220px;
    flex-shrink: 0;
    background: var(--dark);
    border-right: 1px solid var(--border);
    padding: 28px 0;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0; left: 0; bottom: 0;
  }

  .sidebar-logo {
    padding: 0 24px 28px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 20px;
  }

  .sidebar-logo .name {
    font-weight: 600;
    font-size: 16px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--white);
  }

  .sidebar-logo .sub {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-top: 3px;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 24px;
    font-size: 13px;
    color: var(--soft);
    cursor: pointer;
    transition: all 0.2s;
    border-left: 2px solid transparent;
    letter-spacing: 0.03em;
  }

  .nav-item:hover { color: var(--white); background: rgba(255,255,255,0.03); }
  .nav-item.active { color: var(--gold); border-left-color: var(--gold); background: var(--gold-dim); }
  .nav-item .icon { font-size: 15px; width: 18px; text-align: center; }

  .sidebar-footer {
    margin-top: auto;
    padding: 20px 24px;
    border-top: 1px solid var(--border);
    font-size: 11px;
    color: var(--mid);
  }

  /* Main */
  .main {
    margin-left: 220px;
    flex: 1;
    padding: 36px 40px;
    min-width: 0;
  }

  /* Top bar */
  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 36px;
  }

  .page-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--white);
  }

  .page-title span { color: var(--gold); }

  .topbar-actions { display: flex; gap: 12px; align-items: center; }

  .btn-refresh {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--soft);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    letter-spacing: 0.1em;
    text-transform: uppercase;
    padding: 9px 18px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-refresh:hover { border-color: var(--gold); color: var(--gold); }

  .last-updated {
    font-size: 12px;
    color: var(--mid);
  }

  /* Stats row */
  .stats-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
  }

  .stat-card {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 20px;
    position: relative;
    overflow: hidden;
    transition: border-color 0.2s;
  }

  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
  }

  .stat-card.gold::before { background: var(--gold); }
  .stat-card.green::before { background: var(--green); }
  .stat-card.blue::before { background: var(--blue); }
  .stat-card.orange::before { background: var(--orange); }

  .stat-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--soft);
    margin-bottom: 10px;
  }

  .stat-value {
    font-family: 'Cormorant Garamond', serif;
    font-size: 40px;
    font-weight: 600;
    color: var(--white);
    line-height: 1;
  }

  .stat-card.gold .stat-value { color: var(--gold); }
  .stat-card.green .stat-value { color: var(--green); }

  /* Filter bar */
  .filter-bar {
    display: flex;
    gap: 10px;
    margin-bottom: 24px;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-btn {
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--soft);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    letter-spacing: 0.08em;
    padding: 7px 16px;
    border-radius: 2px;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: uppercase;
  }

  .filter-btn:hover { border-color: var(--soft); color: var(--white); }
  .filter-btn.active { border-color: var(--gold); color: var(--gold); background: var(--gold-dim); }

  .search-input {
    margin-left: auto;
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 8px 14px;
    border-radius: 2px;
    outline: none;
    width: 220px;
    transition: border-color 0.2s;
  }

  .search-input:focus { border-color: var(--gold); }
  .search-input::placeholder { color: var(--mid); }

  /* Table */
  .table-wrap {
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }

  table { width: 100%; border-collapse: collapse; }

  thead tr {
    background: var(--dark);
    border-bottom: 1px solid var(--border);
  }

  th {
    text-align: left;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--soft);
    font-weight: 500;
    padding: 14px 16px;
    white-space: nowrap;
  }

  tbody tr {
    border-bottom: 1px solid var(--border);
    transition: background 0.15s;
    cursor: pointer;
  }

  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: rgba(255,255,255,0.02); }

  td {
    padding: 14px 16px;
    font-size: 13px;
    color: var(--white);
    vertical-align: middle;
  }

  .td-name { font-weight: 500; }
  .td-biz { color: var(--gold); font-size: 12px; margin-top: 2px; }
  .td-contact { color: var(--soft); font-size: 12px; }

  /* Status badge */
  .badge {
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

  .badge::before { content: ''; width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
  .badge.new { background: var(--gold-dim); color: var(--gold); }
  .badge.new::before { background: var(--gold); }
  .badge.contacted { background: var(--blue-dim); color: var(--blue); }
  .badge.contacted::before { background: var(--blue); }
  .badge.active { background: var(--green-dim); color: var(--green); }
  .badge.active::before { background: var(--green); }
  .badge.closed { background: var(--orange-dim); color: var(--orange); }
  .badge.closed::before { background: var(--orange); }
  .badge.lost { background: var(--red-dim); color: var(--red); }
  .badge.lost::before { background: var(--red); }

  /* Budget pill */
  .budget-pill {
    font-size: 11px;
    color: var(--soft);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    padding: 3px 8px;
    border-radius: 2px;
  }

  /* Services chips */
  .service-chips { display: flex; flex-wrap: wrap; gap: 4px; max-width: 200px; }
  .chip {
    font-size: 10px;
    color: var(--soft);
    background: rgba(255,255,255,0.04);
    border: 1px solid var(--border);
    padding: 2px 7px;
    border-radius: 2px;
    white-space: nowrap;
  }

  /* Empty / loading */
  .empty-state {
    text-align: center;
    padding: 80px 20px;
    color: var(--mid);
  }

  .empty-state .icon { font-size: 40px; margin-bottom: 16px; }
  .empty-state h3 { font-size: 16px; color: var(--soft); margin-bottom: 8px; }
  .empty-state p { font-size: 13px; }

  .loading { text-align: center; padding: 60px; color: var(--soft); }
  .loading .spinner {
    width: 28px; height: 28px;
    border: 2px solid var(--border);
    border-top-color: var(--gold);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
    margin: 0 auto 16px;
  }

  @keyframes spin { to { transform: rotate(360deg); } }

  /* Detail drawer */
  .drawer-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 100;
    opacity: 0; pointer-events: none;
    transition: opacity 0.3s;
  }

  .drawer-overlay.open { opacity: 1; pointer-events: all; }

  .drawer {
    position: fixed;
    top: 0; right: 0; bottom: 0;
    width: 480px;
    background: var(--dark);
    border-left: 1px solid var(--border);
    z-index: 101;
    transform: translateX(100%);
    transition: transform 0.3s cubic-bezier(0.4,0,0.2,1);
    overflow-y: auto;
    padding: 32px;
  }

  .drawer.open { transform: translateX(0); }

  .drawer-close {
    position: absolute;
    top: 20px; right: 20px;
    background: none; border: none;
    color: var(--soft); font-size: 20px;
    cursor: pointer; line-height: 1;
    padding: 4px 8px;
  }

  .drawer-close:hover { color: var(--white); }

  .drawer-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 28px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .drawer-biz {
    font-size: 14px;
    color: var(--gold);
    margin-bottom: 20px;
  }

  .drawer-section {
    margin-bottom: 24px;
  }

  .drawer-section-label {
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 12px;
    font-weight: 500;
  }

  .drawer-row {
    display: flex;
    gap: 12px;
    margin-bottom: 10px;
    font-size: 13px;
  }

  .drawer-row .dl { color: var(--soft); min-width: 120px; flex-shrink: 0; }
  .drawer-row .dv { color: var(--white); }

  .drawer-desc {
    font-size: 13px;
    color: var(--soft);
    line-height: 1.7;
    background: var(--card);
    border: 1px solid var(--border);
    border-radius: 3px;
    padding: 14px;
  }

  .status-select {
    background: var(--card);
    border: 1px solid var(--border);
    color: var(--white);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    padding: 9px 12px;
    border-radius: 3px;
    outline: none;
    width: 100%;
    cursor: pointer;
    transition: border-color 0.2s;
    appearance: none;
  }

  .status-select:focus { border-color: var(--gold); }

  .drawer-divider { height: 1px; background: var(--border); margin: 20px 0; }

  .btn-action {
    width: 100%;
    background: var(--gold);
    border: none;
    color: var(--black);
    font-family: 'DM Sans', sans-serif;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    padding: 13px;
    border-radius: 2px;
    cursor: pointer;
    margin-bottom: 10px;
    transition: background 0.2s;
  }

  .btn-action:hover { background: var(--gold-light); }

  .btn-action.secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--soft);
  }

  .btn-action.secondary:hover { border-color: var(--soft); color: var(--white); }

  /* Toast */
  .toast {
    position: fixed;
    bottom: 28px; right: 28px;
    background: var(--card);
    border: 1px solid var(--gold);
    color: var(--white);
    font-size: 13px;
    padding: 14px 20px;
    border-radius: 3px;
    z-index: 200;
    transform: translateY(20px);
    opacity: 0;
    transition: all 0.3s;
    pointer-events: none;
  }

  .toast.show { transform: translateY(0); opacity: 1; }

  /* Date */
  .date-col { color: var(--mid); font-size: 12px; white-space: nowrap; }

  /* Responsive */
  @media (max-width: 900px) {
    .sidebar { display: none; }
    .main { margin-left: 0; padding: 24px 16px; }
    .stats-row { grid-template-columns: 1fr 1fr; }
    .drawer { width: 100%; }
    th:nth-child(4), td:nth-child(4),
    th:nth-child(5), td:nth-child(5) { display: none; }
  }
</style>
</head>
<body>

<div class="layout">

  <!-- Sidebar -->
  <aside class="sidebar">
    <div class="sidebar-logo">
      <div class="name">Yakini</div>
      <div class="sub">Digital Infrastructure</div>
    </div>
    <div class="nav-item active"><span class="icon">⬡</span> Pipeline</div>
    <div class="nav-item"><span class="icon">◈</span> Clients</div>
    <div class="nav-item"><span class="icon">◇</span> Projects</div>
    <div class="nav-item"><span class="icon">○</span> Analytics</div>
    <div class="nav-item"><span class="icon">◻</span> Settings</div>
    <div class="sidebar-footer">yakini.digital</div>
  </aside>

  <!-- Main -->
  <main class="main">

    <!-- Topbar -->
    <div class="topbar">
      <div>
        <div class="page-title">Client <span>Pipeline</span></div>
      </div>
      <div class="topbar-actions">
        <span class="last-updated" id="last-updated">—</span>
        <button class="btn-refresh" onclick="loadIntakes()">↻ Refresh</button>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-row">
      <div class="stat-card gold">
        <div class="stat-label">Total Intakes</div>
        <div class="stat-value" id="stat-total">—</div>
      </div>
      <div class="stat-card gold">
        <div class="stat-label">New</div>
        <div class="stat-value" id="stat-new">—</div>
      </div>
      <div class="stat-card green">
        <div class="stat-label">Active Clients</div>
        <div class="stat-value" id="stat-active">—</div>
      </div>
      <div class="stat-card blue">
        <div class="stat-label">Contacted</div>
        <div class="stat-value" id="stat-contacted">—</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="filter-bar">
      <button class="filter-btn active" onclick="setFilter('all', this)">All</button>
      <button class="filter-btn" onclick="setFilter('new', this)">New</button>
      <button class="filter-btn" onclick="setFilter('contacted', this)">Contacted</button>
      <button class="filter-btn" onclick="setFilter('active', this)">Active</button>
      <button class="filter-btn" onclick="setFilter('closed', this)">Closed</button>
      <input class="search-input" type="text" placeholder="Search name, business..." oninput="searchIntakes(this.value)" />
    </div>

    <!-- Table -->
    <div class="table-wrap">
      <div id="table-container">
        <div class="loading">
          <div class="spinner"></div>
          Loading pipeline...
        </div>
      </div>
    </div>

  </main>
</div>

<!-- Detail Drawer -->
<div class="drawer-overlay" id="drawer-overlay" onclick="closeDrawer()"></div>
<div class="drawer" id="drawer">
  <button class="drawer-close" onclick="closeDrawer()">✕</button>
  <div id="drawer-content"></div>
</div>

<!-- Toast -->
<div class="toast" id="toast"></div>

<script>
  const SUPABASE_URL = 'https://mxshsmknfqxwltucgezl.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14c2hzbWtuZnF4d2x0dWNnZXpsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1MDM1NjIsImV4cCI6MjA5MzA3OTU2Mn0.cdx3T5CVFKq2sis-FOHau2V0Lx3CrsyoZmaAfM689v0';

  let allIntakes = [];
  let currentFilter = 'all';
  let currentSearch = '';
  let currentRecord = null;

  async function loadIntakes() {
    document.getElementById('table-container').innerHTML = `<div class="loading"><div class="spinner"></div>Loading pipeline...</div>`;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/client_intake?order=created_at.desc`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (!res.ok) throw new Error(await res.text());
      allIntakes = await res.json();
      updateStats();
      renderTable();
      document.getElementById('last-updated').textContent = 'Updated ' + new Date().toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'});
    } catch (e) {
      document.getElementById('table-container').innerHTML = `<div class="empty-state"><div class="icon">⚠</div><h3>Could not load data</h3><p>${e.message}</p></div>`;
    }
  }

  function updateStats() {
    document.getElementById('stat-total').textContent = allIntakes.length;
    document.getElementById('stat-new').textContent = allIntakes.filter(r => r.status === 'new').length;
    document.getElementById('stat-active').textContent = allIntakes.filter(r => r.status === 'active').length;
    document.getElementById('stat-contacted').textContent = allIntakes.filter(r => r.status === 'contacted').length;
  }

  function getFiltered() {
    return allIntakes.filter(r => {
      const matchFilter = currentFilter === 'all' || r.status === currentFilter;
      const q = currentSearch.toLowerCase();
      const matchSearch = !q ||
        (r.first_name||'').toLowerCase().includes(q) ||
        (r.last_name||'').toLowerCase().includes(q) ||
        (r.biz_name||'').toLowerCase().includes(q) ||
        (r.email||'').toLowerCase().includes(q) ||
        (r.industry||'').toLowerCase().includes(q);
      return matchFilter && matchSearch;
    });
  }

  function renderTable() {
    const rows = getFiltered();
    if (!rows.length) {
      document.getElementById('table-container').innerHTML = `<div class="empty-state"><div class="icon">◇</div><h3>No intakes found</h3><p>Adjust your filters or share the intake form to get your first submission.</p></div>`;
      return;
    }

    const tbody = rows.map(r => {
      const name = `${r.first_name || ''} ${r.last_name || ''}`.trim() || '—';
      const services = (r.services || []).slice(0, 3);
      const extra = (r.services || []).length > 3 ? `<span class="chip">+${(r.services||[]).length - 3}</span>` : '';
      const chips = services.map(s => `<span class="chip">${s}</span>`).join('') + extra;
      const date = r.created_at ? new Date(r.created_at).toLocaleDateString('en-US', {month:'short', day:'numeric'}) : '—';
      const status = r.status || 'new';
      return `
        <tr onclick="openDrawer('${r.id}')">
          <td>
            <div class="td-name">${name}</div>
            <div class="td-biz">${r.biz_name || '—'}</div>
          </td>
          <td><div class="td-contact">${r.phone || '—'}</div><div class="td-contact">${r.email || ''}</div></td>
          <td><span class="badge ${status}">${status}</span></td>
          <td><span class="budget-pill">${r.budget || '—'}</span></td>
          <td><div class="service-chips">${chips || '<span style="color:var(--mid);font-size:12px;">None</span>'}</div></td>
          <td class="date-col">${date}</td>
        </tr>`;
    }).join('');

    document.getElementById('table-container').innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Contact</th>
            <th>Status</th>
            <th>Budget</th>
            <th>Services</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>${tbody}</tbody>
      </table>`;
  }

  function setFilter(f, btn) {
    currentFilter = f;
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderTable();
  }

  function searchIntakes(q) {
    currentSearch = q;
    renderTable();
  }

  function openDrawer(id) {
    const r = allIntakes.find(x => x.id === id);
    if (!r) return;
    currentRecord = r;
    const name = `${r.first_name || ''} ${r.last_name || ''}`.trim();
    const services = (r.services || []).map(s => `<span class="chip" style="font-size:12px;padding:4px 10px;">${s}</span>`).join('');
    const date = r.created_at ? new Date(r.created_at).toLocaleString('en-US', {month:'long', day:'numeric', year:'numeric', hour:'2-digit', minute:'2-digit'}) : '—';

    document.getElementById('drawer-content').innerHTML = `
      <div class="drawer-name">${name}</div>
      <div class="drawer-biz">${r.biz_name || '—'}</div>

      <div class="drawer-section">
        <div class="drawer-section-label">Status</div>
        <select class="status-select" onchange="updateStatus(this.value)" id="status-select">
          <option value="new" ${r.status==='new'?'selected':''}>New</option>
          <option value="contacted" ${r.status==='contacted'?'selected':''}>Contacted</option>
          <option value="active" ${r.status==='active'?'selected':''}>Active Client</option>
          <option value="closed" ${r.status==='closed'?'selected':''}>Closed / Won</option>
          <option value="lost" ${r.status==='lost'?'selected':''}>Lost</option>
        </select>
      </div>

      <div class="drawer-divider"></div>

      <div class="drawer-section">
        <div class="drawer-section-label">Contact</div>
        <div class="drawer-row"><span class="dl">Phone</span><span class="dv">${r.phone || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Email</span><span class="dv">${r.email || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Location</span><span class="dv">${r.location || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Prefers</span><span class="dv">${r.contact_pref || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Referred by</span><span class="dv">${r.referral || '—'}</span></div>
      </div>

      <div class="drawer-divider"></div>

      <div class="drawer-section">
        <div class="drawer-section-label">Business</div>
        <div class="drawer-row"><span class="dl">Industry</span><span class="dv">${r.industry || '—'}</span></div>
        <div class="drawer-row"><span class="dl">In Business</span><span class="dv">${r.years_in_biz || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Has Website</span><span class="dv">${r.has_website || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Has Branding</span><span class="dv">${r.has_branding || '—'}</span></div>
        ${r.existing_url ? `<div class="drawer-row"><span class="dl">Current URL</span><span class="dv"><a href="${r.existing_url}" target="_blank" style="color:var(--gold);">${r.existing_url}</a></span></div>` : ''}
      </div>

      ${r.biz_desc ? `
      <div class="drawer-section">
        <div class="drawer-section-label">Description</div>
        <div class="drawer-desc">${r.biz_desc}</div>
      </div>` : ''}

      <div class="drawer-divider"></div>

      <div class="drawer-section">
        <div class="drawer-section-label">Project</div>
        <div class="drawer-row"><span class="dl">Goal</span><span class="dv">${r.primary_goal || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Budget</span><span class="dv">${r.budget || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Timeline</span><span class="dv">${r.timeline || '—'}</span></div>
        <div class="drawer-row"><span class="dl">Digital Score</span><span class="dv">${r.digital_score ? r.digital_score + '/10' : '—'}</span></div>
      </div>

      ${(r.services||[]).length ? `
      <div class="drawer-section">
        <div class="drawer-section-label">Services Requested</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${services}</div>
      </div>` : ''}

      ${r.success_vision ? `
      <div class="drawer-section">
        <div class="drawer-section-label">Success Vision</div>
        <div class="drawer-desc">${r.success_vision}</div>
      </div>` : ''}

      ${r.anything_else ? `
      <div class="drawer-section">
        <div class="drawer-section-label">Additional Notes</div>
        <div class="drawer-desc">${r.anything_else}</div>
      </div>` : ''}

      <div class="drawer-divider"></div>
      <div style="font-size:11px;color:var(--mid);margin-bottom:20px;">Submitted: ${date}</div>

      <button class="btn-action" onclick="callClient()">📞 Call ${r.phone || 'Client'}</button>
      <button class="btn-action secondary" onclick="emailClient()">✉ Email Client</button>
    `;

    document.getElementById('drawer-overlay').classList.add('open');
    document.getElementById('drawer').classList.add('open');
  }

  function closeDrawer() {
    document.getElementById('drawer-overlay').classList.remove('open');
    document.getElementById('drawer').classList.remove('open');
    currentRecord = null;
  }

  async function updateStatus(newStatus) {
    if (!currentRecord) return;
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/client_intake?id=eq.${currentRecord.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        currentRecord.status = newStatus;
        const idx = allIntakes.findIndex(r => r.id === currentRecord.id);
        if (idx > -1) allIntakes[idx].status = newStatus;
        updateStats();
        renderTable();
        showToast(`Status updated → ${newStatus}`);
      }
    } catch (e) {
      showToast('Failed to update status');
    }
  }

  function callClient() {
    if (currentRecord?.phone) window.location.href = `tel:${currentRecord.phone}`;
  }

  function emailClient() {
    if (currentRecord?.email) window.location.href = `mailto:${currentRecord.email}?subject=Following up — Yakini Digital`;
  }

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), 3000);
  }

  // Init
  loadIntakes();
</script>
</body>
</html>
