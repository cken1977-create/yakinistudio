// Styles for the Yakini Academy home and course pages (yh-*). Builds on ACADEMY_CSS (ya-*),
// which is shared with /class and /clase and is not changed here.
export const HOME_CSS = `
  .yh-head { position:sticky; top:0; z-index:50; background:rgba(10,9,8,0.88); backdrop-filter:blur(14px) saturate(160%); border-bottom:1px solid var(--ya-line); }
  .yh-head-in { max-width:1180px; margin:0 auto; padding:12px 20px; display:flex; align-items:center; gap:20px; }
  .yh-nav { display:flex; gap:24px; margin-left:auto; font-size:14px; }
  .yh-nav a { color:var(--ya-muted); text-decoration:none; }
  .yh-nav a:hover { color:var(--ya-cream); }
  .yh-head-right { display:flex; align-items:center; gap:10px; }
  .yh-cta-sm { display:inline-flex; align-items:center; min-height:40px; padding:0 16px; border-radius:999px; background:var(--ya-gold); color:#0A0908; font-size:14px; font-weight:600; text-decoration:none; white-space:nowrap; }
  .yh-cta-sm:hover { background:var(--ya-cream); }
  .yh-lang { position:relative; }
  .yh-lang summary { list-style:none; cursor:pointer; display:inline-flex; align-items:center; gap:8px; min-height:40px; padding:0 14px; border:1px solid var(--ya-line2); border-radius:999px; font-size:14px; }
  .yh-lang summary::-webkit-details-marker { display:none; }
  .yh-lang summary:hover { border-color:var(--ya-gold); }
  .yh-lang[open] summary { border-color:var(--ya-gold); color:var(--ya-gold); }
  .yh-lang ul { position:absolute; right:0; top:calc(100% + 8px); min-width:180px; margin:0; padding:6px; list-style:none; background:#151413; border:1px solid var(--ya-line2); border-radius:12px; box-shadow:0 20px 50px rgba(0,0,0,0.5); }
  .yh-lang li a { display:flex; justify-content:space-between; gap:16px; padding:10px 12px; border-radius:8px; text-decoration:none; font-size:15px; }
  .yh-lang li a:hover { background:rgba(255,255,255,0.05); }
  .yh-lang li a[aria-current="true"] { color:var(--ya-gold); }
  .yh-lang-code { color:var(--ya-muted); font-size:12px; letter-spacing:0.1em; }
  .yh-wrap { max-width:1180px; margin:0 auto; padding:0 20px; }
  .yh-hero { position:relative; padding:64px 0 56px; }
  .yh-hero::before { content:''; position:absolute; top:-80px; left:50%; transform:translateX(-50%); width:min(1100px, 140vw); height:620px; background:radial-gradient(ellipse at center, rgba(200,168,75,0.14) 0%, transparent 62%); pointer-events:none; }
  .yh-hero-grid { position:relative; display:grid; grid-template-columns:minmax(0,1.25fr) minmax(300px,0.75fr); gap:56px; align-items:center; }
  .yh-h1 { font-family:var(--ya-display); font-weight:400; font-size:clamp(46px, 7.4vw, 96px); line-height:0.95; letter-spacing:-0.02em; margin:0 0 22px; }
  .yh-h1 em { display:block; color:var(--ya-gold); font-style:italic; }
  .yh-support { display:flex; align-items:center; gap:12px; font-family:var(--ya-display); font-style:italic; font-size:clamp(20px,2.2vw,26px); color:var(--ya-cream); margin:0 0 18px; }
  .yh-support::before { content:''; width:36px; height:1px; background:var(--ya-gold); }
  .yh-sub { font-size:clamp(17px,1.5vw,19px); color:var(--ya-muted); max-width:38em; margin:0 0 26px; }
  .yh-ctas { display:flex; flex-wrap:wrap; gap:12px; margin-bottom:24px; }
  .yh-btn { display:inline-flex; align-items:center; justify-content:center; gap:10px; min-height:52px; padding:0 24px; border-radius:10px; font-size:16px; font-weight:600; text-decoration:none; border:1px solid transparent; }
  .yh-btn-gold { background:var(--ya-gold); color:#0A0908; }
  .yh-btn-gold:hover { background:var(--ya-cream); }
  .yh-btn-ghost { border-color:var(--ya-line2); color:var(--ya-cream); }
  .yh-btn-ghost:hover { border-color:var(--ya-gold); color:var(--ya-gold); }
  .yh-free { position:relative; background:linear-gradient(180deg, #17150f 0%, #100f0d 100%); border:1px solid rgba(200,168,75,0.45); border-radius:20px; padding:18px; box-shadow:0 30px 80px rgba(0,0,0,0.45); }
  .yh-free .ya-video { position:static; width:100%; max-width:250px; margin:0 auto 16px; }
  .yh-free .ya-video-cap { display:none; }
  .yh-badge { display:inline-block; padding:5px 10px; border-radius:999px; background:rgba(200,168,75,0.16); color:var(--ya-gold); font-size:11px; font-weight:700; letter-spacing:0.14em; margin-bottom:10px; }
  .yh-free h2 { font-family:var(--ya-display); font-weight:400; font-size:30px; line-height:1.05; margin:0 0 8px; }
  .yh-free p { color:var(--ya-muted); font-size:15px; margin:0 0 10px; }
  .yh-free .yh-meta { font-size:13px; color:var(--ya-cream); opacity:0.8; margin-bottom:14px; }
  .yh-section { padding:72px 0; border-top:1px solid var(--ya-line); scroll-margin-top:70px; }
  .yh-eyebrow { font-size:11px; font-weight:700; letter-spacing:0.22em; color:var(--ya-gold); margin:0 0 12px; }
  .yh-h2 { font-family:var(--ya-display); font-weight:400; font-size:clamp(32px,4.4vw,52px); line-height:1.05; margin:0 0 12px; max-width:22ch; }
  .yh-lead { color:var(--ya-muted); font-size:17px; max-width:42em; margin:0 0 32px; }
  .yh-mistakes { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,330px),1fr)); gap:14px; }
  .yh-mistake { display:flex; gap:14px; padding:20px; background:var(--ya-panel); border:1px solid var(--ya-line); border-radius:14px; }
  .yh-x { flex-shrink:0; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:rgba(240,154,143,0.12); color:#F0B3A9; font-weight:700; font-size:15px; }
  .yh-mistake h3 { font-size:17px; font-weight:600; margin:2px 0 6px; }
  .yh-mistake p { color:var(--ya-muted); font-size:15px; margin:0; }
  .yh-grid { display:grid; grid-template-columns:repeat(auto-fill, minmax(min(100%,320px),1fr)); gap:16px; }
  .yh-course { display:flex; flex-direction:column; background:var(--ya-panel); border:1px solid var(--ya-line); border-radius:16px; padding:22px; transition:border-color .2s, transform .2s; }
  .yh-course:hover { border-color:rgba(200,168,75,0.4); transform:translateY(-2px); }
  .yh-course-free { border-color:rgba(200,168,75,0.55); background:linear-gradient(180deg, #18160f, #121110); }
  .yh-course-top { display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom:16px; }
  .yh-num { font-family:var(--ya-display); font-style:italic; font-size:34px; line-height:1; color:var(--ya-gold); }
  .yh-status { font-size:11px; font-weight:700; letter-spacing:0.12em; text-transform:uppercase; padding:5px 10px; border-radius:999px; border:1px solid var(--ya-line2); color:var(--ya-muted); }
  .yh-status-free { border-color:rgba(200,168,75,0.6); color:var(--ya-gold); }
  .yh-course h3 { font-family:var(--ya-display); font-weight:400; font-size:28px; line-height:1.08; margin:0 0 10px; }
  .yh-course p { color:var(--ya-muted); font-size:15px; margin:0 0 14px; }
  .yh-tags { display:flex; flex-wrap:wrap; gap:6px; margin:0 0 18px; padding:0; list-style:none; }
  .yh-tags li { font-size:12px; padding:4px 10px; border-radius:999px; background:rgba(255,255,255,0.05); color:var(--ya-cream); }
  .yh-course-foot { margin-top:auto; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:10px; padding-top:14px; border-top:1px solid var(--ya-line); }
  .yh-price { font-size:13px; color:var(--ya-muted); }
  .yh-links { display:flex; flex-wrap:wrap; gap:10px; }
  .yh-link { font-size:14px; font-weight:600; color:var(--ya-gold); text-decoration:none; }
  .yh-link:hover { text-decoration:underline; text-underline-offset:3px; }
  .yh-note { margin-top:18px; font-size:14px; color:var(--ya-muted); }
  .yh-steps { display:grid; grid-template-columns:repeat(auto-fit, minmax(min(100%,230px),1fr)); gap:16px; counter-reset:step; }
  .yh-step { padding:22px; border-top:2px solid var(--ya-gold); background:rgba(255,255,255,0.02); }
  .yh-step h3 { font-size:18px; font-weight:600; margin:0 0 8px; }
  .yh-step h3::before { counter-increment:step; content:counter(step, decimal-leading-zero); display:block; font-family:var(--ya-display); font-style:italic; color:var(--ya-gold); font-size:26px; font-weight:400; margin-bottom:8px; }
  .yh-step p { color:var(--ya-muted); font-size:15px; margin:0; }
  .yh-orgs { display:grid; grid-template-columns:minmax(0,1fr) minmax(300px,440px); gap:40px; align-items:start; }
  .yh-points { display:grid; gap:14px; margin:0; padding:0; list-style:none; }
  .yh-points li { padding-left:22px; position:relative; }
  .yh-points li::before { content:''; position:absolute; left:0; top:9px; width:8px; height:8px; background:var(--ya-gold); transform:rotate(45deg); }
  .yh-points b { display:block; font-size:17px; margin-bottom:2px; }
  .yh-points span { color:var(--ya-muted); font-size:15px; }
  .yh-form h3 { font-family:var(--ya-display); font-weight:400; font-size:28px; margin:0 0 14px; }
  .yh-form textarea.ya-input { min-height:90px; resize:vertical; }
  .yh-ok { border:1px solid rgba(200,168,75,0.5); background:rgba(200,168,75,0.08); border-radius:10px; padding:12px 14px; font-size:14px; margin:0 0 14px; }
  .yh-course-hero { padding:40px 20px 56px; }
  .yh-crumb { font-size:14px; color:var(--ya-muted); margin-bottom:24px; display:inline-block; text-decoration:none; }
  .yh-crumb:hover { color:var(--ya-gold); }
  .yh-course-grid { display:grid; grid-template-columns:minmax(0,1fr) 340px; gap:48px; align-items:start; }
  .yh-facts { display:flex; flex-wrap:wrap; gap:8px; margin:0 0 8px; padding:0; list-style:none; }
  .yh-facts li { font-size:13px; padding:6px 12px; border-radius:999px; border:1px solid var(--ya-line2); }
  .yh-side { position:sticky; top:84px; }
  .yh-side .ya-card { padding:22px; }
  .yh-side-status { display:flex; justify-content:space-between; gap:8px; font-size:13px; color:var(--ya-muted); margin-bottom:14px; }
  .yh-side .yh-btn { width:100%; margin-bottom:10px; }
  .yh-modules { list-style:none; margin:0; padding:0; border:1px solid var(--ya-line); border-radius:14px; overflow:hidden; }
  .yh-modules li { display:grid; grid-template-columns:72px 1fr; gap:4px 12px; padding:18px 20px; border-top:1px solid var(--ya-line); background:var(--ya-panel); }
  .yh-modules li:first-child { border-top:0; }
  .yh-mod-n { grid-row:span 2; font-size:11px; letter-spacing:0.14em; color:var(--ya-gold); font-weight:700; padding-top:4px; }
  .yh-mod-n b { display:block; font-family:var(--ya-display); font-style:italic; font-weight:400; font-size:28px; letter-spacing:0; }
  .yh-modules h3 { font-size:17px; font-weight:600; margin:0; }
  .yh-modules p { color:var(--ya-muted); font-size:15px; margin:0; }
  .yh-langs { list-style:none; margin:0; padding:0; }
  .yh-langs li { display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--ya-line); font-size:15px; }
  .yh-langs span { color:var(--ya-muted); }
  .yh-bio { display:grid; grid-template-columns:120px 1fr; gap:20px; align-items:center; }
  .yh-bio img { width:120px; height:136px; object-fit:cover; object-position:50% 20%; border-radius:14px; border:1px solid var(--ya-line2); }
  .yh-bio b { display:block; font-family:var(--ya-display); font-size:24px; font-weight:400; margin-bottom:4px; }
  .yh-block { margin-top:44px; }
  .yh-block h2 { font-family:var(--ya-display); font-weight:400; font-size:clamp(26px,3vw,34px); margin:0 0 14px; }
  .yh-draft { font-size:13px; color:var(--ya-muted); margin:10px 0 0; font-style:italic; }
  @media (max-width: 960px) {
    .yh-nav { display:none; }
    .yh-head-right { margin-left:auto; }
    .yh-hero { padding-top:36px; }
    .yh-hero-grid, .yh-orgs, .yh-course-grid { grid-template-columns:1fr; gap:32px; }
    .yh-side { position:static; }
  }
  @media (max-width: 480px) {
    .yh-cta-sm { display:none; }
    .yh-h1 { font-size:44px; }
    .yh-section { padding:56px 0; }
    .yh-bio { grid-template-columns:96px 1fr; }
    .yh-bio img { width:96px; height:110px; }
    .yh-btn { width:100%; }
  }
`
