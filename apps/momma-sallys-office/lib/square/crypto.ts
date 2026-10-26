// AES-256-GCM for OAuth tokens at rest. Key: SQUARE_TOKEN_ENCRYPTION_KEY,
// 32 random bytes, base64. Generate with: openssl rand -base64 32
import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual, createHash } from 'node:crypto'

const PREFIX = 'v1'

function keyFrom(b64: string): Buffer {
  const key = Buffer.from(b64, 'base64')
  if (key.length !== 32) throw new Error('Token encryption key must be 32 bytes (base64)')
  return key
}

export function encryptSecret(plain: string, keyB64: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', keyFrom(keyB64), iv)
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [PREFIX, iv.toString('base64'), tag.toString('base64'), ct.toString('base64')].join(':')
}

export function decryptSecret(blob: string, keyB64: string): string {
  const [v, ivB64, tagB64, ctB64] = blob.split(':')
  if (v !== PREFIX || !ivB64 || !tagB64 || ctB64 === undefined) throw new Error('Unrecognized token format')
  const decipher = createDecipheriv('aes-256-gcm', keyFrom(keyB64), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([decipher.update(Buffer.from(ctB64, 'base64')), decipher.final()]).toString('utf8')
}

/** Constant-time string compare (equal-length hashes, so length never leaks). */
export function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb) && a.length === b.length
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}
