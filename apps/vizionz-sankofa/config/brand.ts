import type { BrandConfig } from '@yakini/config'

// ============================================
// VIZIONZ SANKOFA — Brand Configuration
// Direction A4: Pan-African palette extracted from logo
// ============================================

export const config: BrandConfig = {
  business: {
    name: 'Vizionz Sankofa',
    tagline: 'Seeing forward, returning to roots.',
    description: 'Vizionz Sankofa serves New Mexico\'s most vulnerable — unsheltered neighbors, refugee and immigrant families of all backgrounds, youth in crisis, and the families who hold them. Since 2014.',
    yearFounded: 2014,
  },

  brand: {
    designSystem: 'editorial',
    colors: {
      primary:    '#CE1126',
      accent:     '#0A2548',
      background: '#FFFFFF',
      text:       '#0A0A0A',
      textMuted:  '#4A4A4A',
      border:     '#E5E5E5',
    },
    fonts: {
      display: 'Cormorant Garamond',
      body:    'Newsreader',
    },
    logo: {
      text: 'Vizionz Sankofa',
    },
  },

  contact: {
    email: 'khadijahasili@vizionz.org',
    phone: '(505) 506-1604',
    address: '5400 Gibson Blvd SE, Bldg 11',
    location: 'Albuquerque, NM 87108',
    hours: 'Monday - Friday, 9 AM - 5 PM',
    notifyEmail: 'khadijahasili@vizionz.org',
  },

  social: [],

  services: {
    headline: 'Six programs, one promise.',
    subheadline: 'Direct support, advocacy, and education across six program areas — designed for the realities of the communities we serve in New Mexico.',
    items: [
      {
        title: 'Unsheltered Outreach & Stabilization',
        description: 'Direct outreach to unhoused neighbors across Albuquerque. In partnership with ACS, we provide stabilization support, hotel vouchers, hygiene supplies, and pathways to housing.',
        icon: '🏠',
        features: ['ACS partnership', 'Hotel vouchers', 'Hygiene & supplies', 'Housing pathways'],
      },
      {
        title: 'Refugee & Immigrant Services',
        description: 'Linguistic, cultural, and economic support for refugee and immigrant families of all backgrounds settling in New Mexico — without losing their mother tongues or culture.',
        icon: '🌍',
        features: ['Language access', 'Cultural support', 'Resettlement assistance', 'Family integration'],
      },
      {
        title: 'Housing & Rental Assistance',
        description: 'ERAP support, hotel vouchers, utility assistance, and relocation services. Eviction prevention before crisis. Stability before everything else.',
        icon: '🏘️',
        features: ['ERAP support', 'Utility assistance', 'Relocation services', 'Eviction prevention'],
      },
      {
        title: 'Youth Mentorship & Education',
        description: 'Mentorship, advocacy, and educational pathways for youth navigating school, the justice system, and CYFD custody — including our founding focus on African American young people.',
        icon: '🎓',
        features: ['One-on-one mentorship', 'CYFD advocacy', 'Educational pathways', 'Justice system support'],
      },
      {
        title: 'Family & Caregiver Support',
        description: 'Job-seeking, education, training, and social service referrals for parents, guardians, and caregivers — the people who hold our communities together.',
        icon: '👨‍👩‍👧‍👦',
        features: ['Job-seeking assistance', 'Education & training', 'Social service referrals', 'Caregiver resources'],
      },
      {
        title: 'Readiness Pilot',
        description: 'In partnership with Legacyline and the BRSA Foundation — behavioral readiness assessment and certification for participants pursuing housing, work, or education.',
        icon: '🧭',
        features: ['BRSA Foundation pilot', 'Legacyline platform', 'Readiness certification', 'Pathway tracking'],
      },
    ],
  },

  about: {
    headline: 'Stewards of their own lives.',
    subheadline: 'Founded in June 2014. Serving New Mexico families, all backgrounds, all the way.',
    story: 'Vizionz Sankofa was founded in June 2014 to assist youth and young adults in becoming stewards of their lives — despite socio-economic conditions beyond their control. We began with a focus on African American youth navigating disparities in schools, the justice system, and CYFD custody. The work has since extended to anyone in New Mexico without the substrate to thrive — unsheltered neighbors, refugee and immigrant families of every background, youth in crisis, and the families who carry them. The Sankofa philosophy is universal: heritage as compass, dignity as ground, knowing where you come from as the foundation for moving forward.',
    mission: 'To serve New Mexico\'s most vulnerable with direct support, advocacy, and education — meeting families where they are, regardless of where they come from.',
  },

  portfolio: {
    headline: 'Recent Events',
    subheadline: 'Monthly food distributions, community gatherings, and the daily work of meeting families where they are.',
    items: [],
  },

  home: {
    hero: {
      headline: 'Seeing forward, returning to roots.',
      subheadline: 'Vizionz Sankofa serves New Mexico\'s most vulnerable — unsheltered neighbors, refugee and immigrant families of all backgrounds, youth in crisis, and the families who hold them. We honor where you come from while moving you forward.',
      cta: 'Get Help Now',
      ctaLink: '/contact',
      secondaryCta: 'Support Our Work',
      secondaryCtaLink: '/about',
    },
    featuredServices: [0, 1, 2],
  },

  contactPage: {
    headline: 'We meet you where you are.',
    subheadline: 'Whether it\'s housing, family support, refugee resettlement, food assistance, or educational pathways — we hear you.',
    formIntro: 'Tell us how we can help. Everything you share is confidential. A team member will reach out within 24 hours.',
  },

  portal: {
    enabled: true,
    welcomeMessage: 'Welcome back. Manage participants, track services, upload event photos, and review the work.',
  },

  seo: {
    siteUrl: 'https://vizionz-sankofa-demo.yakini.digital',
    keywords: [
      'vizionz sankofa',
      'new mexico nonprofit',
      'albuquerque community',
      'unsheltered outreach',
      'refugee services',
      'immigrant services',
      'housing assistance',
      'youth mentorship',
      'sankofa philosophy',
    ],
  },

  yakini: {
    clientId: 'vizionz-sankofa',
    tier: 'authority',
    showCredit: true,
  },
}
