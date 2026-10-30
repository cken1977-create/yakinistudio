// Customer-facing copy for the Yakini Academy free class, English and Spanish.
// Rules: no income claims, no vendor or tool names, never "AI-built", no referral talk.
// Items marked DRAFT are waiting on Clarence's approval (see the PR description).
import type { Lang } from './config'

export const CLASS_TITLE: Record<Lang, string> = {
  en: 'How to Build Something That Belongs to You',
  es: 'Cómo construir algo que te pertenezca',
}

/** Exact consent wording. Stored on each signup as shown (with the privacy link spelled out). */
export const EMAIL_CONSENT: Record<Lang, string> = {
  en: "By saving your seat you'll get the class link and follow-up emails from Yakini Digital. Unsubscribe anytime.",
  es: 'Al apartar tu lugar recibirás el enlace de la clase y correos de seguimiento de Yakini Digital. Puedes darte de baja cuando quieras.',
}
export const SMS_CONSENT: Record<Lang, string> = {
  en: 'Yes, text me class reminders and updates from Yakini Digital at this number. Up to 4 msgs/month. Msg & data rates may apply. Reply STOP to cancel, HELP for help. Not required to sign up or buy anything.',
  es: 'Sí, envíenme recordatorios y novedades de la clase de Yakini Digital por mensaje de texto a este número. Hasta 4 mensajes al mes. Pueden aplicar tarifas de mensajes y datos. Responde STOP para cancelar, HELP para ayuda. No es necesario para registrarte ni para comprar nada.',
}

export type PageCopy = {
  htmlTitle: string
  metaDescription: string
  eyebrow: string
  h1: string
  h1Accent: string
  sub: string
  facts: string[]
  videoLabel: string
  learnHeading: string
  learn: string[] // DRAFT
  whoHeading: string
  who: string
  bioHeading: string
  bio: string // DRAFT
  formHeading: string
  formSub: string
  fields: { name: string; email: string; phone: string; phoneHint: string; country: string; optional: string }
  button: string
  sending: string
  privacy: string
  thanksTitle: (name: string) => string
  thanksBodyReady: string
  thanksBodyPending: string
  thanksBodyNoEmail: string
  watchCta: string
  myPageCta: string
  errors: { name: string; email: string; phone: string; generic: string; slow: string; notOpen: string }
  faqHeading: string
  faq: { q: string; a: string }[]
  otherLang: { label: string; href: string; hreflang: Lang }
  footerNote: string
}

