// Class email templates (English and Spanish). Plain, honest, no vendor names, no income claims.
// Follow-up 2 (Day 4) is approved copy; follow-ups 1 and 3 are still DRAFT. All three stay off (FOLLOWUPS_ENABLED in ./config) until approved.
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

type Body = { subject: string; paras: string[]; cta?: { label: string; url: string }; noSign?: boolean }

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
        // Spanish version of Clarence's approved Day 4 email (Oct 30). Needs a native speaker's read.
        return { subject: 'Por qué empecé Yakini', noSign: true, paras: ["He tenido restaurantes, clubes nocturnos y más. Lo que aprendí es que, cuando las cosas no salen como esperas, todo se puede perder. A la gente que maneja tu sitio web, tus datos y tus sistemas no le importa lo que estés pasando. Simplemente te cortan el servicio y lo pierdes todo.", "Pasa lo mismo con el negocio en sí: el dueño del local y todos los demás que te están rentando tu negocio. No todo el mundo puede comprar su propio edificio. Pero sí puedes poner las cosas en orden para entender tu negocio y no depender solo de esperanzas, sueños y oraciones.", "Por eso creé Yakini Digital: infraestructura digital para dueños de negocios, sobre todo para quienes no tienen el dinero de una gran empresa, la tecnología de una gran empresa ni la formación de una franquicia. Quiero ayudarte a entender cada parte de manejar tu negocio, desde el local hasta las operaciones y el personal, y a ser dueño de los sistemas que lo hacen funcionar.", "– Clarence"] }
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
      // Approved by Clarence Oct 30, 2026: use exactly as written. Signed by him, so no standard sign-off.
      return { subject: 'Why I started Yakini', noSign: true, paras: ["I've owned restaurants, nightclubs and more. What I learned is that when things don't go your way, it can all go away. The people who run your website, your data and your systems don't care what you're going through. They just cut you off, and you lose everything.", "It's the same with the business itself: the landlord, and everyone else who's renting you your business. Not everybody can buy their own building. But you can put things in place so you understand your business better than hopes, dreams and prayers.", "That's why I created Yakini Digital: digital infrastructure for business owners, especially those who don't have big-company money, big-company tech, or a franchise education. I want to help you understand every part of running your business, from the building to operations to staff, and own the systems that run it.", "– Clarence"] }
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
    + (b.noSign ? '' : `<p style="margin:24px 0 0">${esc(f.sign)}</p>`)
    + `<hr style="border:0;border-top:1px solid #ddd;margin:32px 0 16px"><p style="margin:0 0 8px;font-size:12px;color:#666">${esc(f.why)}</p>`
    + `<p style="margin:0 0 8px;font-size:12px;color:#666"><a href="${esc(v.unsubUrl)}" style="color:#666">${esc(f.unsub)}</a></p>`
    + `<p style="margin:0;font-size:12px;color:#666">${esc(v.mailingAddress)}</p></div></body></html>`
  const text = [...b.paras, ...(b.cta ? [`${b.cta.label}: ${b.cta.url}`] : []), ...(b.noSign ? [] : [f.sign]), '—', f.why, `${f.unsub}: ${v.unsubUrl}`, v.mailingAddress].join('\n\n')
  return { subject: b.subject.replace(/[\r\n]+/g, ' ').slice(0, 200), html, text }
}
