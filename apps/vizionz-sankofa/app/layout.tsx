// ═════════════════════════════════════════════════════════════════════════
// LAYOUT — Vizionz Sankofa root
// ═════════════════════════════════════════════════════════════════════════
// Bespoke chrome wraps every page. Imports primitives only from
// @yakini/ui-primitives and bespoke components from local components/.
// Does NOT import from @yakini/template-yakini-editorial.
//
// Order: Topbar → Header → main content → Footer (public pages only;
// /admin has its own shell, see components/PublicChrome.tsx)
// ═════════════════════════════════════════════════════════════════════════

import type { Metadata } from 'next'
import { BrandProvider } from '@yakini/ui-primitives'
import { validateBrandConfig } from '@yakini/config'
import { config } from '@/config/brand'
import { Topbar, Header, Footer } from '@/components'
import { PublicOnly } from '@/components/PublicChrome'

// Build-time validation — fails the build if config is invalid
const validation = validateBrandConfig(config)
if (!validation.valid) {
  throw new Error(`Invalid brand config: ${validation.errors.join(', ')}`)
}

export const metadata: Metadata = {
  title: `${config.business.dba || config.business.name} — ${config.business.tagline}`,
  description: config.business.description,
  keywords: config.seo.keywords.join(', '),
  openGraph: {
    title: config.business.name,
    description: config.business.description,
    url: config.seo.siteUrl,
    siteName: config.business.name,
    images: config.seo.ogImage ? [config.seo.ogImage] : [],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <BrandProvider config={config}>
          {/* Public chrome is skipped on staff pages (/admin), which have their own shell */}
          <PublicOnly>
            <Topbar config={config} />
            <Header config={config} />
          </PublicOnly>
          <main style={{ minHeight: '60vh' }}>
            {children}
          </main>
          <PublicOnly>
            <Footer config={config} />
          </PublicOnly>
        </BrandProvider>
      </body>
    </html>
  )
}
