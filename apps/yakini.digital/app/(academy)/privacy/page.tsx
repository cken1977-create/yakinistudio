import type { Metadata } from 'next'
import { AcademyShell } from '@/components/academy/AcademyShell'
import type { Lang } from '@/lib/academy/config'

// Privacy notice (English and Spanish). Plain language; no vendor names.
// The postal address is read from the server setting CLASS_MAILING_ADDRESS (not stored in code).

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ lang?: string }> }): Promise<Metadata> {
  const es = (await searchParams).lang === 'es'
  return {
    title: es ? 'Aviso de privacidad · Yakini Digital' : 'Privacy · Yakini Digital',
    description: es ? 'Qué información guardamos, por qué y cómo puedes darte de baja o pedir que la borremos.' : 'What we collect, why, and how to unsubscribe or ask us to delete it.',
    alternates: { canonical: es ? '/privacy?lang=es' : '/privacy', languages: { en: '/privacy', es: '/privacy?lang=es' } },
  }
}

const UPDATED = { en: 'Last updated October 30, 2026', es: 'Última actualización: 30 de octubre de 2026' }

type Section = { h: string; p?: string[]; li?: string[] }

const TEXT: Record<Lang, { title: string; intro: string; sections: Section[] }> = {
  en: {
    title: 'Privacy',
    intro: 'This notice explains what Yakini Digital collects when you sign up for a Yakini Academy class or contact us on yakini.digital, why we keep it, and the choices you have. We keep it short and plain on purpose.',
    sections: [
      { h: 'What we collect', li: [
        'What you type: your first name, email, and, if you choose, your phone number and country.',
        'Consent records: the exact consent wording you saw, the page, the date and time, a one-way scrambled (hashed) version of your internet address (we do not keep the address itself), and your browser type.',
        'How you found us: the link or ad tag you came from (for example, an Instagram bio link) and the page that sent you.',
        'Your time zone, so reminders arrive at a reasonable hour.',
        'Class activity: whether you started and finished the class video, and which of our emails were sent to you.',
      ] },
      { h: 'Why we use it', li: [
        'To send your class link and the emails you signed up for.',
        'To understand which links and ads bring people to the class, so we can spend less on what does not work.',
        'To keep records that show you agreed to hear from us.',
      ] },
      { h: 'Text messages', p: ['Giving a phone number is optional. We only text you if you check the separate text-message box, and checking it is never required to sign up or buy anything. Up to 4 messages a month; message and data rates may apply. Reply STOP to cancel or HELP for help. Today we collect this choice only and do not send texts yet.'] },
      { h: 'Who we share it with', p: ['We do not sell or rent your information. We share it only with the service providers that host our website, store our data and deliver our email, and only so they can do that work for us. We may also share it if the law requires it.'] },
      { h: 'How long we keep it', p: ['We keep class signups while the class and its follow-up emails are running, and for up to 3 years after your last activity so we can honor your choices and show consent records. Ask us and we will delete it sooner.'] },
      { h: 'Your choices', li: [
        'Unsubscribe: every email has a one-click unsubscribe link. It takes effect right away and cancels any emails already scheduled.',
        'See, correct or delete your information: write to hello@yakini.digital from the address you signed up with. We answer within 30 days.',
        'If you live in the European Union, the United Kingdom, Canada or another place with privacy rights, you can use those rights the same way, including withdrawing consent at any time and complaining to your local data protection authority.',
      ] },
      { h: 'Security', p: ['Your information is stored in a private database that only our own servers can reach, over encrypted connections. No method is perfect, but we limit who and what can see your data.'] },
      { h: 'Children', p: ['Our classes are meant for adults. We do not knowingly collect information from anyone under 16.'] },
      { h: 'Changes and contact', p: ['If we change this notice we will update the date above. Questions: hello@yakini.digital.'] },
    ],
  },
  es: {
    title: 'Aviso de privacidad',
    intro: 'Este aviso explica qué información guarda Yakini Digital cuando te inscribes en una clase de Yakini Academy o nos escribes en yakini.digital, por qué la guardamos y qué opciones tienes. Lo escribimos corto y claro a propósito.',
    sections: [
      { h: 'Qué información guardamos', li: [
        'Lo que escribes: tu nombre, tu correo y, si quieres, tu teléfono y tu país.',
        'Registro de tu consentimiento: el texto exacto que viste, la página, la fecha y la hora, una versión cifrada en un solo sentido (hash) de tu dirección de internet (no guardamos la dirección misma) y el tipo de navegador.',
        'Cómo nos encontraste: el enlace o la etiqueta del anuncio de donde llegaste (por ejemplo, el enlace de un perfil de Instagram) y la página que te envió.',
        'Tu zona horaria, para que los recordatorios lleguen a una hora razonable.',
        'Actividad en la clase: si empezaste y terminaste el video, y cuáles de nuestros correos se te enviaron.',
      ] },
      { h: 'Para qué la usamos', li: [
        'Para enviarte el enlace de la clase y los correos que pediste.',
        'Para entender qué enlaces y anuncios traen gente a la clase, y así gastar menos en lo que no funciona.',
        'Para guardar el registro de que aceptaste recibir nuestros mensajes.',
      ] },
      { h: 'Mensajes de texto', p: ['Dar tu teléfono es opcional. Solo te enviaríamos mensajes de texto si marcas la casilla aparte para eso, y marcarla nunca es necesario para inscribirte ni para comprar nada. Hasta 4 mensajes al mes; pueden aplicar tarifas de mensajes y datos. Responde STOP para cancelar o HELP para ayuda. Por ahora solo guardamos tu elección y todavía no enviamos mensajes de texto.'] },
      { h: 'Con quién la compartimos', p: ['No vendemos ni rentamos tu información. Solo la compartimos con los proveedores que alojan nuestro sitio, guardan nuestros datos y entregan nuestros correos, y solo para que hagan ese trabajo para nosotros. También podríamos compartirla si la ley lo exige.'] },
      { h: 'Cuánto tiempo la guardamos', p: ['Guardamos las inscripciones mientras la clase y sus correos de seguimiento estén activos, y hasta 3 años después de tu última actividad para poder respetar tus decisiones y mostrar el registro de tu consentimiento. Si nos lo pides, la borramos antes.'] },
      { h: 'Tus opciones', li: [
        'Darte de baja: cada correo trae un enlace para darte de baja con un clic. Funciona de inmediato y cancela los correos que ya estaban programados.',
        'Ver, corregir o borrar tu información: escribe a hello@yakini.digital desde el correo con el que te inscribiste. Te respondemos en un máximo de 30 días.',
        'Si vives en la Unión Europea, el Reino Unido, Canadá u otro lugar con derechos de privacidad, puedes ejercerlos de la misma manera, incluido retirar tu consentimiento en cualquier momento y presentar una queja ante la autoridad de protección de datos de tu país.',
      ] },
      { h: 'Seguridad', p: ['Tu información se guarda en una base de datos privada a la que solo llegan nuestros propios servidores, por conexiones cifradas. Ningún método es perfecto, pero limitamos quién y qué puede ver tus datos.'] },
      { h: 'Menores de edad', p: ['Nuestras clases son para personas adultas. No recopilamos a sabiendas información de menores de 16 años.'] },
      { h: 'Cambios y contacto', p: ['Si cambiamos este aviso, actualizaremos la fecha de arriba. Preguntas: hello@yakini.digital.'] },
    ],
  },
}

export default async function PrivacyPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const lang: Lang = (await searchParams).lang === 'es' ? 'es' : 'en'
  const t = TEXT[lang]
  const address = process.env.CLASS_MAILING_ADDRESS?.trim()
  return (
    <AcademyShell lang={lang} otherLangHref={lang === 'es' ? '/privacy' : '/privacy?lang=es'}>
      <main className="ya-main">
        <article className="ya-narrow ya-legal">
          <h1>{t.title}</h1>
          <p className="ya-updated">{UPDATED[lang]}</p>
          <p>{t.intro}</p>
          {t.sections.map((s) => (
            <section key={s.h}>
              <h2>{s.h}</h2>
              {s.p?.map((x) => <p key={x}>{x}</p>)}
              {s.li && <ul>{s.li.map((x) => <li key={x}>{x}</li>)}</ul>}
            </section>
          ))}
          <p style={{ marginTop: 24 }}>Yakini Digital · hello@yakini.digital{address ? ` · ${address}` : ''}</p>
        </article>
      </main>
    </AcademyShell>
  )
}
