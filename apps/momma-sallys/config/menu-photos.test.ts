import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = new URL('..', import.meta.url)
const menu = readFileSync(new URL('./app/menu/page.tsx', root), 'utf8')
const photos = readFileSync(new URL('./components/Photos.tsx', root), 'utf8')

const TAKEOUT = [
  {
    key: 'takeoutBox',
    file: 'takeout-box.webp',
    alt: 'Food in an open takeout box with a charred pepper, a lime wedge, and a sauce cup',
  },
  {
    key: 'takeoutClose',
    file: 'takeout-closeup.webp',
    alt: 'Close-up of food in a foil-lined takeout box with a charred pepper and a lime wedge',
  },
] as const

test('menu keeps the existing food photos and adds both takeout views', () => {
  for (const key of ['sausagePlate', 'brisketPlate', 'brisket', 'takeoutBox', 'takeoutClose']) {
    assert.match(menu, new RegExp(key))
  }
  assert.equal(menu.match(/takeoutBox/g)?.length, 1)
  assert.equal(menu.match(/takeoutClose/g)?.length, 1)
})

test('takeout alt text stays neutral', () => {
  for (const photo of TAKEOUT) {
    assert.match(photos, new RegExp(`alt: '${photo.alt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}'`))
    assert.doesNotMatch(photo.alt, /taco|burrito|nacho|beef|chicken|brisket|\$|price|ingredient/i)
  }
})

test('takeout webp files keep the frame and carry no metadata', async () => {
  for (const photo of TAKEOUT) {
    const meta = await sharp(fileURLToPath(new URL(`./public/photos/${photo.file}`, root))).metadata()
    assert.equal(meta.format, 'webp')
    assert.equal(meta.width, 960)
    assert.equal(meta.height, 1280)
    assert.equal(meta.exif, undefined)
    assert.equal(meta.icc, undefined)
    assert.equal(meta.xmp, undefined)
  }
})
