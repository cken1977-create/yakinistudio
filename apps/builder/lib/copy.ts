import { PUBLIC_PRICE_LINE } from '@yakini/pricing/products'

/** Studio landing copy. Customer-facing: no vendor names, never "AI-built" (R7, R8), one price line (R9). */
export const LANDING = {
  eyebrow: 'Yakini Studio',
  headline: 'Your website, set up in your brand.',
  subhead:
    "Paste the website you have now, or tell us about your business in a sentence. You'll see a draft in your own colors, then make it yours.",
  primaryCta: { label: 'Try the free demo', href: 'https://yakini.digital/demo' },
  secondaryCta: { label: 'How it works', href: '#how' },
  noContact: 'No email or phone needed to see your draft.',
  opening: 'Studio is opening soon. Today, the free demo shows your brand on a sample kit.',
  steps: [
    { n: '1', title: 'Paste or describe', body: 'Share your current website, or a sentence about what you do and where.' },
    { n: '2', title: 'See your draft', body: 'A five-page site in your own colors and logo: home, menu, about, events and contact.' },
    { n: '3', title: 'Make it yours', body: 'Tap any words or photos to change them, or just ask for the change you want.' },
    { n: '4', title: 'Go live', body: 'Publish to your own address. Forms and booking land in your Yakini portal.' },
  ],
  promises: [
    { title: 'Your brand stays yours', body: 'We never change your colors or your logo.' },
    { title: 'You own it', body: 'Your live site runs in accounts in your name, with Yakini looking after it.' },
    { title: 'A real person helps', body: 'Yakini sets it up with you, with a hands-on walkthrough of every part.' },
  ],
  price: PUBLIC_PRICE_LINE,
  pricingHref: 'https://yakini.digital/pricing',
} as const
