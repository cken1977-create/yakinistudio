import { describe, expect, it, vi } from 'vitest'
import type { ChatResult } from '@yakini/ai'
import { EDIT_CASES, strayChanges } from '@yakini/ai/evals/edit-cases'
import { brandFor, buildKitDraft, kitDefinition } from '@yakini/kits'
import { loadSiteDoc, type SiteDoc } from '@yakini/site-schema'
import { COULD_NOT, PAUSED, runChatEdit } from '@/lib/chat/edit'
import { editTools } from '@/lib/chat/tools'
import type { GenerateChat } from '@/lib/pipeline/generate'
import { mockEditChat } from '@/lib/pipeline/test-mode'

const kit = kitDefinition('food-truck')!
const draft = (): SiteDoc => loadSiteDoc(buildKitDraft(kit, { name: 'Mesa Street Tacos', city: 'Austin' }, brandFor(kit, { colors: { primary: '#9A3412', secondary: '#15130F', accent: '#F59E0B' } }))).doc
const ctx = { allowedAssetIds: new Set(kit.sampleImages.map((s) => s.assetId)) }
const run = (doc: SiteDoc, request: string, chat: GenerateChat, selected: { pageId: string; sectionId: string } | null = null) =>
  runChatEdit({ doc, request, selected, pageId: null, history: [], ctx, chat })
const reply = (calls: { name: string; arguments: unknown }[]): ChatResult => ({ content: null, toolCalls: calls.map((c, i) => ({ id: `c${i}`, ...c })), usage: { inputTokens: 100, outputTokens: 20 }, model: 'test', latencyMs: 1 })

describe('20 scripted chat requests (spec 16.5) each make the expected change and nothing else', () => {
  it.each(EDIT_CASES.map((c) => [c.id, c] as const))('%s', async (_id, c) => {
    const doc = draft()
    const before = JSON.stringify(doc)
    const r = await run(doc, c.request, mockEditChat, c.selected ?? null)
    expect(JSON.stringify(doc)).toBe(before) // the input is never touched; Apply saves separately
    expect(r.kind).toBe(c.kind === 'change' ? 'proposal' : c.kind)
    if (r.kind !== 'proposal') return
    expect(c.check!(doc, r.doc)).toBeNull()
    expect(strayChanges(doc, r.doc, c.allowed!(doc))).toEqual([])
    expect(r.lines.length).toBe(r.ops.length)
    expect(r.doc.brand).toEqual(doc.brand)
  })
})

describe('guardrails', () => {
  it('"Change my colors to red" gets a polite refusal without calling the model; colors unchanged', async () => {
    const chat = vi.fn<GenerateChat>()
    const doc = draft()
    const r = await run(doc, 'Change my colors to red', chat)
    expect(chat).not.toHaveBeenCalled()
    expect(r.kind).toBe('reply')
    if (r.kind === 'reply') expect(r.message).toMatch(/Brand settings/)
    expect(doc.brand.colors.primary).toBe('#9A3412')
  })

  it('an invalid first answer is retried once with the validation error, then applied', async () => {
    const chat = vi.fn<GenerateChat>()
      .mockResolvedValueOnce(reply([{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/headline', value: 'x'.repeat(300) } }]))
      .mockResolvedValueOnce(reply([{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/headline', value: 'Tacos all day' } }]))
    const r = await run(draft(), 'Change the headline', chat)
    expect(r.kind).toBe('proposal')
    expect(r.meta.attempts).toBe(2)
    const retry = chat.mock.calls[1][0].messages
    expect(retry.at(-1)?.role).toBe('tool')
    expect(retry.at(-1)?.content).toMatch(/failed validation/)
  })

  it('invalid output twice never corrupts the doc: plain message, nothing changed', async () => {
    const bad = reply([{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/../brand', value: { colors: {} } } }])
    const chat = vi.fn<GenerateChat>().mockResolvedValue(bad)
    const doc = draft()
    const before = JSON.stringify(doc)
    const r = await run(doc, 'Do something odd', chat)
    expect(r).toMatchObject({ kind: 'failed', message: COULD_NOT })
    expect(chat).toHaveBeenCalledTimes(2)
    expect(JSON.stringify(doc)).toBe(before)
  })

  it('refuses stack names and injected instructions in new text (8.8)', async () => {
    const chat = vi.fn<GenerateChat>().mockResolvedValue(reply([{ name: 'update_field', arguments: { pageId: 'home', sectionId: 'hero', path: '/subhead', value: 'Built with AI, powered by Grok.' } }]))
    const r = await run(draft(), 'Write a new subheading', chat)
    expect(r.kind).toBe('failed')
    expect(chat.mock.calls[1][0].messages.at(-1)?.content).toMatch(/Do not write/)
  })

  it('more than 8 tool calls in one answer is refused', async () => {
    const many = Array.from({ length: 9 }, () => ({ name: 'set_section_hidden', arguments: { pageId: 'home', sectionId: 'reviews', hidden: true } }))
    const r = await run(draft(), 'Hide everything', vi.fn<GenerateChat>().mockResolvedValue(reply(many)))
    expect(r.kind).toBe('failed')
  })

  it('when the spend cap is reached, chat edits pause with the plain message', async () => {
    const r = await run(draft(), 'Change the headline', vi.fn<GenerateChat>().mockResolvedValue({ skipped: 'token_cap' }))
    expect(r).toMatchObject({ kind: 'paused', message: PAUSED })
  })

  it('the brand and integrations are not sent to the model, and site text is marked as content', async () => {
    const chat = vi.fn<GenerateChat>().mockResolvedValue(reply([{ name: 'reply', arguments: { message: 'Sure.' } }]))
    await run(draft(), 'Hello there', chat)
    const user = chat.mock.calls[0][0].messages.at(-1)!.content
    expect(user).toContain('<CURRENT_SITE>')
    expect(user).not.toContain('#9A3412')
    expect(user).not.toContain('"integrations"')
  })

  it('offers tools that match the editor exactly, without server-chosen ids', () => {
    const names = editTools().map((t) => t.function.name)
    expect(names).toEqual(expect.arrayContaining(['update_field', 'update_business', 'add_section', 'remove_section', 'move_section', 'set_section_variant', 'set_section_hidden', 'set_image', 'add_page', 'remove_page', 'rename_page', 'set_seo', 'ask_clarifying_question', 'reply']))
    const add = editTools().find((t) => t.function.name === 'add_section')!.function.parameters as { properties: Record<string, unknown> }
    expect(add.properties).not.toHaveProperty('id')
    expect(add.properties).not.toHaveProperty('op')
  })
})
