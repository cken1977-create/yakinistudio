// ────────────────────────────────────────────────────────────────────────────
// YAKINI CLIENT BRAND CONFIG
// ────────────────────────────────────────────────────────────────────────────
// One file controls everything for a client site.
// Copy this file into apps/[client-name]/config/brand.ts and customize.
// Every page on the client's site reads from here.
// ────────────────────────────────────────────────────────────────────────────

export type DesignSystem = 'editorial' | 'industrial'

export type Service = {
  title: string
  description: string
  icon?: string  // emoji or icon identifier
  features?: string[]
}

export type PortfolioItem = {
  title: string
  category: string
  description: string
  image?: string
  link?: string
  year?: string
}

export type TeamMember = {
  name: string
  role: string
  bio?: string
  image?: string
}

export type SocialLink = {
  platform: 'instagram' | 'facebook' | 'twitter' | 'linkedin' | 'youtube' | 'tiktok'
  url: string
}

export type BrandConfig = {
  // ── Identity ──────────────────────────────────────────────────
  business: {
    name: string                // Legal business name
    dba?: string                // Doing Business As (if different)
    tagline: string             // One-line tagline
    description: string         // 2-3 sentence description for SEO
    yearFounded?: number
  }

  // ── Branding ──────────────────────────────────────────────────
  brand: {
    designSystem: DesignSystem  // 'editorial' or 'industrial'
    colors: {
      primary: string           // Main brand color (hex)
      accent: string            // Secondary brand color (hex)
      background: string        // Page background (hex)
      text: string              // Body text color (hex)
      textMuted: string         // Subtle text color (hex)
      border: string            // Border/divider color (hex)
    }
    fonts: {
      display: string           // Headings — Google Fonts name
      body: string              // Body text — Google Fonts name
    }
    logo: {
      light?: string            // Path to logo for light backgrounds
      dark?: string             // Path to logo for dark backgrounds
      text?: string             // Fallback if no logo image
    }
    favicon?: string            // Path to favicon
  }

  // ── Contact ───────────────────────────────────────────────────
  contact: {
    email: string               // Primary client email
    phone?: string              // Phone number (formatted)
    address?: string            // Physical address
    location: string            // City, State (e.g., "Chicago, IL")
    hours?: string              // Business hours
    notifyEmail?: string        // Where lead form submissions go (defaults to email)
  }

  // ── Social ────────────────────────────────────────────────────
  social: SocialLink[]

  // ── Services Page ─────────────────────────────────────────────
  services: {
    headline: string            // Page headline
    subheadline: string         // Page subheadline
    items: Service[]
  }

  // ── About Page ────────────────────────────────────────────────
  about: {
    headline: string
    subheadline: string
    story: string               // 2-4 paragraph origin story
    mission: string             // Mission statement
    values?: { title: string; description: string }[]
    team?: TeamMember[]
  }

  // ── Portfolio / Work Page ─────────────────────────────────────
  portfolio: {
    headline: string
    subheadline: string
    items: PortfolioItem[]
  }

  // ── Home Page ─────────────────────────────────────────────────
  home: {
    hero: {
      headline: string          // Main hero headline
      subheadline: string       // Hero supporting text
      cta: string               // Primary button text
      ctaLink: string           // Primary button link (e.g., '/contact')
      secondaryCta?: string
      secondaryCtaLink?: string
      image?: string            // Hero image path
    }
    featuredServices?: number[] // Array of indices from services.items to feature (e.g., [0, 1, 2])
    socialProof?: {
      headline: string          // e.g., "Trusted by 200+ clients"
      logos?: string[]          // Paths to client/partner logos
      testimonials?: {
        quote: string
        author: string
        role: string
      }[]
    }
  }

  // ── Contact Page ──────────────────────────────────────────────
  contactPage: {
    headline: string
    subheadline: string
    formIntro: string           // Text above the form
  }

  // ── Client Portal ─────────────────────────────────────────────
  portal: {
    enabled: boolean            // Show portal in nav?
    welcomeMessage: string      // Message on portal login
  }

  // ── SEO ───────────────────────────────────────────────────────
  seo: {
    siteUrl: string             // Full URL of site (e.g., "https://chefjada.com")
    keywords: string[]          // SEO keywords
    ogImage?: string            // Default OpenGraph image
  }

  // ── Yakini Integration ────────────────────────────────────────
  yakini: {
    clientId: string            // Unique identifier in Yakini Supabase
    tier: 'starter' | 'authority' | 'conversion' | 'operations' | 'retention' | 'intelligence' | 'enterprise'
    showCredit: true            // Always shows Yakini credit (locked to true)
  }
}

// ────────────────────────────────────────────────────────────────────────────
// EXAMPLE CONFIG — Chef Jada / Pettit Luxe Group
// Use this as a reference when configuring new clients
// ────────────────────────────────────────────────────────────────────────────

