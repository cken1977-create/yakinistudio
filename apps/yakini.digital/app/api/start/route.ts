import { NextRequest, NextResponse } from 'next/server'
import { intakeFromDraft, type Draft } from '@/lib/orders/logic'
import { intakeTestMode, loadCatalog, loadSeats, submitIntake } from '@/lib/orders/submit'
import { rateLimited, tooMany } from '@/lib/server/guard'

function callerIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  return forwarded || headers.get('x-real-ip')?.trim() || 'unknown'
}

export const dynamic = 'force-dynamic'

function asDraft(raw: unknown): Draft | null {
  if (!raw || typeof raw !== 'object') return null
  const body = raw as Partial<Draft>
  const contact = body.contact
  if (!contact || typeof contact !== 'object') return null
  return {
    templateId: String(body.templateId ?? ''),
    businessId: '',
    businessOther: '',
    featureIds: Array.isArray(body.featureIds) ? body.featureIds.map(String).slice(0, 40) : [],
    planId: String(body.planId ?? ''),
    planTouched: true,
    domainKind: body.domainKind === 'register' ? 'register' : 'existing',
    domain: String(body.domain ?? ''),
    hostname: String(body.hostname ?? ''),
    hostnameTouched: true,
    preferredNames: Array.isArray(body.preferredNames) ? body.preferredNames.map(String).slice(0, 5) : [],
    contact: {
      name: String(contact.name ?? '').slice(0, 200),
      email: String(contact.email ?? '').slice(0, 254),
      phone: String(contact.phone ?? '').slice(0, 40),
      businessName: String(contact.businessName ?? '').slice(0, 200),
    },
  }
}

export async function POST(request: NextRequest) {
  if (rateLimited(`start:${callerIp(request.headers)}`, 8, 60 * 60_000)) return tooMany()
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return NextResponse.json({ error: 'Check the form and try again.' }, { status: 400 })
  }
  const draft = asDraft(raw)
  if (!draft) return NextResponse.json({ error: 'Check the form and try again.' }, { status: 400 })

  const [catalog, seats] = await Promise.all([loadCatalog(), loadSeats()])
  if (!catalog) {
    return NextResponse.json({ error: 'The plans are not available right now. Email hello@yakini.digital and a Yakini person will help.' }, { status: 503 })
  }
  const intake = intakeFromDraft(draft, catalog, seats)
  if (!intake) return NextResponse.json({ error: 'Check the form and try again.' }, { status: 400 })

  const result = await submitIntake(intake)
  if (!result.ok) {
    return NextResponse.json({ error: 'We could not reserve that just now. Email hello@yakini.digital and a Yakini person will take it from here.' }, { status: 502 })
  }
  if (result.testMode) {
    console.info('[start] test mode; live order was not sent', { env: process.env.VERCEL_ENV ?? 'local', secret: Boolean(process.env.ORDER_INTAKE_SECRET?.trim()) })
    return NextResponse.json({ ok: true, testMode: true })
  }
  return NextResponse.json({ ok: true, testMode: false, reference: result.reference })
}

export function GET() {
  return NextResponse.json({ testMode: intakeTestMode() })
}
