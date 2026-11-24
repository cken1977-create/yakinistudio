import type { LinkTarget, RichText } from '@yakini/site-schema'
import { linkToText, textToLink } from './links'

/**
 * Rich text in the editor (spec 10.3: "the RichText subset with Bold/Italic/Link buttons") as
 * plain, readable text the owner can type in any text box:
 *   **bold**   _italic_   [words](page:menu)   lines starting "- " make a list   blank line = new paragraph
 * `richToText` and `textToRich` round-trip every value the site format allows.
 */
type Run = RichText[number]['children'][number]

function runToText(r: Run): string {
  let t = r.text.replace(/([*_[\]\\])/g, '\\$1')
  if (r.italic) t = `_${t}_`
  if (r.bold) t = `**${t}**`
  if (r.link) t = `[${t}](${linkToText(r.link)})`
  return t
}

export function richToText(value: RichText): string {
  return value.map((b) => {
    if (b.type === 'ul') return b.children.map((c) => `- ${runToText(c)}`).join('\n')
    const line = b.children.map(runToText).join('')
    return b.type === 'h3' ? `### ${line}` : line
  }).join('\n\n')
}

/** Inline markup → runs. Unknown or broken markup is kept as typed text, never dropped. */
function parseInline(src: string, base: { bold?: boolean; italic?: boolean; link?: LinkTarget } = {}): Run[] {
  const out: Run[] = []
  let buf = ''
  const flush = () => { if (buf) { out.push({ text: buf, ...flags(base) }); buf = '' } }
  for (let i = 0; i < src.length;) {
    const ch = src[i]
    if (ch === '\\' && i + 1 < src.length) { buf += src[i + 1]; i += 2; continue }
    if (src.startsWith('**', i)) {
      const end = findClose(src, '**', i + 2)
      if (end > i + 2) { flush(); out.push(...parseInline(src.slice(i + 2, end), { ...base, bold: true })); i = end + 2; continue }
    }
    if (ch === '_') {
      const end = findClose(src, '_', i + 1)
      if (end > i + 1) { flush(); out.push(...parseInline(src.slice(i + 1, end), { ...base, italic: true })); i = end + 1; continue }
    }
    if (ch === '[') {
      const close = findClose(src, ']', i + 1)
      if (close > i && src[close + 1] === '(') {
        const paren = src.indexOf(')', close + 2)
        const target = paren > 0 ? textToLink(src.slice(close + 2, paren)) : null
        if (target) { flush(); out.push(...parseInline(src.slice(i + 1, close), { ...base, link: target })); i = paren + 1; continue }
      }
    }
    buf += ch
    i++
  }
  flush()
  return merge(out)
}

function findClose(src: string, token: string, from: number): number {
  for (let i = from; i < src.length; i++) {
    if (src[i] === '\\') { i++; continue }
    if (src.startsWith(token, i)) return i
  }
  return -1
}
const flags = (b: { bold?: boolean; italic?: boolean; link?: LinkTarget }) => ({
  ...(b.bold ? { bold: true } : {}), ...(b.italic ? { italic: true } : {}), ...(b.link ? { link: b.link } : {}),
})
/** Join neighbouring runs with the same marks, so a value reads back exactly as it was. */
function merge(runs: Run[]): Run[] {
  const out: Run[] = []
  for (const r of runs) {
    const last = out[out.length - 1]
    const same = last && !!last.bold === !!r.bold && !!last.italic === !!r.italic && JSON.stringify(last.link) === JSON.stringify(r.link)
    if (same) last.text += r.text
    else out.push({ ...r })
  }
  return out
}

export function textToRich(text: string): RichText {
  const blocks = text.replace(/\r\n?/g, '\n').split(/\n{2,}/).map((b) => b.trim()).filter(Boolean)
  return blocks.map((b) => {
    const lines = b.split('\n')
    if (lines.every((l) => /^- /.test(l))) return { type: 'ul' as const, children: lines.map((l) => mergeLine(parseInline(l.slice(2)))) }
    if (/^### /.test(b)) return { type: 'h3' as const, children: parseInline(b.slice(4).replace(/\n/g, ' ')) }
    return { type: 'p' as const, children: parseInline(lines.join(' ')) }
  })
}
/** A list item is one run in the site format; keep its first mark set and all its text. */
function mergeLine(runs: Run[]): Run {
  if (runs.length <= 1) return runs[0] ?? { text: '' }
  return { ...runs[0], text: runs.map((r) => r.text).join('') }
}
