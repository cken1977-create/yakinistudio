// Guards for API route handlers (which return responses instead of rendering 404 pages).
import 'server-only'
import { NextResponse } from 'next/server'
import { getMember, type Member } from '@/lib/auth'
import { safeEqual } from '@/lib/square/crypto'

export const notFoundResponse = () => new NextResponse('Not found', { status: 404 })

export async function ownerOrNull(): Promise<Member | null> {
  const m = await getMember()
  return m?.role === 'owner' ? m : null
}

/** Same-origin check for owner POSTs (defense in depth on top of SameSite cookies). */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get('origin')
  if (!origin) return true
  try { return new URL(origin).host === new URL(req.url).host } catch { return false }
}

export function cronAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  const got = req.headers.get('authorization') ?? ''
  return !!secret && safeEqual(got, `Bearer ${secret}`)
}
