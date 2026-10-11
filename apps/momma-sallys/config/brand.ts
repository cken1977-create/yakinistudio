import type { BrandConfig } from '@yakini/config'

/**
 * Momma Sally's — BBQ food truck, Abilene, TX.
 *
 * Proof-of-concept build for Nicole. Real logo and real menu pulled
 * from her actual menu board photos. First client using the `menu`
 * field on BrandConfig.
 *
 * TODOs below are fields Nicole hasn't supplied yet — no formal
 * intake has happened. Placeholders, not guesses.
 *
 * Held in Confidence.
 */
export const config: BrandConfig = {
  business: {
    name: "Momma Sally's",
    tagline: 'Texas BBQ · Abilene, TX',
    description:
      "Momma Sally's is a locally owned food truck slinging Texas-style BBQ in Abilene — brisket smoked low and slow, sausage, chicken and pulled pork, served off a full bilingual menu with real sides, not shortcuts.",
  },

  brand: {
    designSystem: 'editorial',
    colors: {
      primary: '#B3121B',
      accent: '#8C1D2C',
      background: '#000000',
      text: '#FFFFFF',
      textMuted: '#B5B5B5',
      border: 'rgba(255,255,255,0.16)',
    },
    fonts: {
      display: 'Fraunces',
      body: 'Karla',
    },
    logo: {
      text: "Momma Sally's",
    },
  },

  contact: {
    email: 'hello@mommasallys.com', // TODO — placeholder; validator requires non-empty. Get real address from Nicole before launch.
    phone: '325-428-8166',
    location: 'Abilene, TX',
    hours: "Hours vary by day — call ahead for today's location",
  },

  social: [],  // TODO — Facebook page tagged #LLMM on the truck; confirm @Momma_Sallys handle

  services: {
    headline: 'Catering',
    subheadline: 'We cater your desire — from backyard cookouts to full brunch spreads.',
    items: [
      {
        title: 'BBQ Plates',
        description: 'Full meat plates scaled for parties, work crews and family gatherings — same menu, bigger batch.',
        icon: '🔥',
      },
      {
        title: 'Brunch Sweets',
        description: 'Banana pudding cups and dessert spreads, styled and ready for weddings and showers.',
        icon: '🍮',
      },
      {
        title: 'Corporate & Crews',
        description: "Pre-order plates for job sites and offices around Abilene — call ahead and it's ready when the truck rolls up.",
        icon: '🚚',
      },
    ],
  },

  menu: {
    headline: 'Bill of Fare',
    subheadline: 'Every meat plate comes with two sides, bread, pickles, onions & sauce.',
    bilingual: true,
    paymentNote: 'Tap to pay available. Cash, Visa & Mastercard accepted. Card fees & tax already built into the price.',
    categories: [
      {
        name: 'Meat Plates',
        nameTranslated: 'Platos de carne',
        note: 'Plates include two sides, bread, pickles, onions & sauce.',
        items: [
          { name: 'Brisket, Sausage or Chicken', nameTranslated: 'Brisket, salchicha o pollo', price: '$15' },
          { name: 'Pulled Pork', nameTranslated: 'Cerdo deshebrado', price: '$25' },
          { name: 'One Meat Plate', price: '$15' },
          { name: 'Two Meat Plate', price: '$25' },
        ],
      },
      {
        name: 'Texas Size Nachos',
        nameTranslated: 'Nachos Tamaño Texas',
        items: [
          {
            name: 'Texas Size Nachos',
            nameTranslated: 'Nachos Tamaño Texas',
            description: 'Crispy tortilla chips loaded with seasoned meat, melted cheese and fresh toppings.',
            descriptionTranslated: 'Totopos crujientes cargados con carne bien sazonada y queso derretido.',
            price: 'Ask at the truck',
          },
        ],
      },
      {
        name: 'Sides',
        nameTranslated: 'Acompañamientos',
        items: [
          { name: 'Beans', nameTranslated: 'Frijoles' },
          { name: 'Mac & Cheese', nameTranslated: 'Macarrones con queso' },
          { name: 'Potato Salad', nameTranslated: 'Ensalada de papa' },
        ],
      },
      {
        name: 'Sweets',
        nameTranslated: 'Postres',
        items: [
          { name: 'Cookies or Brownie', price: '$2' },
          { name: 'Banana Pudding', price: '$5' },
          { name: 'Pie', price: '$2' },
        ],
      },
      {
        name: 'Drinks',
        nameTranslated: 'Bebidas',
        items: [
          { name: 'Soda', price: '$2' },
          { name: 'Powerade', price: '$2' },
          { name: 'Monster', price: '$4' },
          { name: 'Water', price: 'Market' },
        ],
      },
    ],
  },

  about: {
    headline: 'The Truck',
    subheadline: 'Real pit, real Momma.',
    story: `Momma Sally's is a locally owned food truck slinging Texas-style barbecue in Abilene. Brisket rides the smoker all night, the sausage has snap, and every plate comes stacked with sides made the honest way. The menu runs in English and Spanish, front to back, because good barbecue shouldn't come with a language barrier.

Around town, people know the truck by its mark before they know the name — the chef's hat, crossed with a spatula and fork, ringed in flame. Catch the smoke, and you already know what's coming.`,
    mission: 'No shortcuts, no frozen bags — just a hot grill and a menu written so nobody has to guess.',
  },

  portfolio: {
    headline: 'From the Truck',
    subheadline: "What's cooking.",
    items: [
      { title: 'Meat Plates', category: 'BBQ', description: 'Brisket, sausage, chicken & pulled pork, fresh off the smoker.' },
      { title: 'Texas Size Nachos', category: 'BBQ', description: 'Loaded nachos, Momma Sally-style.' },
      { title: 'Banana Pudding', category: 'Catering', description: 'Made to order for brunch spreads and events.' },
      // TODO — swap for real photos once Nicole sends them
    ],
  },

  home: {
    hero: {
      headline: "Momma Sally's smokes it low & slow.",
      subheadline:
        'Brisket, sausage, chicken and pulled pork, pulled straight off the pit — plus the sides, the sauce, and the sweet stuff to finish it off.',
      cta: 'Call to Order',
      ctaLink: 'tel:3254288166',
      secondaryCta: 'See the Menu',
      secondaryCtaLink: '/menu',
      image: '/backdrop-pit.png',
    },
    featuredServices: [0, 1, 2],
  },

  contactPage: {
    headline: 'Find Us',
    subheadline: 'Come see us in Abilene.',
    formIntro: "Planning an event? Tell us what you need and we'll get back to you with catering pricing.",
  },

  portal: {
    enabled: false,
    welcomeMessage: 'Welcome back.',
  },

  seo: {
    siteUrl: 'https://momma-sallys.vercel.app', // TODO — confirm final domain
    keywords: [
      'bbq food truck abilene tx',
      'momma sallys bbq',
      'texas bbq abilene',
      'food truck abilene texas',
      'bbq catering abilene tx',
    ],
  },

  yakini: {
    clientId: 'momma-sallys',
    tier: 'starter',
    showCredit: true,
  },
}
