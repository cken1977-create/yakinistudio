// Catering funnel email copy (English + Spanish). Plain and warm. No vendor names, no income claims.
// Lines marked [PLACEHOLDER] come from config/funnel.ts and wait on Nicole.
import { EVENT_TYPES, OFFER, REPLY_PROMISE, REPLY_PROMISE_ES, DEPOSIT_LINE } from '@/config/funnel'
import { PHONE_DISPLAY, PHONE_TEL } from '@/config/site'
import { fmtDate } from './time'

export type EmailKind = 'confirm' | 'day1' | 'day3' | 'day7' | 'owner_alert' | 'quote' | 'weekly'

export type LeadVars = {
  firstName: string
  eventDate: string | null
  headcount: number | null
  eventType: string
  lang: 'en' | 'es'
  quoteUrl: string
  unsubUrl: string
  mailingAddress: string
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

type Body = { subject: string; paras: string[]; cta?: { label: string; url: string }; bullets?: string[] }

function typeLabel(id: string, lang: 'en' | 'es') {
  const t = EVENT_TYPES.find((x) => x.id === id)
  return t ? (lang === 'es' ? t.es : t.en).toLowerCase() : lang === 'es' ? 'evento' : 'event'
}

function leadContent(kind: 'confirm' | 'day1' | 'day3' | 'day7', v: LeadVars): Body {
  const date = v.eventDate ? fmtDate(v.eventDate, { weekday: 'long', month: 'long', day: 'numeric' }) : null
  const n = v.firstName
  if (v.lang === 'es') {
    const what = [date ? `para el ${date}` : null, v.headcount ? `${v.headcount} invitados` : null].filter(Boolean).join(', ')
    switch (kind) {
      case 'confirm':
        return { subject: "Recibimos tu solicitud — Momma Sally's", paras: [`¡Gracias, ${n}!`, `Momma Sally's recibió tu solicitud de cotización${what ? ` (${what})` : ''}. Nicole te contactará ${REPLY_PROMISE_ES.toLowerCase()} con tu cotización.`, `¿Preguntas? Llama o envía un texto al ${PHONE_DISPLAY}.`] }
      case 'day1':
        return { subject: 'Lo que más se pide para tu evento', paras: [`Hola ${n},`, `Mientras preparamos tu cotización, esto es lo que más piden para un ${typeLabel(v.eventType, 'es')}:`], bullets: ['Mesa de botanas (grazing table): fruta, quesos, pan y dips', 'Bufé de barbacoa: brisket, salchicha y acompañamientos caseros', 'Postres caseros: cobbler de durazno y pudín de plátano'], cta: { label: 'Ver fotos y detalles', url: v.quoteUrl } }
      case 'day3':
        return { subject: `¿Sigues planeando${date ? ` para el ${date}` : ''}?`, paras: [`Hola ${n},`, `Las fechas se llenan rápido. ¿Quieres que apartemos la tuya? Responde a este correo o llama al ${PHONE_DISPLAY}.`] }
      case 'day7':
        return { subject: '¿Cerramos tu solicitud?', paras: [`Hola ${n},`, OFFER.enabled ? OFFER.es : '', `Si ya no la necesitas, no hay problema: responde "cerrar" y no te escribimos más. Si sigues planeando, responde y Nicole te ayuda.`].filter(Boolean), cta: { label: 'Ver la oferta', url: v.quoteUrl } }
    }
  }
  const what = [date ? `for ${date}` : null, v.headcount ? `${v.headcount} guests` : null].filter(Boolean).join(', ')
  switch (kind) {
    case 'confirm':
      return { subject: "Got it! Your catering request — Momma Sally's", paras: [`Thanks, ${n}!`, `Momma Sally's got your quote request${what ? ` (${what})` : ''}. Nicole will reach out ${REPLY_PROMISE} with your quote.`, `Questions? Call or text ${PHONE_DISPLAY}.`] }
    case 'day1':
      return { subject: 'What most folks pick for a party like yours', paras: [`Hi ${n},`, `While we put your quote together, here's what most people pick for a ${typeLabel(v.eventType, 'en')}:`], bullets: ['Grazing table: fruit, cheese, bread and dips', 'BBQ buffet: smoked brisket, sausage and homestyle sides', 'Homemade desserts: peach cobbler and banana pudding'], cta: { label: 'See photos and details', url: v.quoteUrl } }
    case 'day3':
      return { subject: `Still planning${date ? ` for ${date}` : ''}?`, paras: [`Hi ${n},`, `Dates fill up fast. Want us to hold yours? Just reply to this email or call ${PHONE_DISPLAY}.`] }
    case 'day7':
      return { subject: 'Should I close your request?', paras: [`Hi ${n},`, OFFER.enabled ? OFFER.headline : '', `If you don't need catering anymore, no problem: reply "close" and we'll stop emailing. Still planning? Reply and Nicole will help.`].filter(Boolean), cta: { label: 'See the offer', url: v.quoteUrl } }
  }
}

function shell(b: Body, footer: string) {
  const html = `<!doctype html><html><body style="margin:0;background:#f4f1ec;font-family:Georgia,'Times New Roman',serif;color:#111">
<div style="max-width:560px;margin:0 auto;padding:28px 20px">
<div style="background:#000;color:#fff;padding:18px 22px;border-radius:14px 14px 0 0;font-size:20px;font-weight:bold">Momma Sally<span style="color:#d0161f">&rsquo;</span>s BBQ</div>
<div style="background:#fff;padding:24px 22px;border-radius:0 0 14px 14px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.55">
${b.paras.map((p) => `<p style="margin:0 0 14px">${esc(p)}</p>`).join('\n')}
${b.bullets ? `<ul style="margin:0 0 16px;padding-left:20px">${b.bullets.map((x) => `<li style="margin:0 0 6px">${esc(x)}</li>`).join('')}</ul>` : ''}
${b.cta ? `<p style="margin:20px 0"><a href="${esc(b.cta.url)}" style="background:#b3121b;color:#fff;text-decoration:none;padding:12px 22px;border-radius:999px;font-weight:bold;display:inline-block">${esc(b.cta.label)}</a></p>` : ''}
<p style="margin:18px 0 0"><a href="${PHONE_TEL}" style="color:#b3121b;font-weight:bold">Call or text ${PHONE_DISPLAY}</a></p>
</div>
<div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#666;padding:14px 6px;line-height:1.5">${footer}</div>
</div></body></html>`
  const text = [...b.paras, ...(b.bullets ?? []).map((x) => `- ${x}`), b.cta ? `${b.cta.label}: ${b.cta.url}` : '', `Call or text ${PHONE_DISPLAY}`].filter(Boolean).join('\n\n')
  return { html, text }
}

export function buildLeadEmail(kind: 'confirm' | 'day1' | 'day3' | 'day7', v: LeadVars) {
  const b = leadContent(kind, v)
  const unsubLabel = v.lang === 'es' ? 'Darme de baja' : 'Unsubscribe'
  const why = v.lang === 'es'
    ? 'Recibes este correo porque pediste una cotización de banquete a Momma Sally\'s.'
    : "You're getting this because you asked Momma Sally's for a catering quote."
  const footerHtml = `${esc(why)}<br>Momma Sally's BBQ · ${esc(v.mailingAddress)}<br><a href="${esc(v.unsubUrl)}" style="color:#666">${unsubLabel}</a>`
  const s = shell(b, footerHtml)
  return { subject: b.subject, html: s.html, text: `${s.text}\n\n--\n${why}\nMomma Sally's BBQ · ${v.mailingAddress}\n${unsubLabel}: ${v.unsubUrl}` }
}

export function buildQuoteEmail(v: LeadVars & { amount: string | null; note: string | null; depositUrl: string | null }) {
  const es = v.lang === 'es'
  const paras = [
    es ? `Hola ${v.firstName},` : `Hi ${v.firstName},`,
    es ? 'Aquí está tu cotización de Momma Sally\'s.' : "Here's your quote from Momma Sally's.",
    ...(v.amount ? [es ? `Total: ${v.amount}` : `Total: ${v.amount}`] : []),
    ...(v.note ? [v.note] : []),
    ...(v.depositUrl ? [es ? 'Tu fecha queda apartada cuando se paga el depósito.' : 'Your date is held when the deposit is paid.', DEPOSIT_LINE.startsWith('[PLACEHOLDER]') ? '' : DEPOSIT_LINE].filter(Boolean) : []),
    es ? 'Responde a este correo con cualquier pregunta.' : 'Reply to this email with any questions.',
  ]
  const b: Body = { subject: es ? "Tu cotización de Momma Sally's" : "Your quote from Momma Sally's", paras, cta: v.depositUrl ? { label: es ? 'Pagar el depósito' : 'Pay the deposit', url: v.depositUrl } : undefined }
  const footer = `Momma Sally's BBQ · ${esc(v.mailingAddress)}<br><a href="${esc(v.unsubUrl)}" style="color:#666">${es ? 'Darme de baja' : 'Unsubscribe'}</a>`
  const s = shell(b, footer)
  return { subject: b.subject, html: s.html, text: `${s.text}\n\n--\nMomma Sally's BBQ · ${v.mailingAddress}\nUnsubscribe: ${v.unsubUrl}` }
}

export function buildOwnerAlert(o: { name: string; email: string | null; phone: string | null; eventDate: string | null; headcount: number | null; eventType: string; budget: string | null; source: string; notes: string | null; leadUrl: string; consent: boolean }) {
  const lines = [
    `Event date: ${o.eventDate ? fmtDate(o.eventDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—'}`,
    `Guests: ${o.headcount ?? '—'}`,
    `Type: ${typeLabel(o.eventType, 'en')}`,
    `Budget: ${o.budget ?? 'not given'}`,
    `From: ${o.source}`,
    `Email: ${o.email ?? '—'}`,
    `Phone: ${o.phone ?? '—'}`,
    `Follow-up emails: ${o.consent ? 'yes (they opted in)' : 'no (confirmation only)'}`,
    ...(o.notes ? [`Notes: ${o.notes}`] : []),
  ]
  const b: Body = { subject: `New catering lead: ${o.name}${o.headcount ? `, ${o.headcount} guests` : ''}`, paras: ['A new quote request came in from the website.', ...lines], cta: { label: 'Open the lead', url: o.leadUrl } }
  return { subject: b.subject, ...shell(b, 'Sent to the owner of Momma Sally\'s BBQ by the website quote form.') }
}

export function buildWeekly(o: { rangeLabel: string; lines: string[]; officeUrl: string }) {
  const b: Body = { subject: `Catering this week: ${o.rangeLabel}`, paras: [`Your catering results for ${o.rangeLabel}:`, ...o.lines], cta: { label: 'Open the weekly view', url: o.officeUrl } }
  return { subject: b.subject, ...shell(b, "Monday summary for the owner of Momma Sally's BBQ. Counted from the website's own records.") }
}
