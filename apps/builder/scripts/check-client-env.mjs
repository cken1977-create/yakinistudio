#!/usr/bin/env node
// Spec 14.2: fail if client code ('use client' files) reads a non-NEXT_PUBLIC_ env var or imports
// server-only modules (lib/server, the service-role key name). Run in CI.
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = new URL('..', import.meta.url).pathname
const skip = new Set(['node_modules', '.next', 'playwright-report', 'test-results', 'tests', 'supabase', 'scripts'])
const problems = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    if (skip.has(name)) continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) { walk(p); continue }
    if (!/\.(tsx?|mjs|js)$/.test(name)) continue
    const src = readFileSync(p, 'utf8')
    const isClient = /^\s*['"]use client['"]/.test(src) || /instrumentation-client\.ts$/.test(name)
    if (!isClient) continue
    for (const m of src.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      if (!m[1].startsWith('NEXT_PUBLIC_') && m[1] !== 'NODE_ENV') problems.push(`${relative(root, p)}: reads ${m[1]} in client code`)
    }
    if (/from ['"](@\/)?lib\/server|SUPABASE_SERVICE_ROLE_KEY|['"]server-only['"]/.test(src)) problems.push(`${relative(root, p)}: imports server-only code`)
  }
}
walk(root)
if (problems.length) { console.error('Client env check FAILED:\n' + problems.join('\n')); process.exit(1) }
console.log('Client env check passed: client code reads only NEXT_PUBLIC_* names.')
