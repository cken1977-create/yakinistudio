import type { BrandConfig } from '@yakini/config';

/**
 * Chef Jada / Pettit Luxe Group
 *
 * Public marketing site config. Operations system (menu builder,
 * cost analysis, booking, payments) lives in Phase 2 admin routes.
 *
 * Held in Confidence.
 */
export const config: BrandConfig = {
  business: {
    name: "Pettit Luxe Group",
    dba: "Chef Jada",
    tagline: "Private Chef · Elevated Dining · Chicago + Los Angeles",
    description: "Chef Jada Pettit brings restaurant-caliber dining to private homes, intimate events, and restaurants across Chicago and Los Angeles. Private dining, oyster and caviar experiences, traveling chef service, 1-on-1 culinary training, and restaurant menu consulting.",
    yearFounded: 2020,
  },

  brand: {
    designSystem: 'editorial',
    colors: {
      primary: '#8B6914',
      accent: '#0F0F0F',
      background: '#FAFAF8',
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
    location: 'Chicago, IL · Los Angeles, CA',
    hours: 'By appointment',
  },

  social: [
    { platform: 'instagram', url: 'https://instagram.com/chefjada' },
  ],

  services: {
    headline: 'Culinary Services',
    subheadline: 'Restaurant-caliber dining, on your terms — wherever the moment matters.',
    items: [
      {
        title: 'Private Dining',
        description: 'Multi-course tasting menus prepared in your home. Designed around your tastes, dietary needs, and the occasion. Restaurant-tier plating, intimate setting.',
        icon: '🍽️',
        features: ['4-7 course menus', 'Wine pairing available', 'In-home preparation', 'Full service & cleanup'],
      },
      {
        title: 'The Oyster & Caviar Experience',
        description: 'A bespoke premium offering. Fresh oysters, curated caviar service, champagne pairings, and chef-led presentation for the most discerning occasions.',
        icon: '🥂',
        features: ['Curated oyster selection', 'Caviar service & pairings', 'Champagne presentation', 'Available by request'],
      },
      {
        title: 'Event Catering',
        description: 'Showstopper menus for intimate gatherings, milestone celebrations, and corporate events. Up to 50 guests with full service staff coordination.',
        icon: '✨',
        features: ['Custom menu design', 'Up to 50 guests', 'Service staff coordination', 'Bar pairing'],
      },
      {
        title: 'Traveling Chef',
        description: 'Fly-in private chef service to destinations beyond Chicago and Los Angeles. Vacation homes, milestone trips, retreats — restaurant-caliber dining wherever you are.',
        icon: '✈️',
        features: ['Nationwide service', 'Pre-event menu planning', 'Sourcing on location', 'Multi-day engagements'],
      },
      {
        title: '1-on-1 Cooking Training',
        description: 'Private culinary instruction in your kitchen. Learn techniques, build confidence, develop your repertoire. Designed for home cooks who want to elevate.',
        icon: '👩🏽‍🍳',
        features: ['Private in-home lessons', 'Skill-tier instruction', 'Recipe & technique focus', 'Custom curriculum'],
      },
      {
        title: 'Restaurant Menu Consulting',
        description: 'Menu development, recipe engineering, and culinary direction for restaurants. From concept to plate, with cost analysis and staff training included.',
        icon: '📋',
        features: ['Menu development', 'Recipe engineering', 'Cost analysis', 'Staff training'],
      },
      {
        title: 'Meal Prep',
        description: 'Weekly meal preparation for busy professionals. Restaurant-quality meals customized to your dietary preferences, delivered and stored for the week ahead.',
        icon: '🥘',
        features: ['Weekly menus', 'Dietary customization', 'Delivered & stored', 'Reheating instructions'],
      },
    ],
  },

  seo: {
    siteUrl: 'https://chef-jada.vercel.app',
    keywords: [
      'private chef chicago',
      'private chef los angeles',
      'chef jada',
      'pettit luxe group',
      'oyster and caviar experience',
      'traveling chef',
      'restaurant menu consulting',
      'private dining chicago',
      'private dining los angeles',
      'cooking lessons chicago',
    ],
  },

  yakini: {
    clientId: 'chef-jada',
    tier: 'authority',
    showCredit: true,
  },
};
