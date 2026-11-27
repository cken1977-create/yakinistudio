import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { loadSiteDoc } from '@yakini/site-schema'
import { BUILDER_KIT_IDS } from './index'
import { designFixtures } from './design-fixtures'

/** The JSON copies other packages and the browser tests read. UPDATE_FIXTURES=1 rewrites them. */
const DIR = join(__dirname, '../../site-schema/fixtures/design')
const all = designFixtures()
const placeholders = (v: unknown) => JSON.stringify(v).match(/\[\[[^\]]*\]\]/g) ?? []
const imageIds = (v: unknown) => [...JSON.stringify(v).matchAll(/"assetId":"([^"]+)"/g)].map((m) => m[1])

describe('design fixtures (quality harness)', () => {
  it('there is a rich and a sparse fixture for every kit, and each is a valid site', () => {
    expect(Object.keys(all).sort()).toEqual(BUILDER_KIT_IDS.flatMap((k) => [`${k}-rich`, `${k}-sparse`]).sort())
    for (const [name, doc] of Object.entries(all)) expect(() => loadSiteDoc(structuredClone(doc)), name).not.toThrow()
  })
  it('rich fixtures are complete: no placeholders, 8+ photos, phone, address and hours', () => {
    for (const k of BUILDER_KIT_IDS) {
      const doc = loadSiteDoc(structuredClone(all[`${k}-rich`])).doc
      expect(placeholders(doc), k).toEqual([])
      // 8+ photos on the site; the general kit has 6 of its own, so its gallery repeats two.
      expect(imageIds(doc).length, k).toBeGreaterThanOrEqual(8)
      expect(new Set(imageIds(doc)).size, k).toBeGreaterThanOrEqual(6)
      expect(doc.business.phone && doc.business.address && doc.business.hours?.length, k).toBeTruthy()
    }
  })
  it('sparse fixtures have only the name and one line: everything else is still to fill in', () => {
    for (const k of BUILDER_KIT_IDS) {
      const doc = loadSiteDoc(structuredClone(all[`${k}-sparse`])).doc
      expect(doc.business.phone ?? doc.business.address ?? null, k).toBeNull()
      expect(placeholders(doc).length, k).toBeGreaterThan(0)
    }
  })
  it('the JSON copies match (UPDATE_FIXTURES=1 rewrites them)', () => {
    if (process.env.UPDATE_FIXTURES === '1') {
      if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true })
      for (const f of readdirSync(DIR)) if (f.endsWith('.json')) writeFileSync(join(DIR, f), '') // stale files show up as empty
      for (const [name, doc] of Object.entries(all)) writeFileSync(join(DIR, `${name}.json`), `${JSON.stringify(doc, null, 2)}\n`)
    }
    const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort()
    expect(files).toEqual(Object.keys(all).map((n) => `${n}.json`).sort())
    for (const [name, doc] of Object.entries(all)) expect(JSON.parse(readFileSync(join(DIR, `${name}.json`), 'utf8')), name).toEqual(JSON.parse(JSON.stringify(doc)))
  })
})
