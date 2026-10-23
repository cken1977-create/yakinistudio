// Shared marketing content and styles for yakini.digital.
// Plain module (no 'use client'), so both server pages and client sections can import it.
// Customer-facing copy names services, never the companies behind them.

import { PARTNER } from '@/lib/pricing'
import { SEAT_CSS } from '@/components/seat-css'

/** Book a call = the custom-build intake form. */
export const BOOK_CALL_URL = PARTNER.href // '/apply?tier=partner'

export const TOUR = [
  { k: '01', title: 'Client rooms', body: 'Every client gets a private room: messages, files, requests and updates in one thread instead of scattered across your phone.' },
  { k: '02', title: 'Your business texting line', body: 'One number for the business. Text customers who have opted in, and their replies land in the right room.' },
  { k: '03', title: 'A help desk with a real person', body: 'Customers send requests and follow the status. When you need help, your Yakini person is right there in the help desk too.' },
  { k: '04', title: 'Payments on your invoices', body: 'Send an invoice and get paid by card, right from the portal.', tag: 'Grow plan' },
  { k: '05', title: 'Replies drafted for you', body: 'Replies and voice-note transcripts are drafted for you to check. Nothing goes out without your OK.' },
  { k: '06', title: 'Booking you confirm', body: 'Customers ask for a time and you confirm each one, so your calendar stays yours.' },
] as const

export const BUILDS = [
  {
    id: 'lead-engine',
    label: 'Lead engine',
    title: 'Never let a lead go cold again.',
    points: [
      'Every missed call and new lead answered in under 60 seconds',
      'Follow-up for 12 months, not 12 days',
      'Hot leads texted to your rep with a deadline, and escalated if no one moves',
      'A monthly report that proves it',
    ],
  },
  {
    id: 'payments',
    label: 'Payments and books',
    title: 'Money that adds up, every time.',
    points: [
      'One fee engine for every way you charge',
      'Payment plans your customers can keep',
      'Separate books for related entities',
      'A ledger that only adds, never rewrites',
    ],
  },
] as const

export const BUILD_STEPS = [
  { t: 'A conversation', d: 'You tell us what the business needs and where it is losing time or money. We ask a lot of questions.' },
  { t: 'Scope and quote, in writing', d: 'You get a written scope and price before anything starts. No surprises later.' },
  { t: 'We build it with you', d: 'You see it come together and approve the pieces as they land.' },
  { t: 'Launch, and we stay', d: 'We launch it and stay on to run it with you, instead of handing over the keys and walking away.' },
] as const

