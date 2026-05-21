import { BrandProvider, Navigation, Footer } from '@yakini/ui'
import { validateBrandConfig } from '@yakini/config'
import { config } from '@/config/brand'

// Build-time validation — fails the build if config is invalid
const validation = validateBrandConfig(config)
if (!validation.valid) {
  throw new Error(`Invalid brand config: ${validation.errors.join(', ')}`)
}

export const metadata = {
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <BrandProvider config={config}>
          <Navigation config={config} />
          <main style={{ minHeight: '100vh' }}>
            {children}
          </main>
          <Footer config={config} />
        </BrandProvider>
      </body>
    </html>
  )
}
