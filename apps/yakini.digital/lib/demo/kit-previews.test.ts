import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { KITS } from '../pricing'
import { previewFor } from './kit-previews'

const PUBLIC_TOURS = new Set([
  'https://yakini-foodtruck-demo.vercel.app',
  'https://mommasallys-demo.vercel.app',
  'https://yakini-landlord-demo.vercel.app',
  'https://yakini-realestate-demo.vercel.app',
  'https://yakini-transport-demo.vercel.app',
  'https://yakini-oilfield-demo.vercel.app',
  'https://vizionz-sankofa-demo.vercel.app',
  'https://abc-prep-demo.vercel.app',
])

describe('kit previews', () => {
  it('gives every kit at least two panes with distinct tables and rows', () => {
    for (const kit of KITS) {
      const preview = previewFor(kit.id)
      assert.ok(preview.nav.length >= 2, `${kit.id} should have multiple walkable tabs`)
      const titles = preview.nav.map((p) => p.tableTitle)
      assert.equal(new Set(titles).size, titles.length, `${kit.id} tabs should show different tables`)
      for (const pane of preview.nav) {
        assert.ok(pane.rows.length >= 1, `${kit.id}/${pane.id} needs sample rows`)
        assert.ok(pane.stats.length >= 1, `${kit.id}/${pane.id} needs stats`)
      }
    }
  })

  it('only offers full tours on known public, no-login hosts', () => {
    for (const kit of KITS) {
      const preview = previewFor(kit.id)
      if (!preview.tourUrl) continue
      assert.ok(PUBLIC_TOURS.has(preview.tourUrl), `unexpected tour for ${kit.id}: ${preview.tourUrl}`)
      assert.ok(!/ramos-tree-walkthrough|long-tree-demo|cartel-oil-demo/i.test(preview.tourUrl))
    }
  })
})