export const EXAMPLE_CONFIG: BrandConfig = {
  business: {
    name: "Pettit Luxe Group",
    dba: "Chef Jada",
    tagline: "Private Chef · Elevated Dining · Chicago, IL",
    description: "Chef Jada brings restaurant-caliber dining to private homes and intimate events across Chicago. Personal chef services, curated menus, and unforgettable culinary experiences.",
    yearFounded: 2020,
  },

  brand: {
    designSystem: 'editorial',
    colors: {
      primary: '#8B6914',       // Warm gold
      accent: '#1A1A1A',        // Near black
      background: '#FAFAF8',    // Soft cream
      text: '#1A1A1A',
      textMuted: '#6B6B6B',
      border: '#E8E4DC',
    },
    fonts: {
      display: 'Cormorant Garamond',
      body: 'DM Sans',
    },
    logo: {
      text: 'Chef Jada',
    },
  },

  contact: {
    email: 'jada@pettitluxe.com',
    phone: '',
    location: 'Chicago, IL',
    hours: 'By appointment',
  },

  social: [
    { platform: 'instagram', url: 'https://instagram.com/chefjada' },
  ],

  services: {
    headline: 'Culinary Services',
    subheadline: 'Restaurant-caliber dining, on your terms.',
    items: [
      {
        title: 'Private Dining',
        description: 'Multi-course tasting menus prepared in your home. Designed around your tastes, dietary needs, and the occasion.',
        icon: '🍽️',
        features: ['4-7 course menus', 'Wine pairing available', 'In-home preparation', 'Full service & cleanup'],
      },
      {
        title: 'Event Catering',
        description: 'Curated menus for intimate gatherings, milestone celebrations, and corporate events.',
        icon: '✨',
        features: ['Custom menu design', 'Up to 50 guests', 'Service staff coordination', 'Bar pairing'],
      },
      {
        title: 'Meal Prep',
        description: 'Weekly meal preparation for busy professionals. Restaurant-quality meals, ready when you are.',
        icon: '🥘',
        features: ['Weekly menus', 'Dietary customization', 'Delivered & stored', 'Reheating instructions'],
      },
    ],
  },

  about: {
    headline: 'The Chef',
    subheadline: 'Where culinary craft meets personal hospitality.',
    story: `Chef Jada Pettit founded Pettit Luxe Group with a simple belief: extraordinary dining shouldn't be reserved for restaurants.

Trained in classical French technique with a focus on seasonal American cuisine, Jada brings years of professional kitchen experience into private homes across Chicago. Every menu is custom-built around the client, the occasion, and the season.

The result is dining that feels both elevated and deeply personal — restaurant-caliber food served in the comfort of your own space.`,
    mission: 'To bring restaurant-caliber dining into the most personal spaces, one unforgettable meal at a time.',
  },

  portfolio: {
    headline: 'Selected Work',
    subheadline: 'Recent menus and memorable evenings.',
    items: [
      {
        title: 'Anniversary Dinner for Two',
        category: 'Private Dining',
        description: 'Seven-course tasting menu featuring seasonal Midwest produce.',
        year: '2024',
      },
      {
        title: 'Corporate Holiday Reception',
        category: 'Event Catering',
        description: 'Curated menu for 40 guests featuring contemporary American cuisine.',
        year: '2024',
      },
    ],
  },

  home: {
    hero: {
      headline: 'Elevated dining, in your home.',
      subheadline: 'Restaurant-caliber food. Curated for you. Served wherever the moment matters.',
      cta: 'Book a Consultation',
      ctaLink: '/contact',
      secondaryCta: 'View Services',
      secondaryCtaLink: '/services',
    },
    featuredServices: [0, 1, 2],
  },

  contactPage: {
    headline: 'Let\'s Plan Your Event',
    subheadline: 'Tell me about the occasion. I\'ll be in touch within 24 hours.',
    formIntro: 'Every event begins with a conversation. Share a few details and we\'ll start designing your experience.',
  },

  portal: {
    enabled: true,
    welcomeMessage: 'Welcome back. Track your event details and menu approvals here.',
  },

  seo: {
    siteUrl: 'https://chefjada.com',
    keywords: ['private chef chicago', 'personal chef chicago', 'chef jada', 'chicago catering', 'private dining'],
  },

  yakini: {
    clientId: 'chef-jada',
    tier: 'authority',
    showCredit: true,
  },
}

// ────────────────────────────────────────────────────────────────────────────
// VALIDATION
// ────────────────────────────────────────────────────────────────────────────
// Run this on app startup to ensure config is valid

export function validateBrandConfig(config: BrandConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!config.business?.name) errors.push('business.name is required')
  if (!config.business?.tagline) errors.push('business.tagline is required')
  if (!config.contact?.email) errors.push('contact.email is required')
  if (!config.contact?.location) errors.push('contact.location is required')
  if (!config.brand?.colors?.primary) errors.push('brand.colors.primary is required')
  if (!config.brand?.colors?.accent) errors.push('brand.colors.accent is required')
  if (!config.brand?.fonts?.display) errors.push('brand.fonts.display is required')
  if (!config.brand?.fonts?.body) errors.push('brand.fonts.body is required')
  if (!config.services?.items?.length) errors.push('services.items must have at least 1 item')
  if (!config.home?.hero?.headline) errors.push('home.hero.headline is required')
  if (!config.seo?.siteUrl) errors.push('seo.siteUrl is required')
  if (!config.yakini?.clientId) errors.push('yakini.clientId is required')

  // Yakini credit must always be true
  if (config.yakini?.showCredit !== true) {
    errors.push('yakini.showCredit must be true (Yakini branding is required)')
  }

  return { valid: errors.length === 0, errors }
  }
      
