// Yakini Academy home + course page copy. DRAFT for Clarence's approval (see PR).
// Theme (Clarence, Oct 30): help small business owners and people with a business idea
// avoid the mistakes most new owners make. No income claims, no tech vendor names,
// never "AI-built", no referral talk.
import type { AcademyLocale } from './locales'

export type HomeCopy = {
  metaTitle: string; metaDescription: string
  nav: { courses: string; how: string; orgs: string; faq: string; freeClass: string; language: string }
  eyebrow: string; h1: string; h1Accent: string; sub: string; support: string; ctaPrimary: string; ctaSecondary: string; chips: string[]
  free: { badge: string; title: string; body: string; meta: string; cta: string; videoAlt: string }
  mistakes: { eyebrow: string; title: string; sub: string; items: { t: string; b: string }[] }
  catalog: { eyebrow: string; title: string; sub: string; comingSoon: string; pricingSoon: string; free: string; waitlist: string; preview: string; startFree: string; waitlistNote: string }
  how: { eyebrow: string; title: string; steps: { t: string; b: string }[] }
  orgs: {
    eyebrow: string; title: string; sub: string; points: { t: string; b: string }[]
    form: { title: string; org: string; name: string; email: string; type: string; types: string[]; people: string; language: string; message: string; submit: string; note: string; done: string; required: string }
  }
  faqTitle: string; faq: { q: string; a: string }[]
  footer: string
  course: { back: string; status: string; pricing: string; selfPaced: string; modules: string; learn: string; outline: string; who: string; languages: string; langRows: { l: string; s: string }[]; instructor: string; bio: string; waitlist: string; waitlistNote: string; startFree: string; draftOutline: string; module: string }
}

