import { NextRequest, NextResponse } from 'next/server'
import {
  buildContractDocument, canonicalText, sha256Hex, isExpired, TOKEN_RE, CONSENT_TEXT,
  type ContractRow, type ContractFieldRow,
} from '@/lib/esign/document'
import { rest, isMissingColumn, clientIp, isTestRecipient, EsignConfigError, keyKind } from '@/lib/esign/server'

export const dynamic = 'force-dynamic'

const COLS = 'id,client_name,client_email,client_business,contract_type,contract_title,status,signing_token,token_expires_at,sent_at,created_at,viewed_at,signed_at,signer_name'
const MAX_SIG_BYTES = 200_000

type Ctx = { params: Promise<{ token: string }> }

function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}

async function load(token: string) {
  if (!TOKEN_RE.test(token)) return null
  const r = await rest<ContractRow[]>(`contracts?signing_token=eq.${token}&select=${COLS}&limit=1`)
  if (!r.ok) throw new Error(`contract lookup failed (${r.status}) ${r.error?.message ?? ''} [key ${keyKind()}]`)
  return r.data?.[0] ?? null
}

async function fieldsFor(id: string) {
  const r = await rest<ContractFieldRow[]>(`contract_fields?contract_id=eq.${id}&select=field_name,field_value`)
  return r.ok ? r.data ?? [] : []
}

async function audit(contractId: string, event: string, actor: string, h: Headers, notes: string) {
  await rest('contract_audit', {
    method: 'POST', prefer: 'return=minimal',
    body: { contract_id: contractId, event, actor, ip_address: clientIp(h), user_agent: h.get('user-agent')?.slice(0, 500) ?? null, notes },
  })
}

function gate(c: ContractRow | null) {
  if (!c) return json({ state: 'invalid' }, 404)
  if (c.status === 'voided') return json({ state: 'voided' }, 410)
  if (c.status === 'signed') return json({ state: 'already_signed', title: c.contract_title, signed_at: c.signed_at }, 200)
  if (isExpired(c)) return json({ state: 'expired' }, 410)
  return null
}

function handleError(e: unknown) {
  console.error('[esign]', e)
  if (e instanceof EsignConfigError) return json({ state: 'error', error: 'Signing is temporarily unavailable.' }, 503)
  return json({ state: 'error', error: 'Something went wrong. Please try again.' }, 500)
}

// GET: load the document for review and record the first view.
export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    const c = await load(token)
    const blocked = gate(c)
    if (blocked) return blocked
    const contract = c!
    const doc = buildContractDocument(contract, await fieldsFor(contract.id))
    const hash = await sha256Hex(canonicalText(doc))
    if (contract.status === 'sent' || !contract.viewed_at) {
      const viewedAt = contract.viewed_at ?? new Date().toISOString()
      await rest(`contracts?id=eq.${contract.id}&status=in.(sent,viewed,draft)`, {
        method: 'PATCH', prefer: 'return=minimal', body: { status: 'viewed', viewed_at: viewedAt },
      })
      if (!contract.viewed_at) await audit(contract.id, 'viewed', contract.client_email, req.headers, `Opened signing link; document sha256 ${hash}`)
    }
    return json({
      state: 'review',
      contract: {
        title: contract.contract_title, client_name: contract.client_name, client_email: contract.client_email,
        client_business: contract.client_business, sent_at: contract.sent_at, expires_at: contract.token_expires_at,
      },
      document: doc,
      document_hash: hash,
      consent_text: CONSENT_TEXT,
    })
  } catch (e) { return handleError(e) }
}

