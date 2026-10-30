// Class email templates (English and Spanish). Plain, honest, no vendor names, no income claims.
// Follow-ups 1–3 are DRAFT placeholders and stay off (FOLLOWUPS_ENABLED in ./config) until approved.
import type { Lang } from './config'
import { CLASS_TITLE } from './copy'

export type EmailKind = 'confirm' | 'ready' | 'reminder_1' | 'reminder_2' | 'followup_1' | 'followup_2' | 'followup_3'

export type EmailVars = {
  firstName: string
  watchUrl: string
  unsubUrl: string
  mailingAddress: string
  classReady: boolean
  workbookUrl: string | null
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))

type Body = { subject: string; paras: string[]; cta?: { label: string; url: string } }

function content(kind: EmailKind, lang: Lang, v: EmailVars): Body {
  const t = CLASS_TITLE[lang]
  const n = v.firstName
  if (lang === 'es') {
    switch (kind) {
      case 'confirm':
        return v.classReady
          ? { subject: `Tu lugar está apartado: ${t}`, paras: [`Hola ${n},`, `Ya tienes tu lugar en la clase gratis de Yakini Academy, "${t}". Dura menos de una hora y la puedes ver cuando quieras.`, 'Este es tu enlace personal:'], cta: { label: 'Ver la clase', url: v.watchUrl } }
          : { subject: `Tu lugar está apartado: ${t}`, paras: [`Hola ${n},`, `Ya tienes tu lugar en la clase gratis de Yakini Academy, "${t}".`, 'Estamos terminando el video de la clase. Guarda este enlace personal: lo va a reproducir en cuanto esté listo, y te avisaremos por correo ese día.'], cta: { label: 'Mi enlace de la clase', url: v.watchUrl } }
      case 'ready':
        return { subject: `Ya está lista tu clase: ${t}`, paras: [`Hola ${n},`, 'El video de la clase ya está listo. Dura menos de una hora; puedes pausarla y regresar cuando quieras.'], cta: { label: 'Ver la clase', url: v.watchUrl } }
      case 'reminder_1':
        return { subject: 'Tu clase te espera', paras: [`Hola ${n},`, `Tu lugar en "${t}" sigue apartado. Cuando tengas menos de una hora libre, aquí está tu enlace:`], cta: { label: 'Ver la clase', url: v.watchUrl } }
      case 'reminder_2':
        return { subject: 'Último recordatorio: tu clase gratis', paras: [`Hola ${n},`, 'Este es el último recordatorio que te enviamos sobre la clase. Tu enlace sigue funcionando cuando quieras verla.'], cta: { label: 'Ver la clase', url: v.watchUrl } }
      case 'followup_1':
        return { subject: '[BORRADOR] Una cosa para probar esta semana', paras: [`Hola ${n},`, 'Gracias por ver la clase. Esta semana, haz una lista de cada herramienta por la que pagas cada mes y marca cuáles guardan tu información: tus clientes, tus citas, tus cobros.', 'Esa lista es tu punto de partida.'] }
      case 'followup_2':
        return { subject: '[BORRADOR] Por qué empecé Yakini', paras: [`Hola ${n},`, '[Historia de Clarence pendiente: por qué empezó Yakini Digital, en sus palabras.]'] }
      case 'followup_3':
        return { subject: '[BORRADOR] El cuaderno de trabajo', paras: [`Hola ${n},`, 'Si quieres llevar lo de la clase a tu propio negocio, paso por paso, el cuaderno de trabajo te guía a tu ritmo.'], cta: v.workbookUrl ? { label: 'Ver el cuaderno de trabajo', url: v.workbookUrl } : undefined }
    }
  }
  switch (kind) {
    case 'confirm':
      return v.classReady
        ? { subject: `Your seat is saved: ${t}`, paras: [`Hi ${n},`, `You're signed up for the Yakini Academy free class, "${t}". It runs under an hour and you can watch it any time.`, 'Here is your personal link:'], cta: { label: 'Watch the class', url: v.watchUrl } }
        : { subject: `Your seat is saved: ${t}`, paras: [`Hi ${n},`, `You're signed up for the Yakini Academy free class, "${t}".`, "We're finishing the class video now. Keep this personal link: it will play the class as soon as it's live, and we'll email you that day."], cta: { label: 'My class link', url: v.watchUrl } }
    case 'ready':
      return { subject: `Your class is ready: ${t}`, paras: [`Hi ${n},`, 'The class video is live. It runs under an hour, and you can pause and come back whenever you like.'], cta: { label: 'Watch the class', url: v.watchUrl } }
    case 'reminder_1':
      return { subject: 'Your class is waiting', paras: [`Hi ${n},`, `Your seat for "${t}" is still saved. When you have under an hour free, here's your link:`], cta: { label: 'Watch the class', url: v.watchUrl } }
    case 'reminder_2':
      return { subject: 'Last reminder: your free class', paras: [`Hi ${n},`, "This is the last reminder we'll send about the class. Your link keeps working whenever you want to watch."], cta: { label: 'Watch the class', url: v.watchUrl } }
    case 'followup_1':
      return { subject: '[DRAFT] One thing to try this week', paras: [`Hi ${n},`, 'Thanks for watching the class. This week, list every tool you pay for each month and mark the ones that hold your information: your customers, your bookings, your payments.', "That list is your starting point."] }
    case 'followup_2':
      return { subject: '[DRAFT] Why I started Yakini', paras: [`Hi ${n},`, "[Clarence's story pending: why he started Yakini Digital, in his words.]"] }
    case 'followup_3':
      return { subject: '[DRAFT] The workbook', paras: [`Hi ${n},`, 'If you want to take the class into your own business step by step, the workbook walks you through it at your own pace.'], cta: v.workbookUrl ? { label: 'See the workbook', url: v.workbookUrl } : undefined }
  }
}