export const PAGE: Record<Lang, PageCopy> = {
  en: {
    htmlTitle: 'Yakini Academy Free Class · How to Build Something That Belongs to You',
    metaDescription: 'Stop renting your business. A free Yakini Academy class in English and Spanish, built by a real operator. Under an hour, watch any time.',
    eyebrow: 'YAKINI ACADEMY · FREE CLASS',
    h1: 'Stop renting',
    h1Accent: 'your business.',
    sub: 'Free class: How to Build Something That Belongs to You. Built by a real operator. Under an hour.',
    facts: ['Free', 'Under an hour', 'English & Spanish', 'Watch any time'],
    videoLabel: 'A 30-second hello from Clarence',
    learnHeading: "What you'll learn",
    learn: [
      'Where your monthly software bills really go, and which of those tools you could own instead of renting.',
      'What owning your systems looks like in practice: your customer list, your website, your booking and payments, under your name.',
      'One first step to move a piece of your business from rented to owned, at your own pace.',
    ],
    whoHeading: "Who it's for",
    who: "Small business owners, and people getting ready to start one, who are tired of paying every month for tools they'll never own.",
    bioHeading: 'Your teacher',
    bio: "Clarence Kennedy is the founder of Yakini Digital. He has run kitchens and businesses, and he got tired of watching good people rent their whole operation from somebody else. Now he helps owners set up systems that belong to them.",
    formHeading: 'Save your seat',
    formSub: "It's free. You'll get your personal class link by email.",
    fields: { name: 'First name', email: 'Email', phone: 'Phone', phoneHint: 'Include your country code if you are outside the US', country: 'Country', optional: 'optional' },
    button: 'Save my seat',
    sending: 'Saving your seat…',
    privacy: 'Privacy',
    thanksTitle: (n) => `You're in, ${n}.`,
    thanksBodyReady: 'Your class link is on its way to your inbox, and you can start right now:',
    thanksBodyPending: "Your seat is saved and your class link is on its way to your inbox. The class video is being finished now. Your link will play it as soon as it's live, and we'll email you when it is.",
    thanksBodyNoEmail: "Your seat is saved. Open your class page below and bookmark it: it's your personal link to the class.",
    watchCta: 'Watch the class',
    myPageCta: 'Open my class page',
    errors: {
      name: 'Please add your first name.',
      email: 'Please check your email address.',
      phone: "That phone number doesn't look right. Include your country code, or leave it blank.",
      generic: 'Something went wrong saving your seat. Please try again.',
      slow: 'Too many tries from this connection. Please wait a few minutes and try again.',
      notOpen: "Signups open very soon. We couldn't save your seat yet, so please check back shortly.",
    },
    faqHeading: 'Questions',
    faq: [
      { q: 'How long is the class?', a: 'Under an hour. It is recorded, so you can watch it any time, pause it, and come back.' },
      { q: 'Is it really free?', a: 'Yes. No card, no catch. You get the class and a few follow-up emails, and you can unsubscribe from those any time.' },
      { q: 'What language is it in?', a: 'There is an English class and a Spanish class. This page signs you up for the English one. ¿Prefieres español? Use the link at the top.' },
    ],
    otherLang: { label: 'Español', href: '/clase', hreflang: 'es' },
    footerNote: 'Yakini Academy is the class and course area of Yakini Digital.',
  },
  es: {
    htmlTitle: 'Clase gratis de Yakini Academy · Cómo construir algo que te pertenezca',
    metaDescription: 'Deja de rentar tu negocio. Una clase gratis de Yakini Academy en inglés y español, de alguien que de verdad ha manejado un negocio. Menos de una hora, mírala cuando quieras.',
    eyebrow: 'YAKINI ACADEMY · CLASE GRATIS',
    h1: 'Deja de rentar',
    h1Accent: 'tu negocio.',
    sub: 'Clase gratis: Cómo construir algo que te pertenezca. La da alguien que de verdad ha manejado un negocio. Menos de una hora.',
    facts: ['Gratis', 'Menos de una hora', 'Inglés y español', 'Mírala cuando quieras'],
    videoLabel: 'Un saludo de 30 segundos de Clarence',
    learnHeading: 'Lo que vas a aprender',
    learn: [
      'A dónde se van de verdad tus pagos mensuales de software, y cuáles de esas herramientas podrías tener como tuyas en lugar de rentarlas.',
      'Cómo se ve en la práctica ser dueño de tus sistemas: tu lista de clientes, tu sitio web, tus citas y tus cobros, a tu nombre.',
      'Un primer paso para pasar una parte de tu negocio de rentada a propia, a tu propio ritmo.',
    ],
    whoHeading: 'Para quién es',
    who: 'Para dueños de pequeños negocios, y para quienes se preparan para empezar uno, que ya se cansaron de pagar cada mes por herramientas que nunca van a ser suyas.',
    bioHeading: 'Tu maestro',
    bio: 'Clarence Kennedy es el fundador de Yakini Digital. Ha manejado cocinas y negocios, y se cansó de ver a gente buena rentando todo su negocio a alguien más. Hoy ayuda a dueños de negocios a montar sistemas que les pertenecen.',
    formHeading: 'Aparta tu lugar',
    formSub: 'Es gratis. Te enviaremos tu enlace personal de la clase por correo.',
    fields: { name: 'Nombre', email: 'Correo electrónico', phone: 'Teléfono', phoneHint: 'Incluye la clave de tu país si no estás en EE. UU.', country: 'País', optional: 'opcional' },
    button: 'Apartar mi lugar',
    sending: 'Apartando tu lugar…',
    privacy: 'Privacidad',
    thanksTitle: (n) => `¡Listo, ${n}!`,
    thanksBodyReady: 'El enlace de tu clase va camino a tu correo, y puedes empezar ahora mismo:',
    thanksBodyPending: 'Tu lugar está apartado y el enlace de tu clase va camino a tu correo. Estamos terminando el video de la clase. Tu enlace lo va a reproducir en cuanto esté listo, y te avisaremos por correo.',
    thanksBodyNoEmail: 'Tu lugar está apartado. Abre tu página de la clase aquí abajo y guárdala en favoritos: es tu enlace personal a la clase.',
    watchCta: 'Ver la clase',
    myPageCta: 'Abrir mi página de la clase',
    errors: {
      name: 'Escribe tu nombre, por favor.',
      email: 'Revisa tu correo electrónico, por favor.',
      phone: 'Ese número no se ve bien. Incluye la clave de tu país o déjalo en blanco.',
      generic: 'Algo salió mal al apartar tu lugar. Inténtalo de nuevo, por favor.',
      slow: 'Demasiados intentos desde esta conexión. Espera unos minutos e inténtalo de nuevo.',
      notOpen: 'Las inscripciones abren muy pronto. Todavía no pudimos apartar tu lugar; vuelve en un rato, por favor.',
    },
    faqHeading: 'Preguntas',
    faq: [
      { q: '¿Cuánto dura la clase?', a: 'Menos de una hora. Está grabada, así que puedes verla cuando quieras, pausarla y regresar.' },
      { q: '¿De verdad es gratis?', a: 'Sí. Sin tarjeta y sin trucos. Recibes la clase y algunos correos de seguimiento, y puedes darte de baja de esos correos cuando quieras.' },
      { q: '¿En qué idioma es?', a: 'Hay una clase en español y otra en inglés. Esta página te inscribe en la de español. Prefer English? Use the link at the top.' },
    ],
    otherLang: { label: 'English', href: '/class', hreflang: 'en' },
    footerNote: 'Yakini Academy es el área de clases y cursos de Yakini Digital.',
  },
}

