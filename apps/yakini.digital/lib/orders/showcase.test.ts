import assert from 'node:assert/strict'
import test from 'node:test'
import { parseCatalog, type Catalog } from './logic.ts'
import { BUSINESSES, filterBusinesses, resolveTemplate } from './businesses.ts'
import { itemStatus, showcaseItems } from './showcase.ts'
import { INCLUDED_NOT_ADDONS, PLAN_HIGHLIGHTS, PLANS, PRICE_PROMISE, SEE_BEFORE_YOU_PAY, SETUP_INCLUDES } from '../pricing.ts'

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
      assert.equal(status, 'custom', entry.id)
    }
  }
  assert.equal(itemStatus(showcaseItems().find((item) => item.id === 'domain')!, catalog), 'setup')
  assert.equal(itemStatus(showcaseItems().find((item) => item.id === 'calling-desk')!, catalog), 'custom')
  for (const id of ['pay-processor', 'accounting', 'calendar', 'import-list', 'site-links', 'phone-line', 'email-box', 'publicApi']) {
    assert.equal(itemStatus(showcaseItems().find((item) => item.id === id)!, catalog), 'custom', id)
  }
})

test('customer copy does not name vendors or claim unlimited seats', () => {
  const text = [
    ...showcaseItems().flatMap((item) => [item.name, item.detail, ...item.points]),
    ...BUSINESSES.map((item) => item.label),
    PRICE_PROMISE.title,
    PRICE_PROMISE.body,
    ...INCLUDED_NOT_ADDONS,
    ...Object.values(PLAN_HIGHLIGHTS).flatMap((plan) => [plan.tagline, ...plan.bullets]),
  ].join(' ').toLowerCase()
  for (const banned of ['supabase', 'vercel', 'twilio', 'stripe', 'gohighlevel', 'highlevel', 'unlimited contact', 'unlimited user', 'unlimited room']) {
    assert.equal(text.includes(banned), false, banned)
  }
  assert.match(text, /custom build: quoted|quoted before any work/)
  assert.match(PRICE_PROMISE.body, /80%/)
  assert.match(PRICE_PROMISE.body, /\$150 an hour/)
  assert.equal(PLAN_HIGHLIGHTS.founding.bullets.some((line) => line.includes('$10')), true)
  assert.equal(PLAN_HIGHLIGHTS.grow.bullets.some((line) => line.includes('$25')), true)
  assert.equal(PLAN_HIGHLIGHTS.operate.bullets.some((line) => /unlimited/i.test(line)), false)
  assert.equal(PLANS.find((plan) => plan.id === 'grow')?.setup, 499)
  assert.equal(SEE_BEFORE_YOU_PAY, 'See everything before you pay.')
  const setup = SETUP_INCLUDES.join(' ').toLowerCase()
  assert.equal(setup.includes('import'), false)
  assert.equal(setup.includes('team'), false)
  assert.match(setup, /1 to 4 weeks/)
})
