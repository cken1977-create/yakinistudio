// ═══════════════════════════════════════════════════════════════════════════
// HAIL OF A DAY — BRAND CONFIG
// Path: apps/hail-of-a-day/config/brand.ts
//
// Founding Member #1 candidate. Yakini Authority tier.
// Owner: Chadrick Sullivan · Operator: Tania Perkins
// Contact: 214-245-2113 · hailofaday@gmail.com
// Domain: myhailofaday.com (pending registration)
// ═══════════════════════════════════════════════════════════════════════════

import type { BrandConfig } from '@yakini/config'

export const config: BrandConfig = {
  // ── Identity ─────────────────────────────────────────────────────────────
  business: {
    name: 'Hail of a Day',
    dba: 'Hail of a Day',
    tagline: 'Hail damage claims · Paintless dent repair · DFW',
    description:
      'Zero out-of-pocket hail damage repair across the Dallas–Fort Worth metroplex. We pay your deductible up to $1,000, file your claim, and pick up your car. Lifetime warranty on every repair.',
    yearFounded: 2025,
  },

  // ── Branding ─────────────────────────────────────────────────────────────
  // Pulled directly from logo — navy field, chrome silver text, signal green check.
  brand: {
    designSystem: 'industrial',
    colors: {
      primary: '#3ddc3d',
      accent: '#3a8db5',
      background: '#0a1628',
      text: '#e8edf2',
      textMuted: '#8a9bb0',
      border: 'rgba(200, 212, 224, 0.2)',
    },
    fonts: {
      display: 'Oswald',
      body: 'Inter',
    },
    logo: {
      light: '/brand/hail-of-a-day-logo.png',
      dark: '/brand/hail-of-a-day-logo.png',
      text: 'Hail of a Day',
      favicon: '/brand/favicon.png',
    },
  },

  // ── Contact ──────────────────────────────────────────────────────────────
  contact: {
    email: 'hailofaday@gmail.com',
    phone: '(214) 245-2113',
    location: 'Dallas–Fort Worth, TX',
    hours: 'Mon–Sat · 7am–7pm',
    notifyEmail: 'hailofaday@gmail.com',
  },

  // ── Social ───────────────────────────────────────────────────────────────
  social: [],

  // ── Services Page ────────────────────────────────────────────────────────
  services: {
    headline: 'Premium hail repair, zero hassle.',
    subheadline:
      'Everything you need to get your car back to factory finish — handled by us, from the first call to the keys back in your hand.',
    items: [
      {
        title: 'Paintless Dent Repair',
        description:
          'The gold standard for hail damage. Our techs massage dents out from behind the panel — preserving your factory paint, your color match, and your resale value. No filler, no respray. Lifetime warranty.',
        icon: '🔨',
        features: [
          'Original factory finish preserved',
          'Lifetime warranty on every panel',
          'Certified master technicians',
          'Most repairs completed in 3–5 days',
        ],
      },
      {
        title: 'Insurance Claim Handling',
        description:
          'We call your carrier, confirm comprehensive coverage, file the claim, and coordinate with your adjuster. You don\'t sit on hold. You don\'t chase paperwork. You don\'t lose time.',
        icon: '📋',
        features: [
          'We file the claim for you',
          'Direct adjuster coordination',
          'Coverage verified before any work',
          'Most claims approved within 24 hours',
        ],
      },
      {
        title: 'Pickup & Delivery',
        description:
          'Hand us the keys at your home or office. We pick up your car, bring it to our shop, repair it, and deliver it back restored. You never have to come to us.',
        icon: '🚗',
        features: [
          'Free pickup at your location',
          'Free rental car or Uber',
          'Door-to-door delivery when complete',
          'Available across DFW metroplex',
        ],
      },
      {
        title: 'Deductible Assistance',
        description:
          'We pay your deductible up to $1,000, so you walk away with zero out-of-pocket. The repair gets done. You don\'t write a check.',
        icon: '💰',
        features: [
          'Up to $1,000 deductible covered',
          'Zero out-of-pocket repair',
          'No hidden fees or surprises',
          'Insurance-approved process',
        ],
      },
    ],
  },

  // ── About Page ───────────────────────────────────────────────────────────
  about: {
    headline: 'Built for busy people.',
    subheadline:
      'Hail of a Day exists because nobody should lose a day of their life to a storm they didn\'t cause.',
    story: `When hail hits a car, most people lose hours — sometimes days — dealing with adjusters, body shops, rental cars, and the back-and-forth that comes with insurance claims. We watched it happen one too many times and built a different kind of company.

We come to you. We file the claim. We pick up your car. We pay your deductible up to $1,000. We do the work using paintless dent repair — the same technique luxury dealerships use to preserve factory finish — and we back every repair with a lifetime warranty.

You hand us the keys. We hand them back, with your car looking like the storm never touched it.

That's it. That's the whole promise. We just keep it.`,
    mission:
      'To make hail damage repair so simple and so painless that our customers forget the storm ever happened.',
    values: [
      {
        title: 'Zero out-of-pocket',
        description:
          'We pay your deductible up to $1,000 because we built this for people who shouldn\'t have to write a check to fix something that wasn\'t their fault.',
      },
      {
        title: 'Your time is the product',
        description:
          'Every step we built — pickup, delivery, claim filing, rental coordination — exists to give you back the hours a hail claim normally steals.',
      },
      {
        title: 'Factory finish or nothing',
        description:
          'Paintless dent repair preserves your original paint. No filler. No respray. No color match issues. The same standard you\'d expect from the dealership that sold you the car.',
      },
      {
        title: 'Lifetime warranty',
        description:
          'Every repair, every panel, backed for the life of the vehicle. If the dent comes back, we fix it. No questions, no clock.',
      },
    ],
  },

  // ── Portfolio / Work Page ────────────────────────────────────────────────
  portfolio: {
    headline: 'Recent repairs across DFW.',
    subheadline:
      'A look at what factory-finish hail repair actually looks like — before, during, and after.',
    items: [
      {
        title: 'Tahoe Hood — Severe Hail',
        category: 'PDR · Full Hood',
        description:
          'Severe pea-to-quarter-sized hail across the entire hood. Paintless dent repair preserved the original finish. Customer cost: $0 out-of-pocket.',
        image: '/portfolio/tahoe-hood.jpg',
        year: '2025',
      },
      {
        title: 'Camry Roof — Moderate Hail',
        category: 'PDR · Roof Panel',
        description:
          'Mid-sized hail concentrated on the roof. Restored to factory finish without removing the headliner. Three-day turnaround.',
        image: '/portfolio/camry-roof.jpg',
        year: '2025',
      },
      {
        title: 'F-150 Hood & Quarter Panels',
        category: 'PDR · Multi-Panel',
        description:
          'Large hail event covering hood, fenders, and bed sides. Full restoration with no paintwork. Customer kept the original Ford finish and warranty.',
        image: '/portfolio/f150-multi.jpg',
        year: '2025',
      },
      {
        title: 'Lexus RX — Light Hail',
        category: 'PDR · Touch-Up',
        description:
          'Light hail dings concentrated on the hood. Same-day repair. Customer drove home in the same vehicle they arrived in.',
        image: '/portfolio/lexus-hood.jpg',
        year: '2025',
      },
      {
        title: 'Silverado — Severe Multi-Panel',
        category: 'PDR · Full Vehicle',
        description:
          'Severe hail covering nearly every horizontal panel. Full restoration. Customer financed nothing — full insurance pay plus deductible covered.',
        image: '/portfolio/silverado-full.jpg',
        year: '2025',
      },
      {
        title: 'BMW X5 — Hood Damage',
        category: 'PDR · Premium Vehicle',
        description:
          'Mid-sized hail across the hood. PDR preserved the BMW factory paint and the vehicle\'s premium resale value.',
        image: '/portfolio/bmw-hood.jpg',
        year: '2025',
      },
    ],
  },

  // ── Home Page ────────────────────────────────────────────────────────────
  home: {
    hero: {
      headline: 'Hail hit your car. We handle the rest.',
      subheadline:
        'Zero out-of-pocket. We pay your deductible up to $1,000, file the claim for you, pick up your car, and deliver it back fixed. Lifetime warranty on every repair.',
      cta: 'Start your claim',
      ctaLink: '/contact',
      secondaryCta: 'Call 214-245-2113',
      secondaryCtaLink: 'tel:2142452113',
    },
    featuredServices: [0, 1, 2],
    socialProof: {
      headline: 'Trusted across DFW',
      testimonials: [
        {
          quote:
            'They picked up my truck Tuesday, had it back Friday looking like new. I never had to call my insurance once. That alone was worth it.',
          author: 'Marcus W.',
          role: '2022 Chevy Tahoe · Plano',
        },
        {
          quote:
            'Zero out-of-pocket. I thought it was too good to be true until they pulled up with the rental and a tow truck. Real deal.',
          author: 'Diana M.',
          role: '2020 Toyota Camry · Arlington',
        },
        {
          quote:
            'The lifetime warranty was what sold me. These guys stand behind their work. My Lexus looks better than it did before the storm.',
          author: 'James R.',
          role: '2021 Lexus RX · Fort Worth',
        },
      ],
    },
  },

  // ── Contact Page ─────────────────────────────────────────────────────────
  contactPage: {
    headline: 'Start your claim.',
    subheadline:
      'Two minutes. Fill out what you can — we\'ll catch the rest on the call.',
    formIntro:
      'Snap photos of the damage, tell us a bit about your vehicle, and we\'ll handle the rest. A real person from Hail of a Day calls you within 24 hours to walk through your coverage and schedule pickup.',
  },

  // ── Client Portal ────────────────────────────────────────────────────────
  portal: {
    enabled: true,
    welcomeMessage:
      'Welcome back. Track your claim status, see your repair photos, and message your service team here.',
  },

  // ── SEO ──────────────────────────────────────────────────────────────────
  seo: {
    siteUrl: 'https://myhailofaday.com',
    keywords: [
      'hail damage repair Dallas',
      'paintless dent repair DFW',
      'free hail repair Texas',
      'zero deductible hail repair Arlington',
      'PDR Fort Worth',
      'hail damage insurance claim',
      'no out of pocket hail repair',
      'lifetime warranty PDR Dallas',
    ],
    ogImage: '/brand/og-image.png',
  },

  // ── Yakini Integration ───────────────────────────────────────────────────
  yakini: {
    clientId: 'hail-of-a-day',
    tier: 'authority',
    showCredit: true,
  },
          }
