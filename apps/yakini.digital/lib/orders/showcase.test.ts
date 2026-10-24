import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCatalog, type Catalog } from './logic.ts'
import { BUSINESSES, filterBusinesses, resolveTemplate } from './businesses.ts'
import { ADDON_SECTION, addonPriceText, addonRowLabel, addonSummaryHeading, itemStatus, rowStatusLabel, showcaseItems, type ShowcaseItem } from './showcase.ts'
import { ADDON_PLAN_LINE, HONEST_PRICE_LINE, INCLUDED_NOT_ADDONS, INTEGRATIONS_COPY, PLAN_HIGHLIGHTS, PLANS, PRICE_PROMISE, SEE_BEFORE_YOU_PAY, SETUP_INCLUDES } from '../pricing.ts'

const catalog = parseCatalog({
  templates: [
    { id: 'home-services', label: 'Home services', playbook: 'home-services' },
    { id: 'construction', label: 'Construction', playbook: 'construction' },
    { id: 'hospitality', label: 'Hospitality', playbook: 'hospitality' },
    { id: 'builtin', label: 'Something else', playbook: 'builtin' },
  ],
  features: [
    { id: 'texting', label: 'Texting', detail: '', group: 'Talk', state: 'selectable', needs: [] },
    { id: 'aiDrafts', label: 'Drafts', detail: '', group: 'Talk', state: 'selectable', needs: [] },
    { id: 'helpDesk', label: 'Help', detail: '', group: 'Talk', state: 'selectable', needs: [] },
    { id: 'inboundTexts', label: 'Inbox', detail: '', group: 'Talk', state: 'selectable', needs: ['texting'] },
    { id: 'missedCall', label: 'Missed', detail: '', group: 'Talk', state: 'selectable', needs: ['texting'] },
    { id: 'ownerReport', label: 'Report', detail: '', group: 'Keep', state: 'selectable', needs: [] },
    { id: 'booking', label: 'Booking', detail: '', group: 'Book', state: 'selectable', needs: [] },
    { id: 'intakeForm', label: 'Form', detail: '', group: 'Book', state: 'selectable', needs: [] },
    { id: 'voiceNotes', label: 'Voice', detail: '', group: 'Talk', state: 'selectable', needs: [] },
    { id: 'payments', label: 'Pay', detail: '', group: 'Pay', state: 'opening_soon', needs: [] },
    { id: 'campaigns', label: 'Campaigns', detail: '', group: 'Keep', state: 'opening_soon', needs: [] },
    { id: 'reviews', label: 'Reviews', detail: '', group: 'Keep', state: 'opening_soon', needs: [] },
    { id: 'aiAnswer', label: 'Ask', detail: '', group: 'Ask', state: 'ask', needs: [] },
    { id: 'pipeline', label: 'Ask', detail: '', group: 'Ask', state: 'ask', needs: [] },
  ],
  plans: [
    { id: 'operate', name: 'Operate', priceCents: 24900, setupCents: 49900, interval: 'month', modules: ['texting'], lockedMonths: null, open: true },
  ],
  domain: { defaultKind: 'portal', registerTlds: ['.com'] },
}) as Catalog

test('business types map only onto catalog templates', () => {
  const allowed = new Set(['home-services', 'construction', 'hospitality', 'builtin'])
  for (const business of BUSINESSES) {
    assert.equal(allowed.has(business.templateId), true, business.id)
    assert.equal(resolveTemplate(business.id, catalog), business.templateId)
  }
  assert.equal(resolveTemplate('nope', catalog), '')
  assert.match(filterBusinesses('plumber').map((item) => item.id).join(','), /trades/)
  assert.equal(filterBusinesses('zzzz').some((item) => item.id === 'other'), true)
})

test('a missing template falls back to the general one', () => {
  const thin = parseCatalog({
    ...{
      templates: [{ id: 'builtin', label: 'Something else', playbook: 'builtin' }],
      features: catalog.features,
      plans: catalog.plans,
      domain: catalog.domain,
    },
  }) as Catalog
  assert.equal(resolveTemplate('construction', thin), 'builtin')
})

test('only live catalog features are Included', () => {
  for (const entry of showcaseItems()) {
    const status = itemStatus(entry, catalog)
    if (status === 'included') {
      const feature = catalog.features.find((item) => item.id === entry.moduleId)
      assert.equal(feature?.state, 'selectable', entry.id)
    }
    if (entry.moduleId === 'payments' || entry.moduleId === 'reviews' || entry.moduleId === 'campaigns') {
      assert.equal(status, 'soon', entry.id)
    }
    if (entry.moduleId === 'aiAnswer' || entry.moduleId === 'pipeline') {
      assert.equal(status, 'addon', entry.id)
    }
  }
  assert.equal(itemStatus(showcaseItems().find((item) => item.id === 'domain')!, catalog), 'setup')
  assert.equal(itemStatus(showcaseItems().find((item) => item.id === 'calling-desk')!, catalog), 'addon')
  for (const id of ['pay-processor', 'accounting', 'calendar', 'import-list', 'site-links', 'phone-line', 'email-box', 'publicApi', 'software-connection', 'whatsapp', 'staff-calendars']) {
    assert.equal(itemStatus(showcaseItems().find((item) => item.id === id)!, catalog), 'addon', id)
  }
})

