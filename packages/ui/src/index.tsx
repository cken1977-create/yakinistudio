// ═════════════════════════════════════════════════════════════════════════
// @yakini/ui — DEPRECATION SHIM
// ═════════════════════════════════════════════════════════════════════════
// This package previously contained all UI components in a single 859-line
// file. The architecture has been restructured to separate primitives from
// templates:
//
//   - Primitives (BrandProvider, Section, Button, hexToRgb)
//     → @yakini/ui-primitives
//
//   - Yakini Editorial template components (Navigation, Footer, Hero,
//     ServiceCard, PortfolioCard, ContactForm, SocialIcons)
//     → @yakini/template-yakini-editorial
//
// This file re-exports both packages so existing apps continue to work
// without modification. New apps and refactors should import from the
// new packages directly.
//
// MIGRATION GUIDANCE:
//
//   Before:
//     import { Hero, Section, Button } from '@yakini/ui'
//
//   After (template consumer):
//     import { Section, Button } from '@yakini/ui-primitives'
//     import { Hero } from '@yakini/template-yakini-editorial'
//
//   After (bespoke client like vizionz-sankofa):
//     import { Section, Button, BrandProvider } from '@yakini/ui-primitives'
//     // Custom components live in apps/<client>/components/
//
// File location:
//   packages/ui/src/index.tsx
// ═════════════════════════════════════════════════════════════════════════

export {
  BrandProvider,
  Section,
  Button,
  hexToRgb,
} from '@yakini/ui-primitives'

export {
  Navigation,
  Footer,
  Hero,
  ServiceCard,
  PortfolioCard,
  ContactForm,
  SocialIcons,
} from '@yakini/template-yakini-editorial'