export const SECTIONS_CSS = SEAT_CSS + `
  .hm-h2 {
    font-family: var(--font-display); font-weight: 400;
    font-size: clamp(38px, 6vw, 76px); line-height: 1.02; letter-spacing: -0.015em;
    color: var(--cream); margin-bottom: 24px; max-width: 20ch;
  }
  .hm-lead { font-size: clamp(16px, 1.4vw, 19px); line-height: 1.65; color: rgba(244,241,235,0.72); max-width: 640px; margin-bottom: 48px; }
  .hm-fine { margin-top: 28px; font-size: 13px; color: var(--muted); max-width: 720px; }
  .hm-ctas { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
  .hm-ctas-center { justify-content: center; }
  .hm-btn {
    display: inline-flex; align-items: center; justify-content: center; gap: 12px;
    padding: 17px 28px; font-size: 14px; font-weight: 600; letter-spacing: 0.04em;
    border: 1.5px solid var(--line-strong); color: var(--cream);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .hm-btn:hover { border-color: var(--gold); color: var(--gold); }
  .hm-btn:hover .yk-btn-arrow { transform: translateX(5px); }
  .hm-btn .yk-btn-arrow { transition: transform 0.25s; }
  .hm-btn-gold { background: var(--gold); border-color: var(--gold); color: var(--navy-deep); }
  .hm-btn-gold:hover { background: var(--cream); border-color: var(--cream); color: var(--navy-deep); box-shadow: 0 16px 40px rgba(200,168,75,0.28); transform: translateY(-2px); }
  .hm-btn-off { opacity: 0.5; cursor: default; }
  .hm-textlink { display: inline-block; margin-top: 24px; color: var(--gold); font-size: 15px; border-bottom: 1px solid rgba(200,168,75,0.4); padding-bottom: 2px; }

  /* Portal window */
  .pw {
    margin: 0; width: 100%; max-width: 560px;
    background: linear-gradient(180deg, rgba(20,18,15,0.94), rgba(12,11,9,0.96));
    border: 1px solid rgba(200,168,75,0.35);
    box-shadow: 0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03) inset, 0 0 80px rgba(200,168,75,0.10);
    border-radius: 14px; overflow: hidden; backdrop-filter: blur(8px);
  }
  .pw-bar { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid var(--line); }
  .pw-dots { display: flex; gap: 6px; }
  .pw-dots i { width: 9px; height: 9px; border-radius: 50%; background: rgba(255,255,255,0.14); display: block; }
  .pw-title { font-size: 12px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--cream); }
  .pw-sample { margin-left: auto; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); border: 1px solid var(--line-strong); padding: 3px 8px; border-radius: 999px; }
  .pw-body { display: grid; grid-template-columns: 1fr; }
  .pw-rooms { display: none; border-right: 1px solid var(--line); padding: 14px 10px; }
  .pw-rooms-h { font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--gold); padding: 0 8px 8px; }
  .pw-rooms-h2 { margin-top: 14px; }
  .pw-room { display: flex; align-items: center; gap: 10px; padding: 8px; border-radius: 8px; font-size: 13px; color: rgba(244,241,235,0.75); position: relative; }
  .pw-room-on { background: rgba(200,168,75,0.10); color: var(--cream); }
  .pw-room b { position: absolute; right: 10px; width: 7px; height: 7px; border-radius: 50%; background: var(--gold); }
  .pw-av { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.08); color: var(--cream); flex-shrink: 0; }
  .pw-av-gold { background: var(--gold); color: var(--navy-deep); }
  .pw-thread { padding: 18px; display: flex; flex-direction: column; gap: 12px; }
  .pw-msg { align-self: flex-start; max-width: 85%; background: rgba(255,255,255,0.06); border: 1px solid var(--line); padding: 10px 14px; border-radius: 14px 14px 14px 4px; font-size: 14px; color: var(--cream); }
  .pw-chan { display: block; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); margin-bottom: 3px; }
  .pw-book { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 13px; color: rgba(244,241,235,0.8); border: 1px dashed var(--line-strong); padding: 10px 12px; border-radius: 10px; }
  .pw-chip { font-size: 11px; font-weight: 600; letter-spacing: 0.06em; color: var(--gold); border: 1px solid rgba(200,168,75,0.5); padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
  .pw-draft { align-self: flex-end; width: 92%; border: 1px solid rgba(200,168,75,0.45); background: rgba(200,168,75,0.07); border-radius: 14px 14px 4px 14px; padding: 12px 14px; }
  .pw-draft-h { font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--gold); margin-bottom: 6px; }
  .pw-draft p { font-size: 14px; color: var(--cream); }
  .pw-draft-actions { display: flex; gap: 8px; margin-top: 10px; }
  .pw-btn { font-size: 12px; font-weight: 600; padding: 7px 12px; border-radius: 8px; border: 1px solid var(--line-strong); color: var(--cream); }
  .pw-btn-gold { background: var(--gold); border-color: var(--gold); color: var(--navy-deep); }
  @media (min-width: 640px) {
    .pw-body { grid-template-columns: 190px 1fr; }
    .pw-rooms { display: block; }
  }

  /* Tour */
  .hm-tour { background: linear-gradient(180deg, var(--black-soft) 0%, var(--navy-deep) 100%); border-top: 1px solid var(--line); }
  .hm-tour-grid { display: grid; grid-template-columns: 1fr; gap: 1px; background: var(--line); border: 1px solid var(--line); }
  .hm-tour-card { background: var(--navy-deep); padding: 32px 28px; transition: background 0.3s; }
  .hm-tour-card:hover { background: #12100d; }
  .hm-tour-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 22px; }
  .hm-tour-k { font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--gold); }
  .hm-tour-tag { font-size: 10px; letter-spacing: 0.16em; text-transform: uppercase; color: var(--gold); border: 1px solid rgba(200,168,75,0.4); padding: 3px 9px; border-radius: 999px; }
  .hm-tour-card h3 { font-family: var(--font-display); font-weight: 500; font-size: 28px; line-height: 1.1; color: var(--cream); margin-bottom: 12px; }
  .hm-tour-card p { font-size: 15px; line-height: 1.6; color: rgba(244,241,235,0.68); }
  @media (min-width: 700px) { .hm-tour-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1100px) { .hm-tour-grid { grid-template-columns: 1fr 1fr 1fr; } }

  /* Plans */
  .hm-plans { background: var(--navy-deep); }
  .hm-plan-grid { display: grid; grid-template-columns: 1fr; gap: 16px; }
  .hm-plan { display: flex; flex-direction: column; padding: 32px 26px; border: 1px solid var(--line-strong); background: rgba(255,255,255,0.015); }
  .hm-plan-grow { border-color: rgba(200,168,75,0.45); }
  .hm-plan-founding { border: 1.5px solid var(--gold); background: linear-gradient(180deg, rgba(200,168,75,0.10), rgba(200,168,75,0.02)); }
  .hm-plan-partner { background: transparent; border-style: dashed; }
  .hm-plan-tag { font-size: 11px; font-weight: 600; letter-spacing: 0.2em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .hm-plan-name { font-family: var(--font-display); font-weight: 500; font-size: 40px; line-height: 1; color: var(--cream); margin-bottom: 10px; }
  .hm-plan-sum { font-size: 15px; line-height: 1.55; color: rgba(244,241,235,0.7); margin-bottom: 20px; }
  .hm-plan-line { font-family: var(--font-display); font-style: italic; font-size: 24px; color: var(--gold); margin-bottom: 10px; }
  .hm-plan-price { display: flex; align-items: baseline; gap: 6px; }
  .hm-plan-num { font-family: var(--font-display); font-size: 56px; line-height: 1; color: var(--cream); }
  .hm-plan-per { font-size: 15px; color: var(--muted); }
  .hm-plan-setup { margin-top: 8px; font-size: 14px; color: rgba(244,241,235,0.75); }
  .hm-plan-list { margin: 22px 0 12px; display: flex; flex-direction: column; gap: 10px; flex: 1; }
  .hm-plan-more { margin: 0 0 18px; font-size: 13.5px; line-height: 1.45; color: rgba(244,241,235,0.62); }
  .hm-plan-list li { position: relative; padding-left: 22px; font-size: 14.5px; line-height: 1.5; color: rgba(244,241,235,0.82); }
  .hm-plan-list li::before { content: ''; position: absolute; left: 0; top: 8px; width: 10px; height: 1.5px; background: var(--gold); }
  .hm-plan .hm-btn { margin-top: auto; width: 100%; }
  .hm-policy { margin-top: 36px; display: grid; gap: 10px; max-width: 900px; }
  .hm-policy li { font-size: 14px; line-height: 1.6; color: rgba(244,241,235,0.65); }
  .hm-policy strong { color: var(--cream); font-weight: 600; }
  @media (min-width: 760px) { .hm-plan-grid { grid-template-columns: 1fr 1fr; } }
  @media (min-width: 1200px) { .hm-plan-grid { grid-template-columns: repeat(4, 1fr); } }

  /* Steps */
  .hm-steps { background: linear-gradient(180deg, var(--navy-deep) 0%, var(--black-soft) 100%); border-top: 1px solid var(--line); }
  .hm-step-list { display: grid; grid-template-columns: 1fr; gap: 0; counter-reset: s; border-top: 1px solid var(--line); }
  .hm-step { padding: 28px 0; border-bottom: 1px solid var(--line); display: grid; grid-template-columns: 56px 1fr; column-gap: 16px; }
  .hm-step-num { grid-row: span 2; font-family: var(--font-display); font-style: italic; font-size: 34px; color: var(--gold); line-height: 1; }
  .hm-step h3 { font-family: var(--font-display); font-weight: 500; font-size: 26px; color: var(--cream); line-height: 1.15; margin-bottom: 8px; }
  .hm-step p { font-size: 15px; line-height: 1.6; color: rgba(244,241,235,0.7); }
  .hm-own { margin-top: 32px; font-family: var(--font-display); font-style: italic; font-size: 22px; color: var(--gold); }
  @media (min-width: 1000px) {
    .hm-step-list { grid-template-columns: repeat(4, 1fr); border-top: none; gap: 24px; }
    .hm-step { display: block; border-bottom: none; border-top: 1px solid var(--gold); padding-top: 28px; }
    .hm-step-num { display: block; margin-bottom: 18px; }
  }

  /* Custom builds band */
  .hm-builds {
    position: relative; padding: 120px 24px;
    background: linear-gradient(180deg, rgba(6,5,4,0.88) 0%, rgba(10,9,8,0.94) 100%), url('/yakini-services-bg.jpg') center / cover no-repeat;
    border-top: 1px solid rgba(200,168,75,0.35); border-bottom: 1px solid rgba(200,168,75,0.35);
  }
  .hm-builds-inner { max-width: 1400px; margin: 0 auto; }
  .hm-build-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
  .hm-build { padding: 36px 30px; border: 1px solid rgba(200,168,75,0.35); background: rgba(10,9,8,0.72); backdrop-filter: blur(6px); }
  .hm-build-label { font-size: 11px; font-weight: 600; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold); margin-bottom: 14px; }
  .hm-build h3 { font-family: var(--font-display); font-weight: 400; font-size: clamp(30px, 3.4vw, 42px); line-height: 1.08; color: var(--cream); margin-bottom: 22px; }
  .hm-build ul { display: flex; flex-direction: column; gap: 12px; }
  .hm-build li { position: relative; padding-left: 26px; font-size: 16px; line-height: 1.55; color: rgba(244,241,235,0.85); }
  .hm-build li::before { content: '→'; position: absolute; left: 0; color: var(--gold); }
  .hm-builds-note { margin-top: 28px; font-size: 15px; color: rgba(244,241,235,0.7); max-width: 720px; }
  @media (min-width: 900px) { .hm-build-grid { grid-template-columns: 1fr 1fr; } .hm-builds { padding: 160px 32px; } }

  /* Final */
  .hm-final { padding: 140px 24px; text-align: center; background: radial-gradient(ellipse at center, rgba(200,168,75,0.12) 0%, transparent 60%), var(--black); border-top: 1px solid var(--line); }
  .hm-final-inner { max-width: 900px; margin: 0 auto; }
  .hm-final-h2 { font-family: var(--font-display); font-weight: 400; font-size: clamp(52px, 9vw, 120px); line-height: 0.95; color: var(--cream); margin-bottom: 24px; }
  .hm-final-sub { font-size: clamp(16px, 1.5vw, 20px); color: rgba(244,241,235,0.72); max-width: 560px; margin: 0 auto; }

  /* Founding strip */
  .hm-founding {
    display: inline-flex; align-items: center; gap: 12px; margin-top: 28px;
    padding: 12px 18px; border: 1px solid rgba(200,168,75,0.45); background: rgba(10,9,8,0.55);
    font-size: 14px; line-height: 1.45; color: rgba(244,241,235,0.88); backdrop-filter: blur(6px);
  }
  .hm-founding strong { color: var(--gold); font-weight: 600; }
  .hm-founding:hover { border-color: var(--gold); }
  .hm-founding-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gold); flex-shrink: 0; animation: yk-dot-pulse 2s ease-in-out infinite; }

  @media (max-width: 700px) {
    .yk-section { padding: 96px 20px; }
    .hm-btn { width: 100%; }
    .hm-builds { padding: 96px 20px; }
    .hm-final { padding: 110px 20px; }
  }
`
