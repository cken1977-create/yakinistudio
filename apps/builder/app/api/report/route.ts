import { z } from 'zod'
import * as Sentry from '@sentry/nextjs'
import { reportRef, type ReportError } from '@/lib/report'
import { operatorEmails, sendAlert } from '@/lib/server/mail'
import { checkFormTime, clientIp, hashIp, originAllowed, readCappedForm, requestOrigin } from '@/lib/server/request'
import { ConfigError, getRuntime } from '@/lib/server/runtime'
import { phase3Settings, studioOrigin } from '@/lib/server/settings'
import { refreshSite } from '@/lib/server/site-cache'

/**
 * POST /api/report (spec 5.11, 14.8 #4, 18): store an abuse report. Public, no sign-in, works with
 * JavaScript off. 3 per hour per visitor and 20 a day per site. Operators get an internal alert;
 * the reporter and the site owner get nothing automatically (R5). An unpaid site is held
 * automatically on 3 reports from different visitors in 24 h, or any phishing report (Q12).
 */
export const dynamic = 'force-dynamic'

const Fields = z.object({
  site: z.uuid(),
  reason: z.enum(['impersonation', 'phishing', 'copyright', 'illegal', 'other']),
  details: z.string().trim().min(1).max(2000),
  email: z.union([z.literal(''), z.email().max(254)]).optional(),
  owner: z.string().optional(),
})

export async function POST(request: Request): Promise<Response> {
  const back = (siteId: string, e: ReportError) => new Response(null, { status: 303, headers: { location: `/report?site=${encodeURIComponent(siteId)}&error=${e}`, 'cache-control': 'no-store' } })
  if (!originAllowed(request.headers, [requestOrigin(request.url)])) return new Response('Forbidden', { status: 403 })
  const data = await readCappedForm(request, 8 * 1024)
  const siteId = typeof data?.get('site') === 'string' ? (data!.get('site') as string).slice(0, 36) : ''
  if (!data) return back(siteId, 'missing')
  let rt
  try { rt = getRuntime() } catch (e) { if (e instanceof ConfigError) return back(siteId, 'failed'); throw e }
  try {
    // Bots: honeypot or too fast → looks sent, nothing stored.
    const honey = data.get('company_website')
    const ts = checkFormTime(typeof data.get('ts') === 'string' ? (data.get('ts') as string) : null, rt.ipPepper, Date.now())
    if ((typeof honey === 'string' && honey.trim()) || ts === 'too_fast' || ts === 'bad') {
      return new Response(null, { status: 303, headers: { location: `/report?done=${reportRef(crypto.randomUUID())}`, 'cache-control': 'no-store' } })
    }
    if (ts === 'expired') return back(siteId, 'expired')
    const parsed = Fields.safeParse(Object.fromEntries([...data.entries()].filter(([, v]) => typeof v === 'string')))
    if (!parsed.success) return back(siteId, 'missing')
    const f = parsed.data

    const ipHash = hashIp(clientIp(request.headers), rt.ipPepper)
    if (!(await rt.store.hitRateLimit(`report:${ipHash}`, 3, 3600))) return back(siteId, 'slow')
    if (!(await rt.store.hitRateLimit(`report-site:${f.site}`, 20, 86_400))) return back(siteId, 'slow')
    const info = await rt.store.publishInfo(f.site)
    if (!info) return back(siteId, 'site')

    const s = phase3Settings()
    const { reportId, held } = await rt.store.fileReport({
      siteId: f.site, host: info.primaryHost ?? 'preview', reason: f.reason, details: f.details, email: f.email || null,
      saysOwner: f.owner === 'yes', ipHash, threshold: s.autoHoldReports, windowHours: s.autoHoldWindowHours,
    })
    if (held) await refreshSite(rt, f.site)
    await sendAlert({
      to: operatorEmails(), tag: 'report-alert',
      subject: `${held ? 'Site held after reports' : 'New site report'}: ${info.tenantName}`.slice(0, 150),
      text: `A site was reported.\n\nSite: ${info.tenantName} (${info.primaryHost ?? 'not live'})\nReason: ${f.reason}\nReporter says they own the business: ${f.owner === 'yes' ? 'yes' : 'no'}\n${held ? '\nThe site has no paid plan and was held automatically. It now shows the neutral page.\n' : ''}\nDetails:\n${f.details}\n\nOpen reports: ${studioOrigin()}/ops/reports\n`,
    })
    return new Response(null, { status: 303, headers: { location: `/report?done=${reportRef(reportId)}`, 'cache-control': 'no-store' } })
  } catch (e) {
    Sentry.captureException(e, { tags: { area: 'report' } })
    return back(siteId, 'failed')
  }
}
