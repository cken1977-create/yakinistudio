#!/usr/bin/env node
/**
 * Bundles the published-page renderer (lib/site/render-entry.tsx, with @yakini/sections, kits and
 * its own copy of React) into one file: .site-renderer/render.cjs. The renderer route loads it at
 * runtime, so published pages are rendered by plain react-dom/server outside Next.js and ship no
 * framework JavaScript (perf decision 2026-11-27). Runs before build, dev and tests.
 */
import { build } from 'esbuild'
import { mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const app = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const out = join(app, '.site-renderer', 'render.cjs')
mkdirSync(dirname(out), { recursive: true })
await build({
  entryPoints: [join(app, 'lib/site/render-entry.tsx')],
  outfile: out,
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node20',
  jsx: 'automatic',
  minify: true,
  legalComments: 'linked',
  alias: { '@': app },
  define: { 'process.env.NODE_ENV': '"production"' },
  loader: { '.json': 'json' },
  logLevel: 'warning',
})
console.log(`site renderer bundled: ${out}`)
