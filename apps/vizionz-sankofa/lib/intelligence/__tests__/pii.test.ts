// Run: npm test  (from apps/vizionz-sankofa). FAKE data only.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import type Anthropic from '@anthropic-ai/sdk'
import { PiiVault } from '../pii'
import { ask, type MessagesClient } from '../orchestrator'
import type { ToolContext, ToolResult } from '../tools'
import { parseCountQuestion } from '../counts'

const FAKE_PII = [
  'Test Client 001',
  'Testa Clientova',
  'client001@example.test',
  '505-555-0101',
  '(505) 555-0199',
  '123 Fake Street NE',
  '000-00-1234',
  'FAKE-MCD-99887766',
  'Clientova',
]

test('redact replaces names, emails, phones, addresses, SSNs and IDs; restore puts them back', () => {
  const v = new PiiVault(['Test Client 001', 'Testa Clientova'])
  const text =
    'Test Client 001 (client001@example.test, 505-555-0101) lives at 123 Fake Street NE. ' +
    'SSN 000-00-1234, Medicaid FAKE-MCD-99887766. Call Testa Clientova at (505) 555-0199. ' +
    'Ms. Clientova asked again.'
  const red = v.redact(text)
  for (const p of FAKE_PII) assert.ok(!red.includes(p), `leaked: ${p} in ${red}`)
  assert.match(red, /\[\[PERSON_1\]\]/)
  assert.match(red, /\[\[EMAIL_1\]\]/)
  assert.match(red, /\[\[PHONE_\d\]\]/)
  assert.match(red, /\[\[ADDRESS_1\]\]/)
  assert.match(red, /\[\[SSN_1\]\]/)
  assert.match(red, /\[\[ID_1\]\]/)
  assert.ok(!/reet|NE\./.test(red), `partial address left behind: ${red}`)
  assert.equal(v.restore(red), text)
})

test('same value always maps to the same token; ordinary words survive', () => {
  const v = new PiiVault(['Test Client 001'])
  const a = v.redact('How is Test Client 001 doing with housing in Albuquerque?')
  const b = v.redact('test client 001 again')
  assert.equal(a, 'How is [[PERSON_1]] doing with housing in Albuquerque?')
  assert.equal(b, '[[PERSON_1]] again')
})

test('restore accepts tokens the model wrote without brackets', () => {
  const v = new PiiVault(['Test Client 001'])
  v.redact('Test Client 001')
  assert.equal(v.restore('PERSON_1 is enrolled.'), 'Test Client 001 is enrolled.')
})

test('the payload sent to the AI provider contains no PII (fake client + fake tool data)', async () => {
  const vault = new PiiVault(['Test Client 001', 'Testa Clientova', 'Test CaseMgr A'])
  const sent: string[] = []
  let turn = 0
  const fakeClient: MessagesClient = {
    messages: {
      create: async (params) => {
        sent.push(JSON.stringify(params))
        turn++
        if (turn === 1) {
          // Model asks for the participant by the token it was given.
          return {
            id: 'm1', type: 'message', role: 'assistant', model: 'fake',
            stop_reason: 'tool_use', stop_sequence: null,
            usage: { input_tokens: 1, output_tokens: 1 },
            content: [{ type: 'tool_use', id: 't1', name: 'query_participants', input: { search: '[[PERSON_1]]' } }],
          } as unknown as Anthropic.Message
        }
        return {
          id: 'm2', type: 'message', role: 'assistant', model: 'fake',
          stop_reason: 'end_turn', stop_sequence: null,
          usage: { input_tokens: 1, output_tokens: 1 },
          content: [{ type: 'text', text: '[[PERSON_1]] is enrolled; next call [[PHONE_1]].' }],
        } as unknown as Anthropic.Message
      },
    },
  }
  let toolSawRealName = ''
  const fakeTool = async (_name: string, input: Record<string, unknown>): Promise<ToolResult> => {
    toolSawRealName = String(input.search)
    return {
      ok: true,
      citations: [{ source_type: 'participant', participant_id: 'p1', participant_label: 'Test Client 001' }],
      content:
        '[1] Test Client 001 — stage: enrolled. Phone 505-555-0101, email client001@example.test, ' +
        'address 123 Fake Street NE, Medicaid FAKE-MCD-99887766, SSN 000-00-1234. ' +
        'Mother: Testa Clientova. Case manager: Test CaseMgr A.',
    }
  }
  const ctx = { supabase: {} as ToolContext['supabase'], role: 'case_manager', baaSigned: true } as ToolContext
  const res = await ask(
    'Call Test Client 001 at 505-555-0101 — how are they doing?',
    [{ role: 'assistant', content: 'Earlier I spoke about Testa Clientova (client001@example.test).' }],
    { vault, toolContext: ctx, client: fakeClient, executeTool: fakeTool }
  )

  assert.equal(sent.length, 2)
  const payload = sent.join('\n')
  for (const p of [...FAKE_PII, 'Test CaseMgr A']) {
    assert.ok(!payload.includes(p), `PII "${p}" reached the AI payload`)
  }
  assert.ok(payload.includes('[[PERSON_1]]'))
  assert.ok(!payload.includes('reet NE'), 'partial address leaked')
  // The DB tool got the real value back; the user sees real values.
  assert.equal(toolSawRealName, 'Test Client 001')
  assert.equal(res.answer, 'Test Client 001 is enrolled; next call 505-555-0101.')
  assert.equal(res.redacted_question, 'Call [[PERSON_1]] at [[PHONE_1]] — how are they doing?')
  console.log('\nSample outbound payload (fake data, as the AI provider saw it):\n' +
    JSON.stringify(JSON.parse(sent[1]).messages, null, 1).slice(0, 1600))
})

test('participant tools are hidden from the AI until a BAA is signed', async () => {
  const { getToolDefinitions } = await import('../tools')
  const base = { supabase: {} as ToolContext['supabase'], role: 'executive' } as const
  const off = getToolDefinitions({ ...base, baaSigned: false }).map((t) => t.name)
  const on = getToolDefinitions({ ...base, baaSigned: true }).map((t) => t.name)
  assert.ok(!off.includes('query_participants') && !off.includes('query_intakes'))
  assert.ok(on.includes('query_participants') && on.includes('query_intakes'))
})

test('pure count questions are recognised (answered by SQL, no AI)', () => {
  assert.deepEqual(parseCountQuestion('How many clients are enrolled?'), { entity: 'participants', stage: 'enrolled' })
  assert.deepEqual(parseCountQuestion('how many new intakes this week'), { entity: 'intakes', status: 'new', period: 'week' })
  assert.deepEqual(parseCountQuestion('How many returning clients do we have?'), { entity: 'participants', returningOnly: true })
  assert.deepEqual(parseCountQuestion('How many donors?'), { entity: 'donors' })
  assert.equal(parseCountQuestion('Why did fewer clients enroll this month?'), null)
  assert.equal(parseCountQuestion('How many clients by case manager?'), null)
  assert.equal(parseCountQuestion('Tell me about Test Client 001'), null)
})
