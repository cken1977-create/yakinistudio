import type { MetadataRoute } from 'next'

// Staff desktop install. Scope stays on /admin so the public site is not
// the installed app. theme_color is the operations navy; the splash behind
// the mark is the same off-white as the staff shell.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/admin',
    name: 'Vizionz Sankofa',
    short_name: 'Vizionz',
    description: 'Vizionz Sankofa staff operations.',
    start_url: '/admin',
    scope: '/admin',
    display: 'standalone',
    background_color: '#FAFAF8',
    theme_color: '#0A2548',
    lang: 'en',
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
