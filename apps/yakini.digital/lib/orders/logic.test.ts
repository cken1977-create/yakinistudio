import assert from 'node:assert/strict'
import test from 'node:test'
import {
  formatCents,
  intakeFromDraft,
  isSelectable,
  parseCatalog,
  publicPlans,
  suggestHostname,
  suggestPlanId,
  timelineBlocks,
  toggleFeature,
  type Catalog,
  type Draft,
} from './logic.ts'

const catalog = parseCatalog({
  templates: [
    { id: 'home-services', label: 'Home services', playbook: 'home-services' },
    { id: 'builtin', label: 'Something else', playbook: 'builtin' },
  ],
  features: [
    { id: 'texting', label: 'Business texting line', detail: 'Texts.', group: 'Talk to customers', state: 'selectable', needs: [] },
    { id: 'booking', label: 'Online booking', detail: 'Times.', group: 'Get found and booked', state: 'selectable', needs: [] },
    { id: 'inboundTexts', label: 'Incoming texts in one place', detail: 'Threads.', group: 'Talk to customers', state: 'selectable', needs: ['texting'] },
    { id: 'missedCall', label: 'Missed-call text-back', detail: 'Text-back.', group: 'Talk to customers', state: 'selectable', needs: ['texting'] },
    { id: 'payments', label: 'Card payments', detail: 'Invoices.', group: 'Get paid', state: 'opening_soon', needs: [] },
    { id: 'pipeline', label: 'Ask your Yakini person', detail: 'Not yet.', group: 'Ask your Yakini person', state: 'ask', needs: [] },
  ],
  plans: [
    { id: 'operate', name: 'Operate', priceCents: 24900, setupCents: 49900, interval: 'month', modules: ['texting', 'booking', 'inboundTexts'], lockedMonths: null, open: true },
    { id: 'grow', name: 'Grow', priceCents: 44900, setupCents: 79900, interval: 'month', modules: ['texting', 'booking', 'inboundTexts', 'payments', 'missedCall'], lockedMonths: null, open: true },
    { id: 'founding', name: 'Founding', priceCents: 17900, setupCents: 49900, interval: 'month', modules: ['texting', 'booking', 'inboundTexts'], lockedMonths: 12, open: true },
    { id: 'partner', name: 'Partner', priceCents: 0, setupCents: 0, interval: 'month', modules: [], lockedMonths: null, open: true },
  ],
  domain: { defaultKind: 'portal', registerTlds: ['.com', '.net', '.org', '.us'] },
}) as Catalog

function draft(over: Partial<Draft> = {}): Draft {
  return {
    templateId: 'home-services',
    featureIds: ['booking'],
    planId: 'founding',
    planTouched: true,
    domainKind: 'existing',
    domain: 'theirbusiness.com',
    hostname: 'portal.theirbusiness.com',
    hostnameTouched: true,
    preferredNames: [''],
    contact: { name: 'Ada Owner', email: 'ada@theirbusiness.com', phone: '(346) 623-2199', businessName: 'Their Business' },
    ...over,
  }
}

test('catalog prices are read from cents, never typed as stickers', () => {
  assert.equal(formatCents(17900), '$179')
  assert.equal(formatCents(1125), '$11.25')
})

test('partner is never a public plan, and closed founding is hidden', () => {
  assert.deepEqual(publicPlans(catalog, { total: 10, left: 9, open: true }).map((plan) => plan.id), ['founding', 'operate', 'grow'])
  assert.deepEqual(publicPlans(catalog, { total: 10, left: 0, open: false }).map((plan) => plan.id), ['operate', 'grow'])
})

test('only selectable features can be picked, and texting is pulled in when it is needed', () => {
  assert.equal(isSelectable(catalog.features.find((feature) => feature.id === 'payments')!), false)
  assert.deepEqual(toggleFeature([], 'payments', catalog), [])
  assert.deepEqual(toggleFeature([], 'inboundTexts', catalog), ['texting', 'inboundTexts'])
  assert.deepEqual(toggleFeature(['texting', 'inboundTexts'], 'texting', catalog), [])
})

test('founding is suggested while spots remain, grow when a grow-only feature is picked', () => {
  const seats = { total: 10, left: 9, open: true }
  assert.equal(suggestPlanId(catalog, ['booking'], seats), 'founding')
  assert.equal(suggestPlanId(catalog, ['missedCall'], seats), 'grow')
  assert.equal(suggestPlanId(catalog, ['booking'], { total: 10, left: 0, open: false }), 'operate')
})

test('a domain defaults to portal.theirbusiness.com', () => {
  assert.equal(suggestHostname('TheirBusiness.com', 'portal'), 'portal.theirbusiness.com')
  assert.equal(suggestHostname('https://www.theirbusiness.com/about', 'portal'), 'portal.theirbusiness.com')
  assert.equal(suggestHostname('portal.theirbusiness.com', 'portal'), 'portal.theirbusiness.com')
})

test('the intake body uses catalog ids and refuses a coming-soon feature or partner', () => {
  const body = intakeFromDraft(draft(), catalog, { total: 10, left: 9, open: true })
  assert.deepEqual(body, {
    templateId: 'home-services',
    featureIds: ['booking'],
    planId: 'founding',
    domain: { kind: 'existing', domain: 'theirbusiness.com', hostname: 'portal.theirbusiness.com' },
    contact: { name: 'Ada Owner', email: 'ada@theirbusiness.com', phone: '(346) 623-2199', businessName: 'Their Business' },
  })
  assert.equal(intakeFromDraft(draft({ featureIds: ['payments'], planId: 'grow' }), catalog, null), null)
  assert.equal(intakeFromDraft(draft({ planId: 'partner' }), catalog, null), null)
  assert.equal(intakeFromDraft(draft({ planId: 'operate', featureIds: ['missedCall'] }), catalog, null), null)
})

test('registering a domain collects preferred names', () => {
  const body = intakeFromDraft(draft({
    domainKind: 'register',
    preferredNames: ['Their Business', 'x'],
  }), catalog, null)
  assert.deepEqual(body?.domain, { kind: 'register', preferredNames: ['Their Business'] })
})

test('timeline copy does not name vendors and tells the texting wait plainly', () => {
  const text = timelineBlocks('portal.theirbusiness.com').map((block) => `${block.title} ${block.body}`).join(' ').toLowerCase()
  for (const banned of ['supabase', 'vercel', 'twilio', 'stripe', 'gohighlevel', 'highlevel', 'resend']) {
    assert.equal(text.includes(banned), false, banned)
  }
  assert.match(text, /no card is charged/)
  assert.match(text, /1 to 4 weeks/)
  assert.match(text, /portal\.theirbusiness\.com/)
})