export const WATCH: Record<Lang, {
  htmlTitle: string; eyebrow: string; hello: (n: string) => string; comingTitle: string; comingBody: string
  invalidTitle: string; invalidBody: string; signupCta: string; nextTitle: string; nextBody: string; nextCta: string
  watchedNote: string; unsubscribe: string
}> = {
  en: {
    htmlTitle: 'Your class · Yakini Academy',
    eyebrow: 'YAKINI ACADEMY · YOUR CLASS',
    hello: (n) => `Welcome, ${n}.`,
    comingTitle: 'Class video coming soon',
    comingBody: "Your seat is saved. We're finishing the class video now. This same link will play it as soon as it's live, and we'll email you the moment it is. Nothing else to do.",
    invalidTitle: "We couldn't find that class link",
    invalidBody: 'The link may be incomplete. Sign up again with the same email and we will send you a fresh one.',
    signupCta: 'Get my class link',
    nextTitle: 'Ready for the next step?',
    nextBody: 'The workbook walks you through it at your own pace.',
    nextCta: 'See the workbook',
    watchedNote: 'Thanks for watching.',
    unsubscribe: 'Stop class emails',
  },
  es: {
    htmlTitle: 'Tu clase · Yakini Academy',
    eyebrow: 'YAKINI ACADEMY · TU CLASE',
    hello: (n) => `Hola, ${n}.`,
    comingTitle: 'El video de la clase viene pronto',
    comingBody: 'Tu lugar está apartado. Estamos terminando el video de la clase. Este mismo enlace lo va a reproducir en cuanto esté listo, y te avisaremos por correo. No tienes que hacer nada más.',
    invalidTitle: 'No encontramos ese enlace de la clase',
    invalidBody: 'Puede que el enlace esté incompleto. Inscríbete otra vez con el mismo correo y te enviaremos uno nuevo.',
    signupCta: 'Quiero mi enlace',
    nextTitle: '¿Quieres dar el siguiente paso?',
    nextBody: 'El cuaderno de trabajo te guía a tu propio ritmo.',
    nextCta: 'Ver el cuaderno de trabajo',
    watchedNote: 'Gracias por ver la clase.',
    unsubscribe: 'Dejar de recibir correos de la clase',
  },
}

export const UNSUB: Record<Lang, {
  htmlTitle: string; title: string; body: string; button: string; working: string; doneTitle: string; doneBody: string
  invalidTitle: string; invalidBody: string; error: string; back: string
}> = {
  en: {
    htmlTitle: 'Unsubscribe · Yakini Academy',
    title: 'Stop class emails?',
    body: 'You will stop getting emails about the Yakini Academy free class. Your class link keeps working.',
    button: 'Unsubscribe',
    working: 'Unsubscribing…',
    doneTitle: "You're unsubscribed.",
    doneBody: "We won't email you about this class again, and any scheduled emails are canceled. If you change your mind, sign up again on the class page.",
    invalidTitle: "We couldn't find that link",
    invalidBody: 'Reply to any of our emails or write to hello@yakini.digital and we will remove you by hand.',
    error: 'Something went wrong. Please try again, or write to hello@yakini.digital.',
    back: 'Back to the class page',
  },
  es: {
    htmlTitle: 'Darse de baja · Yakini Academy',
    title: '¿Dejar de recibir correos de la clase?',
    body: 'Ya no recibirás correos sobre la clase gratis de Yakini Academy. Tu enlace de la clase sigue funcionando.',
    button: 'Darme de baja',
    working: 'Dando de baja…',
    doneTitle: 'Listo, te diste de baja.',
    doneBody: 'No te volveremos a escribir sobre esta clase, y cancelamos los correos programados. Si cambias de opinión, inscríbete otra vez en la página de la clase.',
    invalidTitle: 'No encontramos ese enlace',
    invalidBody: 'Responde a cualquiera de nuestros correos o escribe a hello@yakini.digital y te daremos de baja a mano.',
    error: 'Algo salió mal. Inténtalo de nuevo o escribe a hello@yakini.digital.',
    back: 'Volver a la página de la clase',
  },
}
