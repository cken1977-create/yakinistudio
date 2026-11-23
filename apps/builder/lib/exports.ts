/**
 * "Download my site" (v1.1, built in Phase 4). Phase 0 fixes the rules the export job and the
 * owner's Download button must follow, so the tables and bucket match them now.
 */
export const EXPORT_URL_TTL_SECONDS = 24 * 60 * 60 // signed URL life (9.3)
export const EXPORTS_PER_SITE_PER_DAY = 5           // 14.4
export const EXPORT_BUCKET = 'site-exports'

export type ExportPolicy = 'paid_or_recently_canceled' | 'any_owner'

/** Q13: site file + photos for any owner; ready-to-host pages for paying owners (or ≤ 90 days after canceling). */
export function canDownloadHtml(policy: ExportPolicy, status: string, canceledAt: Date | null, now = new Date()): boolean {
  if (policy === 'any_owner') return true
  if (status === 'active' || status === 'past_due') return true
  if (status === 'canceled' && canceledAt) return now.getTime() - canceledAt.getTime() <= 90 * 86_400_000
  return false
}

export function exportObjectPath(tenantId: string, exportId: string): string {
  return `${tenantId}/${exportId}.zip`
}

/** Only redistributable images may be zipped (image licensing tracking). */
export function exportableAssets<T extends { tenant_id: string; redistributable: boolean; deleted_at: string | null }>(assets: readonly T[], tenantId: string): T[] {
  return assets.filter((a) => a.tenant_id === tenantId && a.redistributable && !a.deleted_at)
}
