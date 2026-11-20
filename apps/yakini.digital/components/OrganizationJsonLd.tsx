import { organizationJsonLd } from '@/lib/organization'

// Organization structured data for search engines. Rendered once per public page (via SiteShell).
export function OrganizationJsonLd() {
  return (
    <script
      type="application/ld+json"
      // Static, build-time data only (no user input). "<" is escaped so the JSON can never close the tag.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()).replace(/</g, '\\u003c') }}
    />
  )
}
