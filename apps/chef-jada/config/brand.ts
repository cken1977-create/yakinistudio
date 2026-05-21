import type { BrandConfig } from '@yakini/config';
import { EXAMPLE_CONFIG } from '@yakini/config';

/**
 * Chef Jada / Pettit Luxe Group
 *
 * Public marketing site config. Built on the Yakini EXAMPLE_CONFIG
 * which was originally modeled on Chef Jada — we spread it and
 * override the fields that have changed since (7-service expansion,
 * multi-city positioning, etc.).
 *
 * Operations system (menu builder, cost analysis, booking, payments)
 * lives in Phase 2 admin routes.
 *
 * Held in Confidence.
 */
export const config: BrandConfig = {
  ...EXAMPLE_CONFIG,

  business: {
    ...EXAMPLE_CONFIG.business,
    name: 'Pettit Luxe Group',
    dba: 'Chef Jada',
    tagline: 'Private Chef · Elevated Dining · Chicago + Los Angeles',
    description: 'Chef Jada Pettit brings restaurant-caliber dining to private homes, intimate events, and restaurants across Chicago and Los Angeles. Private dining, oyster and caviar experiences, traveling chef service, 1-on-1 culinary training, and restaurant menu consulting.',
    yearFounded: 2020,
  },

  contact: {
    ...EXAMPLE_CONFIG.contact,
    email: 'jada@pettitluxe.com',
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
        image: '/portfolio/01-lamb-chops-demi-glace.jpg',
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
        image: '/portfolio/02-lobster-fra-diavolo.jpg',
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
        image: '/portfolio/05-steak-hash.jpg',
        title: '1-on-1 Cooking Training',
        description: 'Private culinary instruction in your kitchen. Learn techniques, build confidence, develop your repertoire. Designed for home cooks who want to elevate.',
        icon: '👩🏽‍🍳',
        features: ['Private in-home lessons', 'Skill-tier instruction', 'Recipe & technique focus', 'Custom curriculum'],
      },
      {
        image: '/portfolio/03-short-rib-chimichurri.jpg',
        title: 'Restaurant Menu Consulting',
        description: 'Menu development, recipe engineering, and culinary direction for restaurants. From concept to plate, with cost analysis and staff training included.',
        icon: '📋',
        features: ['Menu development', 'Recipe engineering', 'Cost analysis', 'Staff training'],
      },
      {
        image: '/portfolio/04-salmon-brussels.jpg',
        title: 'Meal Prep',
        description: 'Weekly meal preparation for busy professionals. Restaurant-quality meals customized to your dietary preferences, delivered and stored for the week ahead.',
        icon: '🥘',
        features: ['Weekly menus', 'Dietary customization', 'Delivered & stored', 'Reheating instructions'],
      },
    ],
  },

  seo: {
    ...EXAMPLE_CONFIG.seo,
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
