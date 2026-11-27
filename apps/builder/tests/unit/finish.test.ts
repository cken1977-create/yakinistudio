import { describe, expect, it } from 'vitest'
import { designFixtures } from '@yakini/kits/design-fixtures'
import { loadSiteDoc } from '@yakini/site-schema'
import { finishHref, finishItems } from '@/lib/draft/finish'

/** "Finish your site" strip (D1 step 5). */
const all = designFixtures()
const doc = (name: string) => loadSiteDoc(structuredClone(all[name])).doc

describe('finish your site', () => {
  it('a sparse food truck draft gets its top 3 missing pieces, in order, each pointing at a real section', () => {
    const d = doc('food-truck-sparse')
    const items = finishItems(d)
    expect(items.map((i) => i.label)).toEqual(['Add your menu', 'Add your weekly stops', 'Add 3 photos'])
    for (const i of items) expect(d.pages.find((p) => p.id === i.pageId)?.sections.some((s) => s.id === i.sectionId)).toBe(true)
    expect(finishHref('abc', items[0])).toBe(`/sites/abc/edit?page=${items[0].pageId}&section=${items[0].sectionId}`)
  })
  it('every sparse kit draft gets 1 to 3 items; every rich fixture gets none', () => {
    for (const name of Object.keys(all)) {
      const n = finishItems(doc(name)).length
      if (name.endsWith('-sparse')) { expect(n, name).toBeGreaterThan(0); expect(n, name).toBeLessThanOrEqual(3) } else expect(n, name).toBe(0)
    }
  })
})
