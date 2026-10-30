// Server-only helpers: who is calling, rate limits, escaping, and the one place email is sent from.
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { ADMIN_COOKIE, CLIENT_COOKIE, REP_COOKIE, readSession, type Session } from '@/lib/auth/session'
import { isTestRecipient } from '@/lib/esign/server'

export async function adminSession(): Promise<Session | null> {
  return readSession((await cookies()).get(ADMIN_COOKIE)?.value, 'admin')
}

export async function repSession(): Promise<Session | null> {
  return readSession((await cookies()).get(REP_COOKIE)?.value, 'rep')
}

export async function clientSession(): Promise<Session | null> {
  return readSession((await cookies()).get(CLIENT_COOKIE)?.value, 'client')
}

export function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 })
}

// Small in-memory limiter (per server instance). Enough to stop a loop or a casual bot.
const buckets = new Map<string, number[]>()
export function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter(t => now - t < windowMs)
  if (hits.length >= max) { buckets.set(key, hits); return true }
  hits.push(now)
  buckets.set(key, hits)
  if (buckets.size > 5000) buckets.clear()
  return false
}

export function tooMany() {
  return NextResponse.json({ error: 'Too many requests. Please wait a few minutes.' }, { status: 429 })
}

export function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))
}

export const CONTRACTS_FROM = 'Yakini Contracts <admin@yakini.digital>'

/** Sends one email through Resend with a fixed sender. Reserved test domains are never emailed. */
export async function sendEmail(to: string, subject: string, html: string, from: string = CONTRACTS_FROM): Promise<'sent' | 'skipped' | 'failed'> {
  if (isTestRecipient(to)) { console.info('[email] test address; not sent'); return 'skipped' }
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[email] RESEND_API_KEY missing; not sent'); return 'failed' }
  try {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({ from, to: [to], subject, html }),
    })
    if (!r.ok) { console.error('[email] resend failed', r.status); return 'failed' }
    return 'sent'
  } catch (e) {
    console.error('[email] resend error', e)
    return 'failed'
  }
}

export async function sha256Hex(s: string): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Base URL for links we email. Production always uses the real domain (never the Host header). */
export function siteUrl(reqUrl: string): string {
  if (process.env.VERCEL_ENV === 'production') return 'https://yakini.digital'
  return new URL(reqUrl).origin
}

/** PostgREST filter value for a case-insensitive exact match (escapes LIKE wildcards). */
export function ilikeExact(s: string): string {
  return encodeURIComponent(s.replace(/[\\%_*]/g, ch => `\\${ch}`))
}
