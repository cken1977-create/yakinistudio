// ═════════════════════════════════════════════════════════════════════════
// HOME PAGE — Vizionz Sankofa
// ═════════════════════════════════════════════════════════════════════════
// Clean composition of bespoke section components in v4 mock order.
// Each section is a custom component; this file only orchestrates.
//
// Section flow (top to bottom):
//   Hero            → philosophical anchor + dual CTAs
//   NumbersBand     → credibility (500+, 11 yrs, 6 programs, 8+ partners)
//   Mission         → founding doctrine (the 2014 quote)
//   Programs        → six programs, the operational manifest
//   Voices          → three voices, founder dominant
//   Gallery         → recent events, real photos when uploaded
//   Coalition       → partners + funders, sub-grouped
//   CTABands        → help / donate, two visually distinct asks
//   Newsletter      → final invitation
// ═════════════════════════════════════════════════════════════════════════

import { config } from '@/config/brand'
import {
  Hero,
  NumbersBand,
  Mission,
  Programs,
  Voices,
  Gallery,
  Coalition,
  CTABands,
  Newsletter,
} from '@/components'

export default function HomePage() {
  return (
    <>
      <Hero config={config} />
      <NumbersBand />
      <Mission config={config} />
      <Programs config={config} />
      <Voices />
      <Gallery />
      <Coalition />
      <CTABands />
      <Newsletter config={config} />
    </>
  )
}
