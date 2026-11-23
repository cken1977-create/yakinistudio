export const DEMO_CSS = `
  .db { color: var(--yk-ink, #F4F7FF); }
  .db-hero { padding: 28px 0 8px; }
  .db-steps {
    display: flex; gap: 8px; flex-wrap: wrap; margin: 0 0 22px; padding: 0; list-style: none;
  }
  .db-steps li {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; letter-spacing: .08em; text-transform: uppercase;
    color: var(--muted); min-height: 32px;
  }
  .db-steps li.on { color: var(--yk-ink); }
  .db-steps li .n {
    width: 22px; height: 22px; border-radius: 99px; display: inline-flex;
    align-items: center; justify-content: center;
    border: 1px solid var(--line-strong); font-size: 11px; font-weight: 700;
  }
  .db-steps li.on .n { background: var(--gold); color: var(--navy-deep); border-color: var(--gold); }
  .db-card {
    background: color-mix(in srgb, var(--navy-deep) 78%, transparent);
    border: 1px solid var(--line); padding: 20px; margin-bottom: 16px;
  }
  .db-card h3 { margin: 0 0 8px; font-size: 20px; font-family: var(--font-display); font-weight: 500; }
  .db-hint { margin: 0 0 16px; color: var(--muted); font-size: 15px; line-height: 1.5; }
  .db-warn { margin: 0 0 16px; color: var(--yk-ink); font-size: 14px; line-height: 1.45; }
  .db-error { color: #ffb4a8; margin: 0; }
  .db-fields { display: grid; gap: 14px; }
  .db-fields label, .db-form label {
    display: flex; flex-direction: column; gap: 6px; font-size: 14px;
  }
  .db input, .db select, .db textarea {
    appearance: none; background: transparent; color: inherit;
    border: 1px solid var(--line-strong); padding: 12px 14px;
    min-height: 48px; width: 100%; font-size: 16px; border-radius: 0;
  }
  .db textarea { min-height: 96px; }
  .db-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 18px; }
  .db-btn, .db-btn-ghost {
    display: inline-flex; align-items: center; justify-content: center; gap: 8px;
    min-height: 48px; padding: 12px 18px; font-weight: 700; cursor: pointer;
    border: 0; text-decoration: none; font-size: 16px; flex: 1 1 160px;
  }
  .db-btn { background: var(--gold); color: var(--navy-deep); }
  .db-btn:disabled { opacity: .6; cursor: wait; }
  .db-btn-ghost { background: transparent; color: inherit; border: 1px solid var(--line-strong); }
  .db-brand {
    display: flex; gap: 14px; align-items: center; flex-wrap: wrap;
    margin: 0 0 16px; padding-bottom: 16px; border-bottom: 1px solid var(--line);
  }
  .db-logo, .db-mono {
    width: 56px; height: 56px; object-fit: contain; background: #fff;
    border-radius: 12px; flex: none;
  }
  .db-mono {
    display: flex; align-items: center; justify-content: center;
    font-weight: 800; font-size: 22px; color: #0B1437;
  }
  .db-swatches { display: flex; gap: 6px; }
  .db-swatches i { width: 22px; height: 22px; border-radius: 99px; border: 1px solid var(--line-strong); display: block; }
  .db-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .db-chip {
    display: flex; flex-direction: column; align-items: flex-start; gap: 2px;
    text-align: left; background: transparent; color: inherit;
    border: 1px solid var(--line-strong); padding: 10px 12px; min-height: 48px;
    cursor: pointer; font-size: 14px; flex: 1 1 140px;
  }
  .db-chip.on { border-color: var(--gold); box-shadow: inset 0 0 0 1px var(--gold); }
  .db-chip.warn { opacity: .9; }
  .db-chip small { color: var(--muted); font-size: 12px; }
  .db-check { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; margin: 10px 0 0; }
  .db-check input { width: 20px; height: 20px; min-height: 20px; margin-top: 2px; flex: none; }
  .db-items { display: grid; gap: 8px; }
  .db-item {
    display: flex; gap: 10px; align-items: flex-start;
    border: 1px solid var(--line); padding: 12px; cursor: pointer;
  }
  .db-item.on { border-color: var(--gold); }
  .db-item input { width: 20px; height: 20px; min-height: 20px; margin-top: 2px; flex: none; }
  .db-item strong { display: block; }
  .db-item em { display: block; font-style: normal; color: var(--gold); font-size: 13px; }
  .db-item small { display: block; color: var(--muted); font-size: 13px; line-height: 1.4; }
  .db-group { margin-top: 16px; }
  .db-group h4 { margin: 0 0 8px; font-size: 13px; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .db-stage { display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(260px, .85fr); gap: 16px; align-items: start; }
  .db-estimate { position: sticky; top: 88px; }
  .db-estimate h3 { margin: 0 0 12px; }
  .db-totals { display: grid; gap: 10px; margin-bottom: 12px; }
  .db-totals div { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
  .db-totals strong { font-size: 24px; font-family: var(--font-display); }
  .db-lines { list-style: none; padding: 0; margin: 12px 0 0; display: grid; gap: 8px; }
  .db-lines li { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 13px; border-bottom: 1px solid var(--line); padding-bottom: 8px; }
  .db-form { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; }
  .db-form .wide, .db-form .db-error, .db-form .db-btn { grid-column: 1 / -1; }
  .db-thanks h3 { margin-top: 0; font-family: var(--font-display); font-size: 28px; }

  .kd {
    border: 1px solid var(--kd-line, var(--line));
    background: var(--kd-bg, #0B1437);
    color: var(--kd-ink, #F7F4EC);
    overflow: hidden;
    min-height: 520px;
    display: flex; flex-direction: column;
  }
  .kd-banner {
    background: #C9A14A; color: #15130F;
    font-size: 12px; letter-spacing: .08em; text-transform: uppercase;
    font-weight: 700; text-align: center; padding: 8px 12px;
  }
  .kd-top {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 14px; border-bottom: 1px solid var(--kd-line, var(--line));
  }
  .kd-logo, .kd-mono {
    width: 40px; height: 40px; object-fit: contain; background: #fff;
    border-radius: 10px; flex: none;
  }
  .kd-mono { display: flex; align-items: center; justify-content: center; font-weight: 800; }
  .kd-name { font-weight: 700; line-height: 1.2; }
  .kd-kit { display: block; font-size: 12px; opacity: .75; font-weight: 500; }
  .kd-body { display: grid; grid-template-columns: 148px minmax(0, 1fr); min-height: 0; flex: 1; }
  .kd-nav { display: flex; flex-direction: column; gap: 4px; padding: 12px 8px; border-right: 1px solid var(--kd-line, var(--line)); }
  .kd-nav button {
    background: transparent; color: inherit; border: 0; text-align: left;
    padding: 10px 10px; min-height: 44px; cursor: pointer; font-size: 14px;
  }
  .kd-nav button.on { background: var(--kd-accent-soft, rgba(201,161,74,.18)); font-weight: 700; }
  .kd-main { padding: 14px; display: grid; gap: 14px; align-content: start; }
  .kd-stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
  .kd-stat {
    border: 1px solid var(--kd-line, var(--line));
    padding: 12px;
    background: var(--kd-card, rgba(255,255,255,.04));
  }
  .kd-stat span { display: block; font-size: 11px; letter-spacing: .08em; text-transform: uppercase; opacity: .7; }
  .kd-stat strong { display: block; font-size: 22px; margin-top: 4px; font-family: var(--font-display), Georgia, serif; }
  .kd-stat em { display: block; font-style: normal; font-size: 11px; margin-top: 4px; opacity: .7; }
  .kd-table, .kd-addon {
    border: 1px solid var(--kd-line, var(--line));
    background: var(--kd-card, rgba(255,255,255,.04));
    padding: 12px;
  }
  .kd-table h4, .kd-addon h4 { margin: 0 0 10px; font-size: 14px; }
  .kd-row {
    display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 8px;
    padding: 10px 0; border-top: 1px solid var(--kd-line, var(--line));
    font-size: 14px;
  }
  .kd-row:first-of-type { border-top: 0; }
  .kd-meta { display: block; font-size: 12px; opacity: .7; }
  .kd-status {
    align-self: center; font-size: 11px; letter-spacing: .06em; text-transform: uppercase;
    padding: 4px 8px; border: 1px solid var(--kd-accent, #C9A14A); color: var(--kd-accent, #C9A14A);
    white-space: nowrap;
  }
  .kd-addons { display: grid; gap: 8px; }
  .kd-note { margin: 0; font-size: 13px; opacity: .8; line-height: 1.45; }


  .db-cta { display: flex; flex-direction: column; align-items: stretch; gap: 8px; margin-top: 4px; }
  .db-cta .db-btn { flex: 0 0 auto; width: 100%; }
  .db-btn-secondary {
    display: inline-flex; align-items: center; justify-content: center;
    align-self: flex-start;
    min-height: 40px; padding: 8px 14px;
    font-size: 14px; font-weight: 600; cursor: pointer;
    background: transparent; color: inherit;
    border: 1px solid var(--line-strong);
    text-decoration: none;
  }
  .db-quote-head { margin: 18px 0 8px; font-size: 16px; }
  .kd-row-btn {
    width: 100%; background: transparent; color: inherit; border: 0;
    text-align: left; cursor: pointer; min-height: 44px;
    font: inherit;
  }
  .kd-row-btn.on { background: var(--kd-accent-soft, rgba(201,161,74,.18)); }
  .kd-row-detail {
    margin: 0 0 8px; padding: 0 4px 8px;
    font-size: 13px; opacity: .85; line-height: 1.45;
  }
  .kd-flash { margin: 0; font-size: 13px; line-height: 1.45; }
  .kd-tour { margin: 0; font-size: 14px; line-height: 1.45; }
  .kd-tour a { color: inherit; font-weight: 700; text-decoration: underline; min-height: 44px; display: inline-flex; align-items: center; }
  .kd-tour span { opacity: .8; }

  @media (max-width: 980px) {
    .db-stage { grid-template-columns: 1fr; }
    .db-estimate { position: static; }
    .db-form { grid-template-columns: 1fr; }
    .kd-body { grid-template-columns: 1fr; }
    .kd-nav {
      flex-direction: row; overflow-x: auto; border-right: 0;
      border-bottom: 1px solid var(--kd-line, var(--line));
      padding: 8px; -webkit-overflow-scrolling: touch;
    }
    .kd-nav button { flex: none; white-space: nowrap; }
    .kd-stats { grid-template-columns: 1fr; }
    .db-sticky {
      position: sticky; bottom: 0; z-index: 6;
      background: color-mix(in srgb, var(--navy-deep) 92%, transparent);
      border-top: 1px solid var(--line);
      padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
      margin: 0 -20px -20px;
    }
    .db-sticky .db-cta .db-btn-secondary { min-height: 40px; font-size: 13px; }
  }
`
