import { test } from 'node:test'
import assert from 'node:assert/strict'
import { config } from '@/config/brand'
import {
  FOOTER_PROGRAM_LINKS, WHAT_WE_DO, brandProgramBySlug, legacyTitleSlug,
  missionFamilyPhoto, whatWeDoHref, whatWeDoPhoto,
} from '../public-pages'

const LIVE_SLUGS = [
  'unsheltered',
  'refugee-immigrant',
  'housing',
  'youth',
  'family-caregiver',
  'sankofa-center',
  'readiness-pilot',
]

test('every What We Do box opens a real program page, not a title slug', () => {
  assert.equal(WHAT_WE_DO.length, config.services.items.length)
  for (const service of config.services.items) {
    const href = whatWeDoHref(service.title)
    assert.match(href, /^\/programs\/[a-z0-9-]+$/)
    const slug = href.slice('/programs/'.length)
    assert.equal(LIVE_SLUGS.includes(slug), true)
    const guessed = `/programs/${legacyTitleSlug(service.title)}`
    if (!LIVE_SLUGS.includes(legacyTitleSlug(service.title))) {
      assert.notEqual(href, guessed)
    }
  }
  assert.equal(whatWeDoHref('Unsheltered Outreach & Stabilization'), '/programs/unsheltered')
  assert.equal(whatWeDoHref('Refugee & Immigrant Services'), '/programs/refugee-immigrant')
  assert.equal(whatWeDoHref('Housing Stability'), '/programs/housing')
  assert.equal(whatWeDoHref('Not a program'), '/programs')
})

test('footer program links are the same pages as What We Do', () => {
  const pages = new Set(WHAT_WE_DO.map((item) => item.href))
  for (const link of FOOTER_PROGRAM_LINKS) {
    assert.equal(pages.has(link.href), true)
  }
})

test('a known program still has its written description when the database row is missing', () => {
  const housing = brandProgramBySlug('housing')
  assert.equal(housing?.title, 'Housing Stability')
  assert.match(housing?.description ?? '', /Eviction prevention/)
  assert.equal(brandProgramBySlug('unsheltered-outreach-and-stabilization'), null)
  assert.equal(brandProgramBySlug('does-not-exist'), null)
})

test('mission and program photos stay empty until files are supplied', () => {
  assert.equal(missionFamilyPhoto.src, null)
  assert.equal(WHAT_WE_DO.every((item) => item.photo === null), true)
  assert.equal(whatWeDoPhoto('Housing Stability'), null)
})