// POST: record the signature.
export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const { token } = await ctx.params
    let body: { signer_name?: unknown; consent?: unknown; signature_type?: unknown; signature_data?: unknown; document_hash?: unknown }
    try { body = await req.json() } catch { return json({ state: 'error', error: 'Bad request.' }, 400) }

    const name = typeof body.signer_name === 'string' ? body.signer_name.trim().replace(/\s+/g, ' ') : ''
    if (name.length < 3 || name.length > 120 || name.split(' ').length < 2) return json({ state: 'error', error: 'Enter your full legal name (first and last).' }, 422)
    if (body.consent !== true) return json({ state: 'error', error: 'You must agree to sign electronically.' }, 422)
    const sigType = body.signature_type === 'drawn' ? 'drawn' : 'typed'
    let sigData: string | null = null
    if (sigType === 'drawn') {
      if (typeof body.signature_data !== 'string' || !body.signature_data.startsWith('data:image/png;base64,') || body.signature_data.length > MAX_SIG_BYTES) {
        return json({ state: 'error', error: 'Draw your signature again.' }, 422)
      }
      sigData = body.signature_data
    }

    const c = await load(token)
    const blocked = gate(c)
    if (blocked) return blocked
    const contract = c!
    const doc = buildContractDocument(contract, await fieldsFor(contract.id))
    const hash = await sha256Hex(canonicalText(doc))
    if (typeof body.document_hash === 'string' && body.document_hash !== hash) {
      return json({ state: 'changed', error: 'This document changed after you opened it. Reload to review the current version.' }, 409)
    }

    const now = new Date().toISOString()
    const ip = clientIp(req.headers)
    const ua = req.headers.get('user-agent')?.slice(0, 500) ?? null
    const base = { status: 'signed', signed_at: now, signer_name: name, signer_consent: true, signer_ip: ip, signer_user_agent: ua }
    const extended = { ...base, document_hash: hash, signature_type: sigType, signature_data: sigData, consent_text: CONSENT_TEXT }
    // Only rows still open for signing can flip to signed (guards against double-submit and voiding races).
    const where = `contracts?id=eq.${contract.id}&status=in.(sent,viewed)`
    let upd = await rest<{ id: string }[]>(where, { method: 'PATCH', prefer: 'return=representation', body: extended })
    let storedOnRow = true
    if (isMissingColumn(upd)) {
      storedOnRow = false // esign migration not applied yet: keep hash + signature in the audit row.
      upd = await rest<{ id: string }[]>(where, { method: 'PATCH', prefer: 'return=representation', body: base })
    }
    if (!upd.ok) throw new Error(`sign update failed (${upd.status}) ${upd.error?.message ?? ''}`)
    if (!upd.data?.length) return gate(await load(token)) ?? json({ state: 'error', error: 'This contract can no longer be signed.' }, 409)

    await audit(contract.id, 'signed', contract.client_email, req.headers, JSON.stringify({
      signer_name: name, signed_at: now, document_hash_sha256: hash, document_version: doc.version,
      signature_type: sigType, consent: true, consent_text: CONSENT_TEXT,
      ...(storedOnRow ? {} : { signature_data: sigData }),
    }))

    await notify(contract, name, now, hash)
    return json({ state: 'complete', signed_at: now, document_hash: hash, signer_name: name, title: contract.contract_title, client_email: contract.client_email })
  } catch (e) { return handleError(e) }
}

function esc(s: string | null | undefined) {
  return (s ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]!))
}

async function notify(c: ContractRow, name: string, at: string, hash: string) {
  const key = process.env.RESEND_API_KEY
  if (!key) { console.warn('[esign] RESEND_API_KEY missing; skipping signed notifications'); return }
  const html = `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;background:#F6F3EE">
<h2 style="color:#1A3A5C">Contract signed</h2>
<p><strong>${esc(name)}</strong> signed <strong>${esc(c.contract_title)}</strong>.</p>
<p>Client: ${esc(c.client_name)}${c.client_business ? ` (${esc(c.client_business)})` : ''}<br>
Signed: ${esc(new Date(at).toUTCString())}<br>Document SHA-256: <code>${hash}</code></p>
<p style="font-size:12px;color:#666">Signed electronically under the U.S. ESIGN Act. Ask admin@yakini.digital for a copy of the signed agreement at any time.</p></div>`
  const to = [c.client_email, 'admin@yakini.digital'].filter(e => !isTestRecipient(e))
  // Test contracts (reserved test-domain client email) send nothing, including the admin copy.
  if (isTestRecipient(c.client_email)) { console.info('[esign] test contract; notifications suppressed'); return }
  for (const addr of to) {
    try {
      const r = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({ from: 'Yakini Contracts <admin@yakini.digital>', to: [addr], subject: `Signed: ${c.contract_title}`, html }),
      })
      if (!r.ok) console.error('[esign] resend failed', r.status)
    } catch (e) { console.error('[esign] resend error', e) }
  }
}
