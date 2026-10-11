import type { Metadata, Viewport } from 'next'
import { BrandProvider } from '@yakini/ui'
import { validateBrandConfig } from '@yakini/config'
import { config } from '@/config/brand'
import { SiteStyles, SiteNav, SiteFooter, ActionBar } from '@/components/Site'

// Build-time validation — fails the build if config is invalid
const validation = validateBrandConfig(config)
if (!validation.valid) {
  throw new Error(`Invalid brand config: ${validation.errors.join(', ')}`)
}

// Strip the validator-only placeholder email so it never reaches the browser.
const publicConfig = { ...config, contact: { ...config.contact, email: '' } }

export const metadata: Metadata = {
  metadataBase: new URL(config.seo.siteUrl),
  title: `${config.business.name} — Texas BBQ Food Truck · Abilene, TX`,
  description: config.business.description,
  keywords: config.seo.keywords,
  openGraph: {
    title: `${config.business.name} — Texas BBQ · Abilene, TX`,
    description: config.business.description,
    url: config.seo.siteUrl,
    siteName: config.business.name,
    images: ['/backdrop-pit.png'],
    type: 'website',
  },
}

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BrandProvider config={publicConfig}>
          <SiteStyles />
          <SiteNav />
          <main style={{ minHeight: '70vh' }}>{children}</main>
          <SiteFooter />
          <ActionBar />
        </BrandProvider>
      </body>
    </html>
  )
}
