import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** Fixture names and their page addresses, read straight from the JSON files (D1 quality harness). */
const ROOT = join(__dirname, '../../../../packages/site-schema/fixtures')
type Doc = { pages: { slug: string }[] }

function read(dir: string, prefix = ''): { name: string; slugs: string[] }[] {
  return readdirSync(join(ROOT, dir)).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const doc = JSON.parse(readFileSync(join(ROOT, dir, f), 'utf8')) as Doc
    return { name: `${prefix}${f.replace(/\.json$/, '')}`, slugs: doc.pages.map((p) => p.slug) }
  })
}

export const DESIGN_FIXTURES = read('design')
export const V1_FIXTURES = read('v1')
/** v2 every-section fixtures (new variants such as the cinematic hero), served as `v2-<name>`. */
export const V2_FIXTURES = read('v2', 'v2-')
export const RICH = DESIGN_FIXTURES.filter((f) => f.name.endsWith('-rich'))
export const fixtureUrl = (name: string, slug: string, mode: 'live' | 'draft') => `/dev-site/${name}${slug ? `/${slug}` : ''}${mode === 'draft' ? '?mode=draft' : ''}`