const FOOT: Record<Lang, { why: string; unsub: string; sign: string }> = {
  en: { why: 'You got this email because you signed up for the free class at yakini.digital.', unsub: 'Unsubscribe from class emails', sign: 'Clarence Kennedy, Yakini Digital' },
  es: { why: 'Recibes este correo porque te inscribiste en la clase gratis en yakini.digital.', unsub: 'Darte de baja de los correos de la clase', sign: 'Clarence Kennedy, Yakini Digital' },
}

export function buildEmail(kind: EmailKind, lang: Lang, v: EmailVars): { subject: string; html: string; text: string } {
  const b = content(kind, lang, v)
  const f = FOOT[lang]
  const paras = b.paras.map((p) => `<p style="margin:0 0 16px">${esc(p)}</p>`).join('')
  const cta = b.cta
    ? `<p style="margin:24px 0"><a href="${esc(b.cta.url)}" style="display:inline-block;background:#C8A84B;color:#0A0908;padding:14px 22px;text-decoration:none;font-weight:600">${esc(b.cta.label)}</a></p><p style="margin:0 0 16px;font-size:13px;color:#555;word-break:break-all">${esc(b.cta.url)}</p>`
    : ''
  const html = `<!doctype html><html lang="${lang}"><body style="margin:0;background:#F4F1EB"><div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:16px;line-height:1.6;color:#1a1a1a">`
    + `<p style="margin:0 0 24px;font-size:12px;letter-spacing:2px;color:#8a6f22">YAKINI ACADEMY</p>${paras}${cta}`
    + `<p style="margin:24px 0 0">${esc(f.sign)}</p>`
    + `<hr style="border:0;border-top:1px solid #ddd;margin:32px 0 16px"><p style="margin:0 0 8px;font-size:12px;color:#666">${esc(f.why)}</p>`
    + `<p style="margin:0 0 8px;font-size:12px;color:#666"><a href="${esc(v.unsubUrl)}" style="color:#666">${esc(f.unsub)}</a></p>`
    + `<p style="margin:0;font-size:12px;color:#666">${esc(v.mailingAddress)}</p></div></body></html>`
  const text = [...b.paras, ...(b.cta ? [`${b.cta.label}: ${b.cta.url}`] : []), f.sign, '—', f.why, `${f.unsub}: ${v.unsubUrl}`, v.mailingAddress].join('\n\n')
  return { subject: b.subject.replace(/[\r\n]+/g, ' ').slice(0, 200), html, text }
}
