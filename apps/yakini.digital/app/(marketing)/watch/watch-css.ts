export const WATCH_CSS = `
  .wv-header { padding-bottom: 56px; }
  .wv-wrap { max-width: 1120px; margin: 0 auto; padding: 48px 20px 96px; }
  .wv-h2 { font-family: var(--font-display); font-weight: 400; font-size: clamp(26px, 4vw, 38px); line-height: 1.15; margin: 0 0 8px; color: var(--cream); }
  .wv-lead { color: rgba(244,241,235,0.72); font-size: 16px; line-height: 1.6; margin: 0 0 28px; max-width: 640px; }
  .wv-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 330px), 1fr)); gap: 24px; }
  .wv-section + .wv-section { margin-top: 72px; }
  .wv-card { background: rgba(255,255,255,0.03); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; scroll-margin-top: 110px; }
  .wv-card:target { border-color: var(--gold); box-shadow: 0 0 0 2px rgba(200,168,75,0.35); }
  .wv-frame { background: #000; }
  .wv-frame video { display: block; width: 100%; aspect-ratio: 16 / 9; background: #000; }
  .wv-body { padding: 16px 18px 20px; }
  .wv-card-big .wv-body { padding: 20px 22px 24px; }
  .wv-meta { margin: 0 0 6px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--gold); }
  .wv-title { margin: 0; font-family: var(--font-display); font-weight: 400; font-size: 24px; line-height: 1.2; color: var(--cream); }
  .wv-card-big .wv-title { font-size: clamp(26px, 3.4vw, 34px); }
  .wv-sub { margin: 8px 0 0; color: rgba(244,241,235,0.72); font-size: 15px; line-height: 1.55; }
  .wv-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 18px; margin-top: 16px; }
  .wv-share { min-height: 44px; padding: 0 18px; border-radius: 999px; border: 1px solid var(--gold); background: transparent; color: var(--gold); font: inherit; font-size: 14px; cursor: pointer; }
  .wv-share:hover { background: var(--gold); color: var(--navy-deep); }
  .wv-open { color: var(--cream); font-size: 14px; text-decoration: underline; text-underline-offset: 3px; }
  .wv-open:hover { color: var(--gold); }
  .wv-nav { display: flex; flex-wrap: wrap; gap: 12px; justify-content: space-between; margin-top: 28px; }
  .wv-nav a { display: inline-flex; align-items: center; min-height: 44px; padding: 0 18px; border: 1px solid var(--line-strong); border-radius: 999px; color: var(--cream); text-decoration: none; font-size: 14px; }
  .wv-nav a:hover { border-color: var(--gold); color: var(--gold); }
  .wv-back { margin-top: 40px; }
  @media (max-width: 640px) { .wv-wrap { padding: 32px 16px 72px; } .wv-title { font-size: 21px; } }
`
