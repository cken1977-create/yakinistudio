import { test } from 'node:test'
import assert from 'node:assert/strict'
import { config } from '@/config/brand'
import {
  FOOTER_ABOUT, FOOTER_ENGAGE, FOOTER_PROGRAM_LINKS, HEADER_LINKS, WHAT_WE_DO,
  COMMUNITY_GALLERY, RESERVED_COMMUNITY_PHOTOS, STAFF_BANNER, STAFF_LOGIN_PHOTO,
  HOUSING_ILLUSTRATION, brandProgramBySlug, footerHrefs, legacyTitleSlug, missionFamilyPhoto, programFigure, programFigures, whatWeDoHref, whatWeDoPhoto,
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

test('header and footer links stay on pages that exist, and missing pages are not links', () => {
  const existing = new Set([
    '/', '/about', '/programs', '/gallery', '/partners', '/voices', '/contact', '/get-help',
    ...WHAT_WE_DO.map((item) => item.href),
  ])
  for (const link of HEADER_LINKS) assert.equal(existing.has(link.href), true, link.href)
  for (const href of footerHrefs()) assert.equal(existing.has(href), true, href)
  const labels = [...FOOTER_ABOUT, ...FOOTER_ENGAGE]
  assert.equal(labels.find((item) => item.label === 'Leadership' && !('href' in item))?.label, 'Leadership')
  assert.equal(labels.find((item) => item.label === 'Volunteer' && !('href' in item))?.label, 'Volunteer')
  assert.equal(footerHrefs().includes('/staff'), false)
  assert.equal(footerHrefs().includes('/volunteer'), false)
})

test('a known program still has its written description when the database row is missing', () => {
  const housing = brandProgramBySlug('housing')
  assert.equal(housing?.title, 'Housing Stability')
  assert.match(housing?.description ?? '', /Eviction prevention/)
  assert.equal(brandProgramBySlug('unsheltered-outreach-and-stabilization'), null)
  assert.equal(brandProgramBySlug('does-not-exist'), null)
})

test('community photos are real files and do not claim a program from appearance', () => {
  assert.equal(missionFamilyPhoto.src, '/community/gathering-celebration.jpg')
  assert.equal(WHAT_WE_DO.filter((item) => item.photo).every((item) => item.photo?.startsWith('/community/')), true)
  for (const item of WHAT_WE_DO) {
    assert.doesNotMatch(item.photoAlt, /patient|diagnos|unsheltered person|refugee status|enrolled/i)
  }
  assert.equal(whatWeDoPhoto('Refugee & Immigrant Services')?.src, '/community/gathering-room.jpg')
  assert.equal(programFigure('refugee-immigrant')?.src, '/community/gathering-room.jpg')
  assert.equal(programFigure('refugee-immigrant')?.fit, 'natural')
  assert.equal(whatWeDoPhoto('Housing Stability')?.src, HOUSING_ILLUSTRATION.src)
  assert.equal(whatWeDoPhoto('Housing Stability')?.illustrative, true)
  assert.match(HOUSING_ILLUSTRATION.licenseHref, /^https:\/\/www\.pexels\.com\/license\/$/)
  assert.equal(programFigure('housing')?.src, HOUSING_ILLUSTRATION.src)
  assert.doesNotMatch(whatWeDoPhoto('Housing Stability')?.alt ?? '', /client|recipient|voucher/i)
  assert.equal(programFigures('sankofa-center')[0]?.src, '/community/four-people.jpg')
  assert.equal(programFigures('sankofa-center')[0]?.fit, 'natural')
  assert.equal(programFigures('unsheltered').some((item) => item.src === '/community/services-flyer.jpg'), true)
  assert.equal(programFigures('sankofa-center').some((item) => item.src === '/community/services-flyer.jpg'), true)
  assert.notEqual(whatWeDoPhoto('Refugee & Immigrant Services')?.src, '/community/meeting-room.jpg')
  const shown = [
    missionFamilyPhoto.src,
    ...WHAT_WE_DO.map((item) => item.photo),
    ...COMMUNITY_GALLERY.map((item) => item.src),
    STAFF_BANNER.src,
    STAFF_LOGIN_PHOTO.src,
  ]
  assert.equal(shown.includes(RESERVED_COMMUNITY_PHOTOS[0].src), false)
})
