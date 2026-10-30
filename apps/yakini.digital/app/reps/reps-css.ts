// Demo Library styles: the yakini.digital palette (dark ink, gold, cream).
export const REPS_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600&display=swap');
  .rp-root {
    --ink: #0A0908; --ink-2: #13110F; --gold: #C8A84B; --gold-soft: rgba(200,168,75,0.12);
    --cream: #F4F1EB; --muted: rgba(244,241,235,0.68); --line: rgba(255,255,255,0.08); --line-strong: rgba(255,255,255,0.16);
    --font-display: 'Cormorant Garamond', Georgia, serif; --font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    min-height: 100vh; background: var(--ink); color: var(--cream); font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
  }
  .rp-root *, .rp-root *::before, .rp-root *::after { box-sizing: border-box; }
  .rp-top { border-bottom: 1px solid var(--line); }
  .rp-top-inner { max-width: 1200px; margin: 0 auto; padding: 16px 24px; display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  .rp-brand { display: flex; align-items: center; gap: 12px; color: var(--cream); text-decoration: none; }
  .rp-brand img { height: 44px; width: auto; border-radius: 6px; border: 1px solid var(--line-strong); }
  .rp-brand-name { font-family: var(--font-display); font-size: 22px; letter-spacing: 0.04em; }
  .rp-brand-sub { display: block; font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); }
  .rp-who { display: flex; align-items: center; gap: 14px; font-size: 13px; color: var(--muted); min-width: 0; }
  .rp-who-email { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 260px; }
  .rp-btn-ghost { min-height: 40px; padding: 0 16px; border-radius: 999px; border: 1px solid var(--line-strong); background: transparent; color: var(--cream); font: inherit; font-size: 13px; cursor: pointer; }
  .rp-btn-ghost:hover { border-color: var(--gold); color: var(--gold); }

  .rp-wrap { max-width: 1200px; margin: 0 auto; padding: 48px 24px 96px; }
  .rp-eyebrow { display: inline-flex; align-items: center; gap: 10px; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: var(--gold); }
  .rp-eyebrow::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--gold); }
  .rp-h1 { font-family: var(--font-display); font-weight: 400; font-size: clamp(36px, 5vw, 56px); line-height: 1.05; margin: 14px 0 12px; }
  .rp-h1 em { color: var(--gold); font-style: italic; }
  .rp-lead { color: var(--muted); font-size: 16px; line-height: 1.6; max-width: 680px; margin: 0 0 36px; }

  .rp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 24px; }
  .rp-card { display: flex; flex-direction: column; background: var(--ink-2); border: 1px solid var(--line); border-radius: 16px; overflow: hidden; }
  .rp-card:hover { border-color: rgba(200,168,75,0.35); }
  .rp-thumb { position: relative; display: block; text-decoration: none; aspect-ratio: 1200 / 630; background: #000; overflow: hidden; }
  .rp-thumb img { display: block; width: 100%; height: 100%; object-fit: cover; }
  .rp-thumb-empty { display: flex; align-items: center; justify-content: center; height: 100%; font-family: var(--font-display); font-size: 64px; color: var(--gold); background: radial-gradient(circle at 30% 20%, rgba(200,168,75,0.18), transparent 60%), #0d0c0a; }
  .rp-badge { position: absolute; top: 12px; left: 12px; padding: 5px 10px; border-radius: 999px; background: var(--gold); color: var(--ink); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; }
  .rp-body { display: flex; flex-direction: column; flex: 1; padding: 18px 20px 20px; }
  .rp-aud { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); }
  .rp-name { margin: 0; font-family: var(--font-display); font-weight: 500; font-size: 26px; line-height: 1.15; }
  .rp-pitch { margin: 8px 0 18px; color: var(--muted); font-size: 15px; line-height: 1.55; flex: 1; }
  .rp-actions { display: grid; grid-auto-flow: column; grid-auto-columns: 1fr; gap: 8px; }
  .rp-soon { margin: 0; padding: 12px 14px; border: 1px dashed var(--line-strong); border-radius: 10px; color: var(--muted); font-size: 14px; }
  .rp-thumb-empty { flex-direction: column; gap: 10px; }
  .rp-thumb-y { font-family: var(--font-display); font-size: 64px; line-height: 1; color: var(--gold); }
  .rp-thumb-name { font-family: var(--font-display); font-size: 24px; color: var(--cream); letter-spacing: 0.02em; padding: 0 16px; text-align: center; }
  .rp-badge-soft { background: rgba(10,9,8,0.82); color: var(--gold); border: 1px solid rgba(200,168,75,0.55); }
  .rp-act { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; padding: 0 10px; border-radius: 10px; border: 1px solid var(--line-strong); background: transparent; color: var(--cream); font: inherit; font-size: 14px; font-weight: 500; text-decoration: none; cursor: pointer; white-space: nowrap; }
  .rp-act:hover { border-color: var(--gold); color: var(--gold); }
  .rp-act-primary { background: var(--gold); border-color: var(--gold); color: var(--ink); }
  .rp-act-primary:hover { background: var(--cream); border-color: var(--cream); color: var(--ink); }
  .rp-act[aria-disabled='true'], .rp-act:disabled { opacity: 0.4; pointer-events: none; }
  .rp-act[aria-expanded='true'] { border-color: var(--gold); color: var(--gold); background: var(--gold-soft); }

  .rp-share { margin-top: 14px; padding: 14px; border: 1px solid rgba(200,168,75,0.3); border-radius: 12px; background: rgba(200,168,75,0.05); }
  .rp-share-label { margin: 0 0 6px; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); }
  .rp-share-link { display: flex; gap: 8px; margin-bottom: 12px; }
  .rp-share-link input { flex: 1; min-width: 0; min-height: 40px; padding: 0 12px; border-radius: 8px; border: 1px solid var(--line-strong); background: #0d0c0a; color: var(--cream); font: inherit; font-size: 13px; }
  .rp-share-msg { margin: 0 0 12px; padding: 10px 12px; border-radius: 8px; background: #0d0c0a; border: 1px solid var(--line); color: var(--cream); font-size: 13px; line-height: 1.5; white-space: pre-wrap; word-break: break-word; }
  .rp-share-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .rp-copied { color: var(--gold); font-size: 13px; margin: 8px 0 0; min-height: 18px; }

  .rp-foot { margin-top: 56px; padding-top: 20px; border-top: 1px solid var(--line); color: rgba(244,241,235,0.5); font-size: 13px; line-height: 1.6; }

  .rp-login { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
  .rp-login-box { width: 100%; max-width: 440px; }
  .rp-login-box img { display: block; height: 64px; width: auto; border-radius: 8px; border: 1px solid var(--line-strong); margin-bottom: 24px; }
  .rp-login-h1 { font-family: var(--font-display); font-weight: 400; font-size: 38px; margin: 12px 0 8px; }
  .rp-login p { color: var(--muted); font-size: 15px; line-height: 1.6; margin: 0 0 22px; }
  .rp-input { width: 100%; min-height: 48px; padding: 0 14px; border-radius: 10px; border: 1px solid var(--line-strong); background: #13110F; color: var(--cream); font: inherit; font-size: 16px; outline: none; }
  .rp-input:focus { border-color: var(--gold); }
  .rp-submit { width: 100%; min-height: 48px; margin-top: 12px; border: 0; border-radius: 10px; background: var(--gold); color: var(--ink); font: inherit; font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; cursor: pointer; }
  .rp-submit:disabled { opacity: 0.5; cursor: default; }
  .rp-note { border: 1px solid rgba(200,168,75,0.3); border-radius: 12px; padding: 18px; color: var(--cream); font-size: 15px; line-height: 1.6; }
  .rp-err { color: #E59A8A; font-size: 14px; margin: 10px 0 0; }

  @media (max-width: 640px) {
    .rp-top-inner { padding: 12px 16px; }
    .rp-brand img { height: 36px; }
    .rp-brand-name { font-size: 19px; }
    .rp-who-email { display: none; }
    .rp-wrap { padding: 32px 16px 72px; }
    .rp-name { font-size: 23px; }
    .rp-act { font-size: 13px; padding: 0 6px; }
  }
`
