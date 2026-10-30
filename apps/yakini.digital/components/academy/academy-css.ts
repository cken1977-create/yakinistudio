export const ACADEMY_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;1,400&family=Inter:wght@400;500;600;700&display=swap');
  :root { --ya-bg:#0A0908; --ya-panel:#121110; --ya-gold:#C8A84B; --ya-cream:#F4F1EB; --ya-muted:rgba(244,241,235,0.68); --ya-line:rgba(255,255,255,0.1); --ya-line2:rgba(255,255,255,0.18); --ya-err:#F09A8F; --ya-display:'Cormorant Garamond', Georgia, serif; --ya-body:'Inter', -apple-system, Segoe UI, sans-serif; }
  .ya { background: var(--ya-bg); color: var(--ya-cream); font-family: var(--ya-body); line-height: 1.6; min-height: 100vh; -webkit-font-smoothing: antialiased; }
  .ya *, .ya *::before, .ya *::after { box-sizing: border-box; }
  .ya a { color: inherit; }
  .ya-top { display:flex; align-items:center; justify-content:space-between; gap:16px; max-width:1180px; margin:0 auto; padding:18px 20px; }
  .ya-brand { display:flex; align-items:center; gap:12px; text-decoration:none; }
  .ya-logo { position:relative; display:block; overflow:hidden; flex-shrink:0; --h:52px; height:var(--h); width:calc(var(--h) * 650 / 740); border:1px solid rgba(200,168,75,0.3); background:#222327; }
  .ya-logo img { position:absolute; max-width:none; height:calc(var(--h) * 1168 / 740); width:auto; left:calc(var(--h) * -70 / 740); top:calc(var(--h) * -245 / 740); }
  .ya-brand-name { font-size:11px; font-weight:600; letter-spacing:0.22em; color:var(--ya-gold); line-height:1.4; }
  .ya-lang { display:inline-flex; align-items:center; min-height:44px; padding:0 16px; border:1px solid var(--ya-line2); border-radius:999px; font-size:14px; text-decoration:none; }
  .ya-lang:hover { border-color: var(--ya-gold); color: var(--ya-gold); }
  .ya-main { max-width:1180px; margin:0 auto; padding:8px 20px 64px; }
  .ya-hero { display:grid; grid-template-columns: minmax(0,1fr) minmax(280px, 380px); gap:48px; align-items:start; padding:24px 0 56px; }
  .ya-eyebrow { display:inline-flex; align-items:center; gap:10px; padding:7px 14px; border:1px solid var(--ya-line2); font-size:11px; font-weight:600; letter-spacing:0.22em; color:var(--ya-gold); margin-bottom:24px; }
  .ya-dot { width:6px; height:6px; border-radius:50%; background:var(--ya-gold); }
  .ya-h1 { font-family:var(--ya-display); font-weight:400; font-size:clamp(44px, 7vw, 88px); line-height:0.95; letter-spacing:-0.02em; margin:0 0 20px; }
  .ya-h1 em { color:var(--ya-gold); font-style:italic; display:block; }
  .ya-sub { font-size:clamp(17px, 1.6vw, 20px); color:var(--ya-muted); max-width:36em; margin:0 0 20px; }
  .ya-sub strong { color:var(--ya-cream); font-weight:600; }
  .ya-facts { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 28px; padding:0; list-style:none; }
  .ya-facts li { padding:6px 12px; border:1px solid var(--ya-line2); border-radius:999px; font-size:13px; color:var(--ya-cream); }
  .ya-video { position:sticky; top:20px; margin:0; }
  .ya-video-frame { position:relative; width:100%; aspect-ratio:9/16; background:#000; border:1px solid var(--ya-line2); border-radius:18px; overflow:hidden; box-shadow:0 30px 80px rgba(0,0,0,0.5); }
  .ya-video-frame video { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; background:#000; }
  .ya-play { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg, rgba(0,0,0,0) 50%, rgba(0,0,0,0.55)); border:0; cursor:pointer; color:#fff; padding:0; }
  .ya-play-btn { display:flex; align-items:center; justify-content:center; width:76px; height:76px; border-radius:50%; background:rgba(200,168,75,0.95); box-shadow:0 10px 30px rgba(0,0,0,0.4); }
  .ya-play-btn svg { margin-left:5px; }
  .ya-play-label { position:absolute; left:0; right:0; bottom:16px; text-align:center; font-size:14px; font-weight:500; }
  .ya-video-cap { margin:10px 0 0; font-size:13px; color:var(--ya-muted); text-align:center; }
  .ya-card { background:var(--ya-panel); border:1px solid var(--ya-line); border-radius:16px; padding:24px; }
  .ya-form h2 { font-family:var(--ya-display); font-weight:400; font-size:32px; line-height:1.1; margin:0 0 4px; }
  .ya-form-sub { color:var(--ya-muted); font-size:15px; margin:0 0 18px; }
  .ya-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
  .ya-field { display:flex; flex-direction:column; gap:6px; margin-bottom:14px; }
  .ya-field label { font-size:14px; font-weight:500; }
  .ya-opt { color:var(--ya-muted); font-weight:400; }
  .ya-input { width:100%; min-height:48px; padding:12px 14px; font:inherit; font-size:16px; color:var(--ya-cream); background:#1A1917; border:1px solid var(--ya-line2); border-radius:10px; outline:none; }
  .ya-input:focus { border-color:var(--ya-gold); box-shadow:0 0 0 3px rgba(200,168,75,0.2); }
  .ya-input[aria-invalid="true"] { border-color:var(--ya-err); }
  select.ya-input { appearance:auto; }
  .ya-hint { font-size:12px; color:var(--ya-muted); }
  .ya-err { font-size:13px; color:var(--ya-err); }
  .ya-check { display:flex; gap:10px; align-items:flex-start; font-size:13px; line-height:1.5; color:var(--ya-muted); margin:2px 0 16px; cursor:pointer; }
  .ya-check input { width:20px; height:20px; margin-top:1px; flex-shrink:0; accent-color:var(--ya-gold); }
  .ya-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; width:100%; min-height:54px; padding:0 24px; border:0; border-radius:10px; background:var(--ya-gold); color:#0A0908; font:inherit; font-size:16px; font-weight:700; letter-spacing:0.02em; cursor:pointer; text-decoration:none; }
  .ya-btn:hover { background:var(--ya-cream); }
  .ya-btn[disabled] { opacity:0.6; cursor:wait; }
  .ya-btn-inline { width:auto; }
  .ya-consent { font-size:12px; line-height:1.55; color:var(--ya-muted); margin:12px 0 0; }
  .ya-consent a, .ya-check a { text-decoration:underline; text-underline-offset:2px; }
  .ya-alert { border:1px solid rgba(240,154,143,0.5); background:rgba(240,154,143,0.08); color:var(--ya-cream); border-radius:10px; padding:12px 14px; font-size:14px; margin:0 0 14px; }
  .ya-hp { position:absolute !important; left:-10000px !important; width:1px; height:1px; overflow:hidden; }
  .ya-thanks h2 { font-family:var(--ya-display); font-weight:400; font-size:34px; margin:0 0 8px; }
  .ya-thanks p { color:var(--ya-muted); margin:0 0 18px; }
  .ya-sections { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%, 320px), 1fr)); gap:20px; padding:8px 0 40px; border-top:1px solid var(--ya-line); padding-top:48px; }
  .ya-h2 { font-family:var(--ya-display); font-weight:400; font-size:clamp(28px, 3.4vw, 38px); line-height:1.1; margin:0 0 14px; }
  .ya-learn { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
  .ya-learn li { display:flex; gap:12px; font-size:16px; }
  .ya-learn li::before { content:''; flex-shrink:0; width:8px; height:8px; margin-top:9px; background:var(--ya-gold); transform:rotate(45deg); }
  .ya-p { color:var(--ya-muted); font-size:16px; margin:0; }
  .ya-faq { border-top:1px solid var(--ya-line); padding-top:40px; max-width:760px; }
  .ya-faq details { border-bottom:1px solid var(--ya-line); padding:6px 0; }
  .ya-faq summary { cursor:pointer; min-height:48px; display:flex; align-items:center; font-size:17px; font-weight:500; list-style:none; }
  .ya-faq summary::-webkit-details-marker { display:none; }
  .ya-faq summary::after { content:'+'; margin-left:auto; color:var(--ya-gold); font-size:22px; padding-left:16px; }
  .ya-faq details[open] summary::after { content:'–'; }
  .ya-faq p { color:var(--ya-muted); margin:0 0 14px; }
  .ya-foot { border-top:1px solid var(--ya-line); margin-top:56px; padding:28px 20px 40px; }
  .ya-foot-inner { max-width:1180px; margin:0 auto; display:flex; flex-wrap:wrap; gap:10px 24px; justify-content:space-between; font-size:13px; color:var(--ya-muted); }
  .ya-foot nav { display:flex; flex-wrap:wrap; gap:8px 20px; }
  .ya-foot a { text-decoration:underline; text-underline-offset:2px; }
  .ya-narrow { max-width:720px; margin:0 auto; padding:24px 0 40px; }
  .ya-watch-frame { width:100%; aspect-ratio:16/9; background:#000; border:1px solid var(--ya-line2); border-radius:14px; overflow:hidden; }
  .ya-watch-frame video { width:100%; height:100%; display:block; background:#000; }
  .ya-soon { text-align:left; }
  .ya-soon-badge { display:inline-block; padding:6px 12px; border-radius:999px; background:rgba(200,168,75,0.14); color:var(--ya-gold); font-size:12px; font-weight:600; letter-spacing:0.12em; margin-bottom:14px; }
  .ya-legal h1 { font-family:var(--ya-display); font-weight:400; font-size:clamp(36px,5vw,56px); line-height:1.05; margin:0 0 8px; }
  .ya-legal h2 { font-size:18px; font-weight:600; margin:28px 0 8px; }
  .ya-legal p, .ya-legal li { color:var(--ya-muted); font-size:16px; }
  .ya-legal ul { padding-left:20px; margin:0 0 8px; }
  .ya-legal .ya-updated { font-size:13px; margin:0 0 24px; }
  .ya-banner { max-width:1180px; margin:0 auto 8px; padding:10px 20px; font-size:13px; color:#0A0908; background:#E8D79A; border-radius:8px; }
  @media (max-width: 900px) {
    .ya-hero { grid-template-columns:1fr; gap:28px; padding-top:8px; }
    .ya-video { position:static; order:-1; width:min(100%, 270px); margin:0 auto; }
    .ya-hero-text { display:contents; }
    .ya-hero-copy { order:-2; }
    .ya-form-wrap { order:1; }
  }
  @media (max-width: 480px) {
    .ya-grid2 { grid-template-columns:1fr; gap:0; }
    .ya-card { padding:20px 16px; }
    .ya-logo { --h:44px; }
    .ya-brand-name { display:none; }
    .ya-h1 { font-size:46px; }
  }
`
