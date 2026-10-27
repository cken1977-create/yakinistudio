export const FLOW_CSS = `
  .st {
    position: relative;
    padding: 108px 18px 56px;
    min-height: 100svh;
    background:
      radial-gradient(ellipse at 50% 0%, rgba(200, 168, 75, 0.16), transparent 55%),
      linear-gradient(180deg, #0A0908 0%, #100e0b 100%);
  }
  .st-wrap { max-width: 760px; margin: 0 auto; }
  .st-kicker {
    display: flex; align-items: center; gap: 10px;
    font-size: 11px; font-weight: 600; letter-spacing: 0.28em;
    text-transform: uppercase; color: var(--gold); margin-bottom: 18px;
  }
  .st-h {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(40px, 10vw, 72px);
    line-height: 0.96;
    letter-spacing: -0.02em;
    color: var(--cream);
    margin: 0 0 16px;
    max-width: 14ch;
    outline: none;
  }
  .st-lead {
    font-size: 17px; line-height: 1.55;
    color: rgba(244, 241, 235, 0.72);
    max-width: 38em; margin: 0 0 28px;
  }
  .st-progress { margin: 0 0 28px; }
  .st-progress p {
    font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase;
    color: rgba(244, 241, 235, 0.62); margin: 0 0 10px;
  }
  .st-meter {
    height: 3px; background: rgba(255,255,255,0.08); border-radius: 99px; overflow: hidden;
  }
  .st-meter span {
    display: block; height: 100%; background: var(--gold);
    transition: width 0.35s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .st-test {
    margin: 0 0 22px; padding: 14px 16px;
    border: 1px solid var(--gold);
    background: rgba(200, 168, 75, 0.1);
    color: var(--cream);
    font-size: 14px; line-height: 1.5;
  }
  .st-test strong { color: var(--gold); font-weight: 600; letter-spacing: 0.04em; }
  .st-welcome {
    margin: 0 0 22px; padding: 16px;
    border: 1px solid var(--gold);
    background: rgba(200, 168, 75, 0.1);
  }
  .st-welcome p { margin: 0 0 14px; color: var(--cream); font-size: 16px; line-height: 1.45; }
  .st-welcome-actions { display: flex; flex-wrap: wrap; gap: 10px; }
  .st-honest { margin-top: 12px; }
  .st-email-build { margin-top: 18px; display: flex; flex-direction: column; align-items: flex-start; gap: 12px; }
  .st-email-build p { margin: 0; font-size: 14px; line-height: 1.5; color: rgba(244,241,235,0.72); max-width: 40em; }
  .st-link {
    background: none; border: none; padding: 0; cursor: pointer;
    color: var(--gold); font-size: 15px;
    border-bottom: 1px solid rgba(200,168,75,0.45);
  }
  .st-check { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; line-height: 1.45; color: var(--cream); }
  .st-check input { margin-top: 3px; accent-color: var(--gold); }
  .st-list { display: flex; flex-direction: column; gap: 12px; }
  .st-choice {
    position: relative;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 14px;
    align-items: start;
    width: 100%;
    text-align: left;
    padding: 18px 16px;
    min-height: 72px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.025);
    color: var(--cream);
    cursor: pointer;
    transition: border-color 0.2s, background 0.2s, transform 0.2s;
  }
  .st-choice:hover { border-color: rgba(200, 168, 75, 0.55); }
  .st-choice:has(input:checked) {
    border-color: var(--gold);
    background: rgba(200, 168, 75, 0.1);
    box-shadow: inset 3px 0 0 var(--gold);
  }
  .st-choice:has(input:focus-visible) { outline: 2px solid var(--gold); outline-offset: 3px; }
  .st-choice:has(input:disabled) { opacity: 0.45; cursor: not-allowed; }
  .st-choice input {
    position: absolute; opacity: 0; width: 1px; height: 1px; margin: 0;
  }
  .st-mark {
    width: 22px; height: 22px; margin-top: 2px; flex-shrink: 0;
    border: 1.5px solid rgba(244, 241, 235, 0.45);
    display: grid; place-items: center;
    color: var(--navy-deep); font-size: 14px; line-height: 1;
  }
  .st-choice:has(input[type="radio"]) .st-mark { border-radius: 50%; }
  .st-choice:has(input:checked) .st-mark { background: var(--gold); border-color: var(--gold); }
  .st-choice:has(input:checked) .st-mark::after { content: '✓'; font-weight: 700; }
  .st-choice h2, .st-choice h3 {
    font-family: var(--font-display);
    font-size: 28px; font-weight: 500; line-height: 1.05; margin: 0 0 4px;
  }
  .st-choice p { margin: 0; color: rgba(244, 241, 235, 0.68); font-size: 14.5px; line-height: 1.45; }
  .st-soon {
    padding: 18px 16px;
    border: 1px dashed rgba(255,255,255,0.16);
    background: rgba(255,255,255,0.015);
    color: rgba(244, 241, 235, 0.45);
  }
  .st-soon h3 { font-family: var(--font-display); font-size: 26px; font-weight: 500; margin: 0 0 6px; }
  .st-soon p { margin: 0; font-size: 14.5px; line-height: 1.45; }
  .st-pill {
    display: inline-block; margin-bottom: 8px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.18em; text-transform: uppercase;
    color: rgba(244, 241, 235, 0.55);
    border: 1px solid rgba(255,255,255,0.18); padding: 4px 8px;
  }
  .st-group { margin: 0 0 28px; }
  .st-group h2 {
    font-size: 12px; letter-spacing: 0.22em; text-transform: uppercase;
    color: var(--gold); font-weight: 600; margin: 0 0 12px;
  }
  .st-note {
    margin-top: 8px; font-size: 13.5px; line-height: 1.5; color: rgba(244, 241, 235, 0.62);
  }
  .st-ask {
    margin-top: 8px; padding: 16px;
    border: 1px solid rgba(255,255,255,0.1);
    color: rgba(244, 241, 235, 0.62); font-size: 15px; line-height: 1.5;
  }
  .st-split { display: grid; gap: 12px; margin-bottom: 18px; }
  .st-path {
    min-height: 88px;
    padding: 18px 16px;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.025);
    color: var(--cream);
    text-align: left;
    cursor: pointer;
  }
  .st-path strong { display: block; font-family: var(--font-display); font-size: 28px; font-weight: 500; margin-bottom: 4px; }
  .st-path span { color: rgba(244, 241, 235, 0.68); font-size: 14.5px; }
  .st-path.on { border-color: var(--gold); background: rgba(200, 168, 75, 0.1); box-shadow: inset 3px 0 0 var(--gold); }
  .st-path:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
  .st-field { display: flex; flex-direction: column; gap: 8px; margin-bottom: 18px; }
  .st-field label, .st-legend {
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em; color: var(--cream);
  }
  .st-field input, .st-field textarea {
    width: 100%;
    min-height: 56px;
    padding: 14px 14px;
    border: 1px solid rgba(255,255,255,0.16);
    background: rgba(0,0,0,0.25);
    color: var(--cream);
    font: inherit; font-size: 18px;
    border-radius: 0;
  }
  .st-field input:focus, .st-field textarea:focus {
    outline: none; border-color: var(--gold);
  }
  .st-field small { color: rgba(244, 241, 235, 0.55); font-size: 13px; line-height: 1.45; }
  .st-add {
    background: none; border: none; color: var(--gold);
    font: inherit; font-size: 15px; font-weight: 600; padding: 8px 0; cursor: pointer;
  }
  .st-time { display: flex; flex-direction: column; gap: 0; }
  .st-time article {
    padding: 18px 0 18px 18px;
    border-left: 1px solid rgba(200, 168, 75, 0.45);
  }
  .st-time h2 {
    font-family: var(--font-display); font-size: 26px; font-weight: 500;
    margin: 0 0 6px; color: var(--cream);
  }
  .st-time p { margin: 0; color: rgba(244, 241, 235, 0.74); font-size: 16px; line-height: 1.55; }
  .st-open {
    margin: 0 0 22px; padding: 18px 16px;
    border: 1px solid rgba(200, 168, 75, 0.35);
    background: rgba(200, 168, 75, 0.06);
  }
  .st-open p { margin: 0; font-size: 16px; line-height: 1.55; color: rgba(244, 241, 235, 0.8); }
  .st-plans { display: flex; flex-direction: column; gap: 12px; margin-bottom: 22px; }
  .st-plan h3 { font-size: 32px; }
  .st-price {
    font-family: var(--font-display);
    font-size: 28px; color: var(--gold); margin-top: 8px;
  }
  .st-price small { font-family: var(--font-body); font-size: 14px; color: rgba(244, 241, 235, 0.7); }
  .st-fit {
    display: inline-block; margin-bottom: 6px;
    font-size: 10px; font-weight: 700; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold);
  }
  .st-total {
    padding: 22px 18px; margin: 8px 0 22px;
    background: #14120e;
    border: 1px solid var(--gold);
  }
  .st-total .st-due {
    font-size: 12px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin: 0 0 6px;
  }
  .st-total .st-big {
    font-family: var(--font-display);
    font-size: clamp(56px, 14vw, 84px);
    line-height: 0.9; margin: 0;
    color: var(--cream);
  }
  .st-total .st-big span { font-size: 0.38em; letter-spacing: 0; }
  .st-total .st-setup { margin: 10px 0 0; font-size: 17px; color: rgba(244, 241, 235, 0.82); }
  .st-total .st-zero { margin: 14px 0 0; font-size: 16px; color: var(--cream); }
  .st-includes { margin: 0 0 22px; padding: 0; }
  .st-includes li {
    padding: 10px 0 10px 22px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    position: relative; color: rgba(244, 241, 235, 0.82); font-size: 15.5px;
  }
  .st-includes li::before {
    content: ''; position: absolute; left: 0; top: 18px;
    width: 8px; height: 8px; background: var(--gold);
  }
  .st-contact { margin-top: 8px; }
  .st-contact h2 {
    font-family: var(--font-display); font-size: 36px; font-weight: 500; margin: 0 0 8px;
  }
  .st-error {
    margin: 0 0 14px; padding: 12px 14px;
    border: 1px solid #c47a6a; color: #f3d2cb; font-size: 15px; line-height: 1.45;
  }
  .st-bar {
    position: sticky; bottom: 0; z-index: 5;
    display: flex; gap: 10px;
    margin: 28px -18px 0; padding: 14px 18px calc(14px + env(safe-area-inset-bottom));
    background: rgba(10, 9, 8, 0.92);
    backdrop-filter: blur(16px);
    border-top: 1px solid rgba(255,255,255,0.08);
  }
  .st-btn {
    min-height: 56px; padding: 14px 18px;
    font: inherit; font-size: 16px; font-weight: 600; letter-spacing: 0.03em;
    border: 1.5px solid rgba(255,255,255,0.18);
    background: transparent; color: var(--cream); cursor: pointer;
  }
  .st-btn:disabled { opacity: 0.45; cursor: not-allowed; }
  .st-btn-gold {
    flex: 1;
    background: var(--gold); border-color: var(--gold); color: #0A0908;
  }
  .st-btn-gold:not(:disabled):hover { background: var(--cream); }
  .st-btn:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
  .st-done { padding-bottom: 24px; }
  .st-done h1 { max-width: 12ch; }
  .st-reassurance {
    font-family: var(--font-display);
    font-size: clamp(28px, 6vw, 40px);
    line-height: 1.05;
    color: var(--gold);
    margin: -4px 0 18px;
  }
  .st-biz-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 8px; }
  .st-biz {
    min-height: 72px;
    padding: 14px 12px;
    text-align: left;
    border: 1px solid rgba(255,255,255,0.12);
    background: rgba(255,255,255,0.025);
    color: var(--cream);
    font: inherit;
    font-size: 15px;
    line-height: 1.25;
    cursor: pointer;
  }
  .st-biz.on { border-color: var(--gold); background: rgba(200, 168, 75, 0.12); box-shadow: inset 3px 0 0 var(--gold); }
  .st-biz:focus-visible { outline: 2px solid var(--gold); outline-offset: 3px; }
  .st-count { margin: 0 0 16px; font-size: 14px; letter-spacing: 0.08em; text-transform: uppercase; color: rgba(244,241,235,0.7); }
  .st-count strong { color: var(--gold); font-size: 18px; letter-spacing: 0; }
  .st-cat { margin: 0 0 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.02); }
  .st-cat-h {
    width: 100%;
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 12px;
    align-items: center;
    padding: 16px;
    text-align: left;
    background: transparent;
    border: 0;
    color: var(--cream);
    cursor: pointer;
  }
  .st-cat-h h2 { font-family: var(--font-display); font-size: 26px; font-weight: 500; margin: 0; line-height: 1.05; }
  .st-cat-h small { display: block; margin-top: 4px; color: rgba(244,241,235,0.55); font-size: 12px; letter-spacing: 0.08em; text-transform: uppercase; }
  .st-ico { width: 28px; height: 28px; color: var(--gold); }
  .st-lede { margin: 0 16px 12px; color: rgba(244,241,235,0.72); font-size: 15px; line-height: 1.5; }
  .st-cat .st-list { padding: 0 12px 14px; }
  .st-feat {
    display: block;
    padding: 14px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(0,0,0,0.18);
  }
  .st-feat-included { cursor: pointer; }
  .st-feat-included.on { border-color: var(--gold); box-shadow: inset 3px 0 0 var(--gold); }
  .st-feat input { position: absolute; opacity: 0; width: 1px; height: 1px; }
  .st-feat h3 { font-family: var(--font-display); font-size: 24px; font-weight: 500; margin: 8px 0 4px; }
  .st-feat p { margin: 0; color: rgba(244,241,235,0.7); font-size: 14.5px; line-height: 1.45; }
  .st-feat-soon, .st-feat-setup { opacity: 0.92; }
  .st-feat-addon { cursor: pointer; }
  .st-feat-addon.on { border-color: var(--gold); box-shadow: inset 3px 0 0 var(--gold); }
  .st-cat-addons { border-color: rgba(200,168,75,0.55); }
  .st-addon-group { margin: 10px 4px 8px; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: rgba(244,241,235,0.5); }
  .st-feat p.st-price-note { margin: 6px 0 0; color: var(--gold); font-size: 13px; letter-spacing: 0.02em; }
  .st-pill { display: inline-block; margin: 0 6px 0 0; font-size: 10px; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; padding: 4px 7px; border: 1px solid rgba(255,255,255,0.2); color: rgba(244,241,235,0.75); }
  .st-pill-included { color: #0A0908; background: var(--gold); border-color: var(--gold); }
  .st-pill-setup { color: var(--gold); border-color: var(--gold); }
  .st-pill-soon { border-style: dashed; }
  .st-pill-addon { color: var(--cream); border-color: rgba(200,168,75,0.7); }
  .st-pill-grow { color: var(--gold); }
  .st-points { margin: 8px 0 0; padding: 0; }
  .st-points li { position: relative; padding: 4px 0 4px 14px; color: rgba(244,241,235,0.62); font-size: 13.5px; }
  .st-points li::before { content: ''; position: absolute; left: 0; top: 11px; width: 6px; height: 6px; background: var(--gold); }
  .st-who { margin: 4px 0 8px; color: rgba(244,241,235,0.78); }
  .st-setup-line { margin: 6px 0 0; font-size: 14px; color: rgba(244,241,235,0.65); }
  .st-bullets { margin: 10px 0 0; padding: 0; }
  .st-bullets li { padding: 5px 0 5px 16px; position: relative; font-weight: 650; font-size: 15px; }
  .st-bullets li::before { content: ''; position: absolute; left: 0; top: 12px; width: 7px; height: 7px; background: var(--gold); }
  .st-more { margin: 10px 0 0; font-size: 13.5px; line-height: 1.45; color: rgba(244,241,235,0.62); }
  .st-picked {
    margin: 0 0 18px;
    padding: 18px 16px;
    border: 1px dashed rgba(200,168,75,0.7);
    background: transparent;
  }
  .st-picked h2 {
    font-family: var(--font-display);
    font-size: 28px;
    font-weight: 500;
    margin: 0 0 8px;
    line-height: 1.1;
  }
  .st-picked ul { margin: 0; padding: 0; }
  .st-picked li { list-style: none; padding: 6px 0; color: rgba(244,241,235,0.88); font-size: 15.5px; }
  .st-picked p { margin: 10px 0 0; color: rgba(244,241,235,0.62); font-size: 14px; }
  .st-promise, .st-addons, .st-setup-list {
    margin: 0 0 18px;
    padding: 18px 16px;
    border: 1px solid var(--gold);
    background: rgba(200,168,75,0.06);
  }
  .st-promise h2, .st-addons h2, .st-setup-list h2 {
    font-family: var(--font-display);
    font-size: 32px;
    font-weight: 500;
    margin: 0 0 8px;
    line-height: 1.05;
  }
  .st-promise p, .st-addons li, .st-setup-list li, .st-setup-list p { color: rgba(244,241,235,0.82); font-size: 15.5px; line-height: 1.5; }
  .st-addons ul, .st-setup-list ul { margin: 0; padding: 0; }
  .st-addons li, .st-setup-list li { position: relative; padding: 8px 0 8px 26px; list-style: none; }
  .st-addons li::before, .st-setup-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    top: 8px;
    color: var(--gold);
    font-weight: 700;
  }
  .st-setup-list p { margin: 12px 0 0; color: rgba(244,241,235,0.62); font-size: 13.5px; }
  .st-pay-grid { display: grid; gap: 12px; }
  .st-operator {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(36px, 8vw, 56px);
    line-height: 0.98;
    letter-spacing: -0.02em;
    color: var(--gold);
    margin: 4px 0 8px;
    max-width: 12ch;
  }
  .st-recap {
    margin-top: 22px; padding: 0;
  }
  .st-recap div {
    display: flex; justify-content: space-between; gap: 16px;
    padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,0.08);
    font-size: 15px;
  }
  .st-recap dt { color: rgba(244, 241, 235, 0.55); }
  .st-recap dd { margin: 0; text-align: right; color: var(--cream); }
  @media (min-width: 720px) {
    .st { padding: 140px 32px 72px; }
    .st-list.st-templates { display: grid; grid-template-columns: 1fr 1fr; }
    .st-biz-grid { grid-template-columns: 1fr 1fr 1fr; }
    .st-pay-grid { grid-template-columns: 1.1fr 0.9fr; align-items: start; }
    .st-split { grid-template-columns: 1fr 1fr; }
    .st-plans { display: grid; grid-template-columns: 1fr; }
    .st-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    .st-fields .st-wide { grid-column: 1 / -1; }
    .st-bar { margin-left: 0; margin-right: 0; padding-left: 0; padding-right: 0; }
  }
  @media (prefers-reduced-motion: reduce) {
    .st-meter span, .st-choice { transition: none; }
  }
`