test('add-ons keep null prices and say priced with you', () => {
  const addons = showcaseItems().filter((entry) => itemStatus(entry, catalog) === 'addon')
  assert.ok(addons.length > 0)
  for (const named of ['aiAnswer', 'calling-desk', 'whatsapp', 'staff-calendars', 'pipeline', 'pay-processor']) {
    assert.equal(addons.some((entry) => entry.id === named), true, named)
  }
  for (const entry of addons) {
    assert.equal(entry.monthlyCents, null, entry.id)
    assert.equal(entry.setupCents, null, entry.id)
    assert.equal(addonPriceText(entry), 'priced with you', entry.id)
    assert.equal(addonRowLabel(entry), 'Premium add-on, priced with you', entry.id)
    assert.equal(rowStatusLabel(entry, 'addon'), 'Premium add-on, priced with you', entry.id)
  }
  const priced = { monthlyCents: 4000, setupCents: 15000 } as Pick<ShowcaseItem, 'monthlyCents' | 'setupCents'>
  assert.equal(addonPriceText(priced), '$40 a month · $150 setup')
  assert.equal(addonRowLabel(priced), 'Premium add-on, $40 a month · $150 setup')
  assert.equal(addonPriceText({ monthlyCents: null, setupCents: null }), 'priced with you')
  assert.equal(addonSummaryHeading(addons), 'Premium add-ons you picked, priced with you on your kickoff call')
  assert.equal(addonSummaryHeading([priced]), 'Premium add-ons you picked')
  assert.equal(ADDON_SECTION.title, 'Premium add-ons')
  assert.match(ADDON_SECTION.lede, /Built custom for your business/)
  assert.match(ADDON_SECTION.lede, /priced separately from your plan/)
  const extra = addons.reduce((sum, entry) => sum + (entry.monthlyCents ?? 0) + (entry.setupCents ?? 0), 0)
  assert.equal(extra, 0)
})

test('customer copy does not name vendors or claim unlimited seats', () => {
  const text = [
    ...showcaseItems().flatMap((item) => [item.name, item.detail, ...item.points]),
    ...BUSINESSES.map((item) => item.label),
    PRICE_PROMISE.title,
    PRICE_PROMISE.body,
    HONEST_PRICE_LINE,
    ADDON_PLAN_LINE,
    ADDON_SECTION.title,
    ADDON_SECTION.lede,
    INTEGRATIONS_COPY.title,
    INTEGRATIONS_COPY.body,
    ...INCLUDED_NOT_ADDONS,
    ...Object.values(PLAN_HIGHLIGHTS).flatMap((plan) => [plan.tagline, ...plan.bullets]),
  ].join(' ').toLowerCase()
  for (const banned of ['supabase', 'vercel', 'twilio', 'stripe', 'gohighlevel', 'highlevel', 'unlimited contact', 'unlimited user', 'unlimited room']) {
    assert.equal(text.includes(banned), false, banned)
  }
  assert.match(text, /premium add-on, priced with you|priced with you/)
  assert.equal(text.includes('custom build: quoted'), false)
  assert.equal(ADDON_PLAN_LINE, 'Need more? Premium add-ons, like an AI that answers for you, are priced separately from your plan.')
  const includedClaim = [
    ...Object.values(PLAN_HIGHLIGHTS).flatMap((plan) => [plan.tagline, ...plan.bullets]),
    ...SETUP_INCLUDES,
    ...INCLUDED_NOT_ADDONS,
  ].join(' ').toLowerCase()
  for (const phrase of ['answers on its own', 'answers for you', 'whatsapp', 'placing and receiving', 'stay in sync', 'customers and deals', 'payment processor', 'calling desk']) {
    assert.equal(includedClaim.includes(phrase), false, phrase)
  }
  assert.match(PRICE_PROMISE.body, /80%/)
  assert.match(PRICE_PROMISE.body, /\$150 an hour/)
  assert.equal(PLAN_HIGHLIGHTS.founding.bullets.some((line) => line.includes('$10')), true)
  assert.equal(PLAN_HIGHLIGHTS.grow.bullets.some((line) => line.includes('$25')), true)
  assert.equal(PLAN_HIGHLIGHTS.operate.bullets.some((line) => /unlimited/i.test(line)), false)
  assert.equal(PLANS.find((plan) => plan.id === 'grow')?.setup, 499)
  assert.equal(SEE_BEFORE_YOU_PAY, 'See everything before you pay.')
  assert.equal(HONEST_PRICE_LINE, 'No free-trial card trap, and no usage fees added later. What you see is what you pay.')
  const setup = SETUP_INCLUDES.join(' ')
  const setupLower = setup.toLowerCase()
  assert.equal(setupLower.includes('import'), false)
  assert.equal(setupLower.includes('team'), false)
  assert.match(setup, /1 to 4 weeks/)
  assert.equal(/\$\d/.test(setup), false)
  for (const line of SETUP_INCLUDES) assert.match(line, /included/i)
  assert.match(setup, /Your kickoff call with a real Yakini operator, included/)
  assert.match(setup, /Your system set up and branded for you, included/)
  assert.match(setup, /Help desk with a real person, included/)
})
