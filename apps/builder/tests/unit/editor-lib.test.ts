import { describe, expect, it } from 'vitest'
import { RichText } from '@yakini/site-schema'
import { linkToText, textToLink } from '@/lib/editor/links'
import { richToText, textToRich } from '@/lib/editor/richtext'

describe('rich text in the editor', () => {
  const samples: RichText[] = [
    [{ type: 'p', children: [{ text: 'Family recipes since 2019.' }] }],
    [{ type: 'p', children: [{ text: 'We ' }, { text: 'smoke', bold: true }, { text: ' every ' }, { text: 'brisket', italic: true }, { text: ' overnight.' }] }],
    [{ type: 'p', children: [{ text: 'See the ' }, { text: 'menu', link: { kind: 'page', pageId: 'menu' } }, { text: ' or ' }, { text: 'call us', bold: true, link: { kind: 'tel', phone: '+19155550123' } }, { text: '.' }] }],
    [{ type: 'h3', children: [{ text: 'Catering' }] }, { type: 'ul', children: [{ text: 'Weddings' }, { text: 'Office lunches' }] }, { type: 'p', children: [{ text: 'Ask about dates.' }] }],
    [{ type: 'p', children: [{ text: 'Prices like $5*2 and snake_case [stay] as typed \\ ok' }] }],
  ]
  it.each(samples.map((s, i) => [i, s] as const))('sample %i round-trips exactly', (_i, value) => {
    expect(RichText.safeParse(value).success).toBe(true)
    expect(textToRich(richToText(value))).toEqual(value)
  })

  it('reads what an owner types', () => {
    expect(textToRich('Open **late** on Fridays\n\n- Tacos\n- Elote')).toEqual([
      { type: 'p', children: [{ text: 'Open ' }, { text: 'late', bold: true }, { text: ' on Fridays' }] },
      { type: 'ul', children: [{ text: 'Tacos' }, { text: 'Elote' }] },
    ])
    expect(textToRich('Book [here](https://mesa.example/book)')[0].children[1]).toEqual({ text: 'here', link: { kind: 'url', url: 'https://mesa.example/book' } })
    // Broken markup and unsafe links stay as plain text rather than disappearing.
    expect(richToText(textToRich('**not closed and [bad](javascript:alert(1))'))).toContain('javascript:alert')
    expect(textToRich('Line one\nline two')).toEqual([{ type: 'p', children: [{ text: 'Line one line two' }] }])
  })
})

describe('link targets', () => {
  it('converts every kind both ways and refuses anything else', () => {
    for (const t of [
      { kind: 'page', pageId: 'menu' }, { kind: 'section', pageId: 'home', sectionId: 'faq' }, { kind: 'url', url: 'https://mesa.example' },
      { kind: 'tel', phone: '+19155550123' }, { kind: 'mailto', email: 'hi@mesa.example' }, { kind: 'booking' }, { kind: 'form', formKey: 'contact' },
    ] as const) expect(textToLink(linkToText(t))).toEqual(t)
    for (const bad of ['javascript:alert(1)', 'http://plain.example', 'page:Menu Page', 'tel:5550123', '']) expect(textToLink(bad)).toBeNull()
  })
})

describe('inspector layout and limits', () => {
  it('nests list fields under their list, all the way down (menu → dishes)', async () => {
    const { inspectorLayout } = await import('@/lib/editor/fields')
    const menu = inspectorLayout('menu')
    const cats = menu.find((f) => f.rel === '/categories')!
    expect(cats.kind).toBe('list')
    expect(cats.children.map((c) => c.rel)).toEqual(['/name', '/items'])
    expect(cats.children[1].children.map((c) => c.rel)).toEqual(['/name', '/description', '/price', '/image'])
    // Every field in the field list shows up exactly once somewhere in the tree.
    const { INSPECTORS } = await import('@yakini/sections/inspectors')
    const all = (nodes: { pattern: string; children: unknown[] }[]): string[] => nodes.flatMap((n) => [n.pattern, ...all(n.children as never)])
    for (const [type, fields] of Object.entries(INSPECTORS)) expect(all(inspectorLayout(type as never)).sort()).toEqual(fields.map((f) => f.path).sort())
  })

  it('reads limits from the site format', async () => {
    const { limitsFor } = await import('@/lib/editor/fields')
    expect(limitsFor('hero', '/headline')).toMatchObject({ required: true, maxLength: 90 })
    expect(limitsFor('hero', '/eyebrow')).toMatchObject({ required: false, maxLength: 60 })
    expect(limitsFor('menu', '/categories/*/items/*/price')).toMatchObject({ required: false, maxLength: 20 })
    expect(limitsFor('menu', '/categories/*/items')).toMatchObject({ maxItems: 40 })
  })

  it('a new row copies a valid row, from this list, the site, or the kit', async () => {
    const { newListItem } = await import('@/lib/editor/fields')
    const { kitDoc } = await import('./browser')
    const doc = kitDoc()
    const menu = doc.pages.flatMap((p) => p.sections).find((s) => s.type === 'menu')!
    // A fresh kit draft starts with an empty menu: rows start as [[placeholders]] the owner fills in.
    const withCat = structuredClone(menu)
    const cat = newListItem(doc, withCat, '/categories', '/categories')
    expect(cat).toEqual({ name: '[[Section name]]', items: [] })
    ;(withCat.props as { categories: unknown[] }).categories = [cat]
    expect(newListItem(doc, withCat, '/categories/0/items', '/categories/*/items')).toEqual({ name: '[[Dish]]' })
    // Once a row exists, Add copies it.
    ;(withCat.props as { categories: { items: unknown[] }[] }).categories[0].items = [{ name: 'Brisket taco', price: '$5' }]
    expect(newListItem(doc, withCat, '/categories/0/items', '/categories/*/items')).toEqual({ name: 'Brisket taco', price: '$5' })
    const stops = doc.pages.flatMap((p) => p.sections).find((s) => s.type === 'schedule')!
    const stop = newListItem(doc, { ...stops, props: { ...stops.props, stops: [] } }, '/stops', '/stops')
    expect(stop).toMatchObject({ day: 'mon', start: '11:00', end: '14:00' })
    const gallery = { id: 'g', type: 'gallery', variant: 'grid', hidden: false, props: { images: [] } } as never
    expect(newListItem({ ...doc, kitId: 'food-truck' }, gallery, '/images', '/images')).toSatisfy((v: unknown) => v === null || typeof v === 'object')
  })
})
