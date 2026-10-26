import { test } from 'node:test'
import assert from 'node:assert/strict'
import { FUNDERS, funderByKey } from '../funders'
import { resolvePeriod, mountainDate } from '../period'
import { ageBand, buildFunderReport, countyFor, summaryCsvRows, toCsv, type ReportParticipant, type ReportService } from '../aggregate'

const P = (id: string, extra: Partial<ReportParticipant> = {}): ReportParticipant => ({
  id, gender: null, race_ethnicity: null, primary_language: 'English', veteran_status: null,
  disability_status: null, household_size: null, intake_date: '2026-01-05', current_stage: 'enrolled', ...extra,
})
const S = (pid: string, at: string, funder: string | null, extra: Partial<ReportService> = {}): ReportService => ({
  participant_id: pid, service_type_id: 't1', delivered_at: at, units: 1, funder_key: funder, ...extra,
})
const types = [{ id: 't1', name: 'Housing navigation', countable_unit: 'session' }]
const oct = resolvePeriod({ period: 'this_month' }, '2026-10-17')

test('six funders, including Housing NM split by county', () => {
  assert.equal(FUNDERS.length, 6)
  assert.deepEqual(FUNDERS.map((f) => f.key), ['acf', 'bernalillo_county', 'state_nm', 'city_abq', 'medicaid', 'housing_nm'])
  assert.equal(funderByKey('housing_nm')?.byCounty, true)
  assert.equal(funderByKey('acf')?.name, 'Albuquerque Community Foundation')
  assert.equal(funderByKey('mfa'), null)
})

test('periods are Mountain-time calendar ranges', () => {
  assert.deepEqual([oct.start, oct.end], ['2026-10-01', '2026-10-31'])
  const lm = resolvePeriod({ period: 'last_month' }, '2026-01-10')
  assert.deepEqual([lm.start, lm.end], ['2025-12-01', '2025-12-31'])
  const lq = resolvePeriod({ period: 'last_quarter' }, '2026-02-10')
  assert.deepEqual([lq.start, lq.end], ['2025-10-01', '2025-12-31'])
  const tq = resolvePeriod({ period: 'this_quarter' }, '2026-10-17')
  assert.deepEqual([tq.start, tq.end], ['2026-10-01', '2026-12-31'])
  const c = resolvePeriod({ period: 'custom', from: '2026-05-01', to: '2026-03-01' }, '2026-10-17')
  assert.deepEqual([c.start, c.end], ['2026-03-01', '2026-05-01'])
  const bad = resolvePeriod({ period: 'nonsense' }, '2026-10-17')
  assert.equal(bad.preset, 'all_time')
  assert.equal(bad.start, '2021-01-01')
  assert.equal(bad.end, '2026-10-17')
  const none = resolvePeriod({}, '2026-10-25')
  assert.equal(none.preset, 'all_time')
  // 11pm Mountain on Oct 31 is Nov 1 in UTC; it still counts in October.
  assert.equal(mountainDate('2026-11-01T05:00:00Z'), '2026-10-31')
})

test('one entry feeds every funder; tagged funders count only their services', () => {
  const people = [P('a', { intake_date: '2026-10-02' }), P('b'), P('c')]
  const services = [
    S('a', '2026-10-03T16:00:00Z', 'housing_nm', { units: 2 }),
    S('a', '2026-10-04T16:00:00Z', 'medicaid'),
    S('b', '2026-10-05T16:00:00Z', 'housing_nm'),
    S('c', '2026-10-06T16:00:00Z', null),
    S('c', '2026-09-30T16:00:00Z', 'housing_nm'), // outside period
  ]
  const housing = buildFunderReport({ funder: funderByKey('housing_nm')!, period: oct, participants: people, services, serviceTypes: types })
  assert.equal(housing.participantsServed, 2)
  assert.equal(housing.services, 2)
  assert.equal(housing.units, 3)
  assert.equal(housing.newParticipants, 1)
  const acf = buildFunderReport({ funder: funderByKey('acf')!, period: oct, participants: people, services, serviceTypes: types })
  assert.equal(acf.participantsServed, 3)
  assert.equal(acf.services, 4)
  assert.deepEqual(acf.byFunder.map((f) => [f.key, f.services]), [['medicaid', 1], ['housing_nm', 2], ['untagged', 1]])
  const city = buildFunderReport({ funder: funderByKey('city_abq')!, period: oct, participants: people, services, serviceTypes: types })
  assert.equal(city.participantsServed, 0)
})

