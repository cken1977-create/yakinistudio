// Owner sign-in for the catering desk (/office). One access code (OWNER_ACCESS_CODE) → a signed,
// http-only cookie for 30 days. Interim until her full portal sign-in is switched on.
import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

const COOKIE = 'ms_office'
const DAYS = 30

function secret() {
  const s = process.env.OFFICE_SESSION_SECRET?.trim()
  if (!s || s.length < 32) return null
  return s
}

function sign(payload: string) {
  return createHmac('sha256', secret()!).update(`office-v1:${payload}`).digest('hex')
}

export function codeMatches(code: string) {
  const want = process.env.OWNER_ACCESS_CODE?.trim()
  if (!want || !secret()) return false
  const a = Buffer.from(sign(code)), b = Buffer.from(sign(want))
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function startSession() {
  const exp = Date.now() + DAYS * 86400_000
  const c = await cookies()
  c.set(COOKIE, `${exp}.${sign(String(exp))}`, { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: DAYS * 86400 })
}

export async function endSession() {
  const c = await cookies()
  c.delete(COOKIE)
}

export async function isOwner(): Promise<boolean> {
  if (!secret()) return false
  const v = (await cookies()).get(COOKIE)?.value
  if (!v) return false
  const [exp, sig] = v.split('.')
  if (!exp || !sig || Number(exp) < Date.now()) return false
  const a = Buffer.from(sig), b = Buffer.from(sign(exp))
  return a.length === b.length && timingSafeEqual(a, b)
}

export async function requireOwner() {
  if (!(await isOwner())) redirect('/office')
}
