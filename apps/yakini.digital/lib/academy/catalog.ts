// Yakini Academy course catalog. DRAFT: titles from Clarence; summaries, topics and the
// sample outline are draft copy (a separate course outline is being written; update here).
// No prices yet: every paid course shows "pricing soon".
import type { AcademyLocale } from './locales'

type T = Record<AcademyLocale, string>
type TL = Record<AcademyLocale, string[]>

export type Course = {
  id: string
  slug: Record<AcademyLocale, string>
  free?: boolean
  title: T
  summary: T
  topics: TL
  /** Only courses with a detail page have an outline. */
  detail?: {
    tagline: T
    learn: TL
    who: T
    modules: { title: T; body: T }[]
  }
}

export const COURSES: Course[] = [
  {
    id: 'free-class', free: true,
    slug: { en: 'stop-renting-your-business', es: 'deja-de-rentar-tu-negocio' },
    title: { en: 'Stop Renting Your Business', es: 'Deja de rentar tu negocio' },
    summary: {
      en: 'The free class: How to Build Something That Belongs to You. Under an hour, watch any time.',
      es: 'La clase gratis: Cómo construir algo que te pertenezca. Menos de una hora, mírala cuando quieras.',
    },
    topics: { en: ['Free', 'Under an hour'], es: ['Gratis', 'Menos de una hora'] },
  },
  {
    id: 'setup',
    slug: { en: 'set-up-your-business', es: 'arma-tu-negocio' },
    title: { en: 'Set Up Your Business the Right Way', es: 'Arma tu negocio de la manera correcta' },
    summary: {
      en: 'Pick a business structure, get the licenses and permits you need, and set up banking so your business money stays separate from day one.',
      es: 'Elige la estructura de tu negocio, saca las licencias y permisos que necesitas y abre tu cuenta de banco para que el dinero del negocio quede separado desde el primer día.',
    },
    topics: { en: ['Structure', 'Licenses', 'Banking'], es: ['Estructura', 'Licencias', 'Banco'] },
  },
  {
    id: 'space',
    slug: { en: 'find-your-space', es: 'encuentra-tu-espacio' },
    title: { en: 'Find Your Space Without the Big Overhead', es: 'Encuentra tu espacio sin grandes gastos fijos' },
    summary: {
      en: 'Food trucks, shared kitchens, coworking and small offices: how to compare them, what to look for in a lease, and how to start small without locking yourself in.',
      es: 'Food trucks, cocinas compartidas, coworking y oficinas pequeñas: cómo compararlos, qué revisar en un contrato de renta y cómo empezar en pequeño sin amarrarte.',
    },
    topics: { en: ['Food trucks', 'Shared kitchens', 'Coworking', 'Leases'], es: ['Food trucks', 'Cocinas compartidas', 'Coworking', 'Contratos'] },
  },
  {
    id: 'lean-tech',
    slug: { en: 'run-lean-with-technology', es: 'opera-con-poco' },
    title: { en: 'Run Lean With Technology', es: 'Opera con poco, con ayuda de la tecnología' },
    summary: {
      en: 'Choose the few tools that actually matter, set them up once, and spend less time and money on busywork.',
      es: 'Elige las pocas herramientas que de verdad importan, configúralas una vez y gasta menos tiempo y dinero en tareas repetitivas.',
    },
    topics: { en: ['Tools', 'Automation', 'Time'], es: ['Herramientas', 'Automatización', 'Tiempo'] },
  },
  {
    id: 'own-systems',
    slug: { en: 'own-your-systems', es: 'se-dueno-de-tus-sistemas' },
    title: { en: 'Own Your Systems', es: 'Sé dueño de tus sistemas' },
    summary: {
      en: 'Your customer list, website, booking and payments, under your name and in your control, so nobody can switch your business off.',
      es: 'Tu lista de clientes, tu sitio web, tus citas y tus cobros, a tu nombre y bajo tu control, para que nadie pueda apagar tu negocio.',
    },
    topics: { en: ['Customer list', 'Website', 'Payments'], es: ['Clientes', 'Sitio web', 'Cobros'] },
  },
  {
    id: 'sales',
    slug: { en: 'sales-that-close', es: 'ventas-que-cierran' },
    title: { en: 'Sales That Close', es: 'Ventas que cierran' },
    summary: {
      en: 'How to be a good salesperson: prospecting, follow-up, handling objections, closing, and keeping track of every customer.',
      es: 'Cómo ser un buen vendedor: buscar clientes, darles seguimiento, responder objeciones, cerrar la venta y llevar el registro de cada cliente.',
    },
    topics: { en: ['Prospecting', 'Follow-up', 'Objections', 'Closing', 'CRM'], es: ['Prospectar', 'Seguimiento', 'Objeciones', 'Cierre', 'CRM'] },
    detail: {
      tagline: {
        en: 'Learn to sell honestly and consistently: find the right people, follow up without being pushy, answer objections, and ask for the sale.',
        es: 'Aprende a vender con honestidad y constancia: encuentra a las personas correctas, da seguimiento sin presionar, responde objeciones y pide la venta.',
      },
      learn: {
        en: [
          'Where to find people who actually need what you sell, and how to start the conversation.',
          'A simple follow-up rhythm you can keep up, so good leads stop slipping away.',
          'How to hear an objection as a question, and answer it honestly.',
          'How to ask for the sale clearly, without pressure or tricks.',
          'How to keep every customer and next step in one simple list (a CRM) you own.',
        ],
        es: [
          'Dónde encontrar a las personas que de verdad necesitan lo que vendes, y cómo empezar la conversación.',
          'Un ritmo sencillo de seguimiento que sí puedas mantener, para que los buenos clientes no se te escapen.',
          'Cómo escuchar una objeción como una pregunta, y responderla con honestidad.',
          'Cómo pedir la venta con claridad, sin presión ni trucos.',
          'Cómo llevar a cada cliente y el siguiente paso en una lista sencilla (un CRM) que sea tuya.',
        ],
      },
      who: {
        en: 'Owners who do their own selling, new salespeople, and anyone who has ever said "I\'m just not a salesperson."',
        es: 'Dueños que venden ellos mismos, vendedores que van empezando y cualquiera que alguna vez haya dicho "yo no sirvo para vender".',
      },
      modules: [
        { title: { en: 'The honest seller', es: 'El vendedor honesto' }, body: { en: 'What good selling is (and isn\'t), and why it starts with listening.', es: 'Qué es vender bien (y qué no), y por qué empieza por escuchar.' } },
        { title: { en: 'Prospecting', es: 'Prospectar' }, body: { en: 'Who your best customers are, where to find them, and how to reach out.', es: 'Quiénes son tus mejores clientes, dónde encontrarlos y cómo contactarlos.' } },
        { title: { en: 'First conversations', es: 'Las primeras conversaciones' }, body: { en: 'Questions that uncover what someone needs, and how to build trust fast.', es: 'Preguntas que descubren lo que la persona necesita, y cómo ganarte su confianza.' } },
        { title: { en: 'Follow-up that works', es: 'Seguimiento que funciona' }, body: { en: 'When and how to follow up, by call, text and email, without being a pest.', es: 'Cuándo y cómo dar seguimiento, por llamada, mensaje y correo, sin ser molesto.' } },
        { title: { en: 'Handling objections', es: 'Responder objeciones' }, body: { en: 'Price, timing, "I need to think about it": what\'s really being said, and honest answers.', es: 'El precio, el momento, "lo voy a pensar": qué te están diciendo de verdad, y cómo responder con honestidad.' } },
        { title: { en: 'Closing', es: 'Cerrar la venta' }, body: { en: 'Asking for the sale, making it easy to say yes, and what to do after a no.', es: 'Pedir la venta, hacer fácil decir que sí y qué hacer después de un no.' } },
        { title: { en: 'Your simple CRM', es: 'Tu CRM sencillo' }, body: { en: 'One list for every customer, deal and next step, and a weekly habit to keep it current.', es: 'Una sola lista para cada cliente, cada venta y cada siguiente paso, y un hábito semanal para tenerla al día.' } },
      ],
    },
  },
  {
    id: 'money',
    slug: { en: 'money-basics', es: 'finanzas-basicas' },
    title: { en: 'Money Basics for Owners', es: 'Finanzas básicas para dueños' },
    summary: {
      en: 'Price with confidence, read your numbers, plan for slow months and keep business and personal money apart.',
      es: 'Pon precios con confianza, entiende tus números, prepárate para los meses lentos y separa el dinero del negocio del personal.',
    },
    topics: { en: ['Pricing', 'Cash flow', 'Your numbers'], es: ['Precios', 'Flujo de efectivo', 'Tus números'] },
  },
]

export const courseBySlug = (lang: AcademyLocale, slug: string) => COURSES.find((c) => c.slug[lang] === slug)