test('Housing NM is split Bernalillo / Lea, falling back to the participant county', () => {
  const people = [P('a', { service_county: 'lea' }), P('b', { service_county: 'bernalillo' }), P('c')]
  const services = [
    S('a', '2026-10-03T16:00:00Z', 'housing_nm'),
    S('a', '2026-10-04T16:00:00Z', 'housing_nm', { service_county: 'bernalillo' }),
    S('b', '2026-10-05T16:00:00Z', 'housing_nm'),
    S('c', '2026-10-05T16:00:00Z', 'housing_nm'),
  ]
  assert.equal(countyFor(services[0], people[0]), 'lea')
  assert.equal(countyFor(services[1], people[0]), 'bernalillo')
  const r = buildFunderReport({ funder: funderByKey('housing_nm')!, period: oct, participants: people, services, serviceTypes: types })
  assert.deepEqual(r.byCounty.map((c) => [c.county, c.participants, c.services]), [
    ['bernalillo', 2, 2],
    ['lea', 1, 1],
    ['unspecified', 1, 1],
  ])
  // Both provider counties always show on Housing NM, even with no services.
  const empty = buildFunderReport({ funder: funderByKey('housing_nm')!, period: oct, participants: [], services: [], serviceTypes: types })
  assert.deepEqual(empty.byCounty.map((c) => [c.county, c.services]), [['bernalillo', 0], ['lea', 0]])
})

test('Medicaid report uses masked flags only; demographics are aggregate', () => {
  const people = [P('a', { gender: 'female', race_ethnicity: ['Hispanic', 'Native American'], veteran_status: true }), P('b', { gender: 'male' })]
  const services = [S('a', '2026-10-03T16:00:00Z', 'medicaid'), S('b', '2026-10-03T16:00:00Z', 'medicaid'), S('b', '2026-10-04T16:00:00Z', 'medicaid')]
  const r = buildFunderReport({
    funder: funderByKey('medicaid')!, period: oct, participants: people, services, serviceTypes: types,
    flags: [{ participant_id: 'a', dob_year: 1990, medicaid_last4: '7766' }, { participant_id: 'b', dob_year: null, medicaid_last4: null }],
  })
  assert.deepEqual(r.medicaid, { participantsWithId: 1, participantsMissingId: 1, servicesMissingId: 2 })
  assert.deepEqual(r.demographics.age, [{ label: '35–44', count: 1 }, { label: 'Not recorded', count: 1 }])
  assert.deepEqual(r.demographics.raceEthnicity.map((x) => x.label).sort(), ['Hispanic', 'Native American', 'Not recorded'])
  assert.deepEqual(r.demographics.veteran, [{ label: 'Yes', count: 1 }, { label: 'Not recorded', count: 1 }])
  const csv = toCsv(summaryCsvRows(r, 'All participants'))
  assert.match(csv, /"Medicaid","Participants with Medicaid ID on file","1"/)
  assert.doesNotMatch(csv, /7766|1990/)
})

test('age bands and CSV escaping', () => {
  assert.equal(ageBand(2010, 2026), 'Under 18')
  assert.equal(ageBand(1950, 2026), '65 and over')
  assert.equal(ageBand(null, 2026), 'Not recorded')
  assert.equal(toCsv([['a"b', '=HYPERLINK("x")', 3]]), '"a""b","\'=HYPERLINK(""x"")","3"')
})