export const HOME: Record<AcademyLocale, HomeCopy> = {
  en: {
    metaTitle: 'Yakini Academy · Thinking about starting a business?',
    metaDescription: 'Learn to set up your business right, step by step, and skip the costly mistakes most new owners make. Self-paced courses in English and Spanish, built by a real operator.',
    nav: { courses: 'Courses', how: 'How it works', orgs: 'For organizations', faq: 'FAQ', freeClass: 'Free class', language: 'Language' },
    eyebrow: 'YAKINI ACADEMY',
    h1: 'Thinking about starting',
    h1Accent: 'a business?',
    sub: 'Learn to set it up right, step by step, and skip the costly mistakes most new owners make. Practical lessons on structure, space, selling, money and the systems that run it all, so you can do more with less.',
    support: 'Built by a real operator.',
    ctaPrimary: 'Start with the free class',
    ctaSecondary: 'See the courses',
    chips: ['Self-paced', 'Step by step', 'English & Spanish', 'For new and growing owners'],
    free: {
      badge: 'FREE CLASS · OPEN NOW',
      title: 'Stop Renting Your Business',
      body: 'How to Build Something That Belongs to You. The best place to start: what it means to own your business instead of renting it, and the first step to get there.',
      meta: 'Free · Under an hour · English & Spanish · Watch any time',
      cta: 'Save my free seat',
      videoAlt: 'Clarence introduces the free class',
    },
    mistakes: {
      eyebrow: 'COMMON MISTAKES WE HELP YOU AVOID', title: 'Most new owners learn these the hard way. You don\'t have to.',
      sub: 'Each one costs time, money or sleep. The courses show you how to spot them early and what to do instead.',
      items: [
        { t: 'Signing a big lease too early', b: 'Locking into rent before you know what you need, when a food truck, shared kitchen or small space would do.' },
        { t: 'Picking the wrong business structure', b: 'Starting without the right setup, licenses and permits, then paying to fix it later.' },
        { t: 'Renting systems you\'ll never own', b: 'Building your business on tools that can raise prices or cut you off, with your customer list inside.' },
        { t: 'Mixing personal and business money', b: 'One account for everything, so you can\'t see your real numbers or plan for slow months.' },
        { t: 'Waiting for customers to find you', b: 'No plan to find, follow up with and close the people who need what you sell.' },
        { t: 'Paying for more than you need', b: 'Expensive software, staff and space before the business is ready for them.' },
      ],
    },
    catalog: {
      eyebrow: 'COURSES', title: 'The course catalog', sub: 'Short, practical courses you can finish and put to work. Each one opens in English and Spanish.',
      comingSoon: 'Coming soon', pricingSoon: 'Pricing soon', free: 'Free · Open now', waitlist: 'Join the waitlist', preview: 'Preview the course page',
      startFree: 'Start free', waitlistNote: 'The waitlist is the free class signup: save your free seat and we\'ll email you when each course opens.',
    },
    how: {
      eyebrow: 'HOW IT WORKS', title: 'Learn the way owners actually have time to learn.',
      steps: [
        { t: 'At your own pace', b: 'Short lessons you can watch any time, on your phone or computer. Pause and pick up where you left off.' },
        { t: 'Step by step', b: 'Every lesson ends with one small thing to do in your own business, so you build as you learn.' },
        { t: 'In your language', b: 'Courses open in English and Spanish, with more languages planned.' },
        { t: 'From a real operator', b: 'Taught from years of running kitchens and businesses, not from a textbook.' },
      ],
    },
    orgs: {
      eyebrow: 'FOR ORGANIZATIONS AND NONPROFITS', title: 'Sponsor seats or run a cohort.',
      sub: 'Nonprofits, workforce programs, small business centers and community groups can send the people they serve to Yakini Academy.',
      points: [
        { t: 'Sponsored seats', b: 'Cover course seats for your participants, so cost is never the reason someone can\'t learn.' },
        { t: 'Cohorts', b: 'Start a group together on the same course, with a shared start date and a pace that fits your program.' },
        { t: 'English and Spanish', b: 'Serve the people in your community in the language they think in.' },
        { t: 'Progress updates', b: 'Simple updates on who started and who finished, for your program and your funders.' },
      ],
      form: {
        title: 'Tell us about your program', org: 'Organization', name: 'Your name', email: 'Email', type: 'Type of organization',
        types: ['Nonprofit', 'Workforce program', 'Small business center', 'School or college', 'Government agency', 'Other'],
        people: 'About how many people?', language: 'Languages needed', message: 'Anything else we should know?', submit: 'Send', required: 'Please fill in your organization, name and a valid email.',
        note: 'This opens an email to hello@yakini.digital with your answers filled in. Nothing is saved on this page.',
        done: 'Your email app should open with your message ready to send. If it didn\'t, write to hello@yakini.digital.',
      },
    },
    faqTitle: 'Questions',
    faq: [
      { q: 'I only have an idea. Is this for me?', a: 'Yes. The Academy is made for people thinking about starting a business as much as for owners already running one.' },
      { q: 'Is Yakini Academy free?', a: 'The intro class is free. Courses will be paid, and pricing is coming soon. Organizations can sponsor seats for the people they serve.' },
      { q: 'What languages are the courses in?', a: 'English and Spanish. More languages are planned.' },
      { q: 'Do I need to be good with technology?', a: 'No. Lessons are made for busy owners, step by step, in plain words.' },
      { q: 'When do the courses open?', a: 'Soon. Save your seat in the free class and we\'ll email you as each course opens.' },
      { q: 'Can my organization send people?', a: 'Yes. See "For organizations and nonprofits" above and tell us about your program.' },
    ],
    footer: 'Yakini Academy is the class and course area of Yakini Digital.',
    course: {
      back: 'All courses', status: 'Coming soon', pricing: 'Pricing soon', selfPaced: 'Self-paced', modules: 'modules', learn: 'What you\'ll learn',
      outline: 'Course outline', who: 'Who it\'s for', languages: 'Languages',
      langRows: [{ l: 'English', s: 'At launch' }, { l: 'Español', s: 'At launch' }, { l: 'More languages', s: 'Planned' }],
      instructor: 'Your instructor',
      bio: 'Clarence Kennedy is the founder of Yakini Digital. He has run kitchens and businesses, and he got tired of watching good people rent their whole operation from somebody else. Now he helps owners set up systems that belong to them.',
      waitlist: 'Join the waitlist', waitlistNote: 'Save your free seat in the intro class and we\'ll email you when this course opens.', startFree: 'Start with the free class',
      draftOutline: 'Sample outline. Lessons may change before launch.', module: 'Module',
    },
  },
  es: {
    metaTitle: 'Yakini Academy · ¿Estás pensando en abrir un negocio?',
    metaDescription: 'Aprende a arrancar tu negocio bien, paso a paso, y evita los errores caros que cometen la mayoría de los dueños nuevos. Cursos a tu ritmo en español e inglés, de alguien que de verdad ha manejado un negocio.',
    nav: { courses: 'Cursos', how: 'Cómo funciona', orgs: 'Para organizaciones', faq: 'Preguntas', freeClass: 'Clase gratis', language: 'Idioma' },
    eyebrow: 'YAKINI ACADEMY',
    h1: '¿Estás pensando en',
    h1Accent: 'abrir un negocio?',
    sub: 'Aprende a arrancarlo bien, paso a paso, y evita los errores caros que cometen la mayoría de los dueños nuevos. Lecciones prácticas sobre la estructura, el local, las ventas, el dinero y los sistemas que lo hacen funcionar todo, para hacer más con menos.',
    support: 'Hecha por alguien que de verdad ha manejado un negocio.',
    ctaPrimary: 'Empieza con la clase gratis',
    ctaSecondary: 'Ver los cursos',
    chips: ['A tu ritmo', 'Paso a paso', 'Español e inglés', 'Para dueños nuevos y en crecimiento'],
    free: {
      badge: 'CLASE GRATIS · YA DISPONIBLE',
      title: 'Deja de rentar tu negocio',
      body: 'Cómo construir algo que te pertenezca. El mejor lugar para empezar: qué significa ser dueño de tu negocio en lugar de rentarlo, y el primer paso para lograrlo.',
      meta: 'Gratis · Menos de una hora · Español e inglés · Mírala cuando quieras',
      cta: 'Apartar mi lugar gratis',
      videoAlt: 'Clarence presenta la clase gratis',
    },
    mistakes: {
      eyebrow: 'ERRORES COMUNES QUE TE AYUDAMOS A EVITAR', title: 'La mayoría de los dueños nuevos los aprenden por las malas. Tú no tienes que hacerlo.',
      sub: 'Cada uno cuesta tiempo, dinero o sueño. Los cursos te enseñan a verlos a tiempo y qué hacer en su lugar.',
      items: [
        { t: 'Firmar un contrato de renta grande demasiado pronto', b: 'Amarrarte a una renta antes de saber lo que necesitas, cuando un food truck, una cocina compartida o un espacio pequeño te bastaría.' },
        { t: 'Elegir la estructura equivocada', b: 'Arrancar sin la estructura, las licencias y los permisos correctos, y luego pagar para arreglarlo.' },
        { t: 'Rentar sistemas que nunca serán tuyos', b: 'Montar tu negocio sobre herramientas que pueden subir sus precios o cortarte el servicio, con tu lista de clientes adentro.' },
        { t: 'Mezclar el dinero personal con el del negocio', b: 'Una sola cuenta para todo, así no puedes ver tus números reales ni prepararte para los meses lentos.' },
        { t: 'Esperar a que los clientes te encuentren', b: 'No tener un plan para encontrar, dar seguimiento y cerrar la venta con quienes necesitan lo que vendes.' },
        { t: 'Pagar por más de lo que necesitas', b: 'Software, personal y espacio caros antes de que el negocio esté listo para ellos.' },
      ],
    },
    catalog: {
      eyebrow: 'CURSOS', title: 'El catálogo de cursos', sub: 'Cursos cortos y prácticos que puedes terminar y poner a trabajar. Cada uno abre en español y en inglés.',
      comingSoon: 'Próximamente', pricingSoon: 'Precio próximamente', free: 'Gratis · Ya disponible', waitlist: 'Unirme a la lista de espera', preview: 'Ver cómo será el curso',
      startFree: 'Empezar gratis', waitlistNote: 'La lista de espera es la inscripción a la clase gratis: aparta tu lugar y te avisaremos por correo cuando abra cada curso.',
    },
    how: {
      eyebrow: 'CÓMO FUNCIONA', title: 'Aprende al ritmo que de verdad le alcanza a un dueño de negocio.',
      steps: [
        { t: 'A tu ritmo', b: 'Lecciones cortas que puedes ver cuando quieras, en tu teléfono o tu computadora. Pausa y sigue donde te quedaste.' },
        { t: 'Paso a paso', b: 'Cada lección termina con una tarea pequeña para tu propio negocio, para que construyas mientras aprendes.' },
        { t: 'En tu idioma', b: 'Los cursos abren en español y en inglés, y tenemos planeados más idiomas.' },
        { t: 'De alguien con experiencia real', b: 'Lo que se enseña viene de años de manejar cocinas y negocios, no de un libro de texto.' },
      ],
    },
    orgs: {
      eyebrow: 'PARA ORGANIZACIONES Y ORGANIZACIONES SIN FINES DE LUCRO', title: 'Patrocina lugares o arma un grupo.',
      sub: 'Organizaciones sin fines de lucro, programas de empleo, centros de apoyo a pequeños negocios y grupos comunitarios pueden enviar a Yakini Academy a las personas que atienden.',
      points: [
        { t: 'Lugares patrocinados', b: 'Cubre los lugares en los cursos para tus participantes, para que el costo nunca sea la razón por la que alguien no aprende.' },
        { t: 'Grupos', b: 'Arranca un grupo en el mismo curso, con una fecha de inicio compartida y un ritmo que se ajuste a tu programa.' },
        { t: 'Español e inglés', b: 'Atiende a tu comunidad en el idioma en el que piensa.' },
        { t: 'Avances', b: 'Reportes sencillos de quién empezó y quién terminó, para tu programa y para quienes lo financian.' },
      ],
      form: {
        title: 'Cuéntanos de tu programa', org: 'Organización', name: 'Tu nombre', email: 'Correo electrónico', type: 'Tipo de organización',
        types: ['Organización sin fines de lucro', 'Programa de empleo', 'Centro de apoyo a pequeños negocios', 'Escuela o colegio', 'Agencia de gobierno', 'Otro'],
        people: '¿Para cuántas personas, más o menos?', language: 'Idiomas que necesitas', message: '¿Algo más que debamos saber?', submit: 'Enviar', required: 'Escribe tu organización, tu nombre y un correo válido, por favor.',
        note: 'Esto abre un correo a hello@yakini.digital con tus respuestas. En esta página no se guarda nada.',
        done: 'Tu aplicación de correo debería abrirse con tu mensaje listo para enviar. Si no se abrió, escribe a hello@yakini.digital.',
      },
    },
    faqTitle: 'Preguntas',
    faq: [
      { q: 'Solo tengo una idea. ¿Esto es para mí?', a: 'Sí. La Academia está hecha tanto para quienes están pensando en abrir un negocio como para quienes ya tienen uno.' },
      { q: '¿Yakini Academy es gratis?', a: 'La clase de introducción es gratis. Los cursos tendrán costo y el precio se anunciará pronto. Las organizaciones pueden patrocinar lugares para las personas que atienden.' },
      { q: '¿En qué idiomas son los cursos?', a: 'En español y en inglés. Tenemos planeados más idiomas.' },
      { q: '¿Necesito saber mucho de tecnología?', a: 'No. Las lecciones están hechas para dueños ocupados, paso a paso y con palabras sencillas.' },
      { q: '¿Cuándo abren los cursos?', a: 'Pronto. Aparta tu lugar en la clase gratis y te avisaremos por correo cuando abra cada curso.' },
      { q: '¿Mi organización puede enviar personas?', a: 'Sí. Mira la sección "Para organizaciones" y cuéntanos de tu programa.' },
    ],
    footer: 'Yakini Academy es el área de clases y cursos de Yakini Digital.',
    course: {
      back: 'Todos los cursos', status: 'Próximamente', pricing: 'Precio próximamente', selfPaced: 'A tu ritmo', modules: 'módulos', learn: 'Lo que vas a aprender',
      outline: 'Temario del curso', who: 'Para quién es', languages: 'Idiomas',
      langRows: [{ l: 'English', s: 'Al lanzamiento' }, { l: 'Español', s: 'Al lanzamiento' }, { l: 'Más idiomas', s: 'Planeados' }],
      instructor: 'Tu maestro',
      bio: 'Clarence Kennedy es el fundador de Yakini Digital. Ha manejado cocinas y negocios, y se cansó de ver a gente buena rentando todo su negocio a alguien más. Hoy ayuda a dueños de negocios a montar sistemas que les pertenecen.',
      waitlist: 'Unirme a la lista de espera', waitlistNote: 'Aparta tu lugar gratis en la clase de introducción y te avisaremos por correo cuando abra este curso.', startFree: 'Empieza con la clase gratis',
      draftOutline: 'Temario de muestra. Las lecciones pueden cambiar antes del lanzamiento.', module: 'Módulo',
    },
  },
}
