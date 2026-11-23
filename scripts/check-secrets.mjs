#!/usr/bin/env node
// Spec 14.2 / Phase 0 acceptance: fail if any tracked file contains something that looks like a
// secret VALUE. Env var NAMES are fine. Prints file:line and the pattern name, never the match.
import { execFileSync } from 'node:child_process'

const PATTERNS = [
  ['Stripe secret/restricted key', String.raw`\b(sk|rk)_(live|test)_[0-9a-zA-Z]{16,}`],
  ['Stripe webhook secret', String.raw`\bwhsec_[0-9a-zA-Z]{20,}`],
  ['xAI key', String.raw`\bxai-[0-9a-zA-Z]{30,}`],
  ['OpenAI-style key', String.raw`\bsk-(proj-)?[0-9a-zA-Z_-]{30,}`],
  ['Resend key', String.raw`\bre_[0-9a-zA-Z]{8}_[0-9a-zA-Z]{16,}`],
  ['GitHub token', String.raw`\bgh[pousr]_[0-9a-zA-Z]{30,}`],
  ['Supabase secret/service key', String.raw`\bsb_secret_[0-9a-zA-Z_-]{20,}`],
  ['JWT (e.g. service-role key)', String.raw`\beyJ[0-9a-zA-Z_-]{10,}\.eyJ[0-9a-zA-Z_-]{20,}\.[0-9a-zA-Z_-]{20,}`],
  ['Vercel token', String.raw`\bvc[pk]_[0-9a-zA-Z]{20,}`],
  ['Twilio auth', String.raw`\bSK[0-9a-f]{32}\b`],
  ['AWS access key', String.raw`\bAKIA[0-9A-Z]{16}\b`],
  ['Private key block', String.raw`-----BEGIN (RSA |EC |OPENSSH |)PRIVATE KEY-----`],
  ['Sentry auth token', String.raw`\bsntrys_[0-9a-zA-Z_=-]{30,}`],
  ['ElevenLabs key', String.raw`\bsk_[0-9a-f]{48}\b`],
]
// Scope: the Builder and everything it ships with. Override with SECRET_SCAN_PATHS="." for the whole repo.
const paths = (process.env.SECRET_SCAN_PATHS || 'apps/builder packages scripts .github turbo.json package.json apps/yakini.digital/lib apps/yakini.digital/next.config.ts').split(' ')
let found = 0
for (const [name, re] of PATTERNS) {
  let out = ''
  try {
    out = execFileSync('git', ['grep', '-n', '-I', '-E', '-l', '-e', re, '--', ...paths, ':!package-lock.json'], { encoding: 'utf8' })
  } catch (e) { if (e.status === 1) continue; throw e }
  for (const file of out.trim().split('\n').filter(Boolean)) { console.error(`possible ${name}: ${file}`); found++ }
}
if (found) { console.error(`Secret check FAILED: ${found} file(s). Move values to Vercel/Supabase env and rotate them.`); process.exit(1) }
console.log(`Secret check passed: no secret-looking values in ${paths.join(', ')}.`)
