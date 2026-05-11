// VIZIONZ SANKOFA · Document text extraction (Wave 3.3a)
//
// Per-MIME-type extractors. Each takes the raw file Buffer (downloaded from
// Supabase Storage) and returns a typed structured representation that the
// chunking + chunk-metadata pipeline can consume.
//
// Supported MIME types in 3.3a:
//   - application/pdf                     → ExtractedPDF
//   - application/vnd.openxmlformats-     → ExtractedDOCX
//     officedocument.wordprocessingml.document
//   - application/vnd.openxmlformats-     → ExtractedXLSX
//     officedocument.spreadsheetml.sheet
//   - application/vnd.ms-excel            → ExtractedXLSX (legacy .xls)
//   - text/plain                          → ExtractedPlainText
//   - text/markdown                       → ExtractedPlainText
//   - text/csv                            → ExtractedPlainText
//
// Image MIME types (image/*) and scanned PDFs are deferred to Wave 3.3b.

import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

// pdf-parse has a top-level "test mode" check that breaks Vercel's serverless
// bundling. Import the library directly via its internal path to bypass it.
// See https://gitlab.com/autokent/pdf-parse/-/issues/24
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require('pdf-parse/lib/pdf-parse.js')

// ─── Types ────────────────────────────────────────────────────────────────

export type ExtractedPDF = {
  kind: 'pdf'
  pages: Array<{ pageNumber: number; text: string }>
  totalPages: number
}

export type ExtractedDOCX = {
  kind: 'docx'
  text: string
  headings: Array<{
    level: number       // 1 for h1, 2 for h2, ...
    text: string
    position: number    // character offset into `text`
  }>
}

export type ExtractedXLSX = {
  kind: 'xlsx'
  sheets: Array<{ name: string; text: string }>
}

export type ExtractedPlainText = {
  kind: 'plain'
  text: string
}

export type ExtractedDocument =
  | ExtractedPDF
  | ExtractedDOCX
  | ExtractedXLSX
  | ExtractedPlainText

// ─── Router ───────────────────────────────────────────────────────────────

const PLAIN_MIME_PREFIXES = ['text/']
const XLSX_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
])
const DOCX_MIME_TYPE =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

export async function extractByMimeType(
  mimeType: string,
  buffer: Buffer
): Promise<ExtractedDocument> {
  if (mimeType === 'application/pdf') {
    return extractFromPDF(buffer)
  }
  if (mimeType === DOCX_MIME_TYPE) {
    return extractFromDOCX(buffer)
  }
  if (XLSX_MIME_TYPES.has(mimeType)) {
    return extractFromXLSX(buffer)
  }
  if (PLAIN_MIME_PREFIXES.some((p) => mimeType.startsWith(p))) {
    return extractFromPlainText(buffer)
  }
  throw new Error(
    `Unsupported MIME type for Wave 3.3a: ${mimeType}. ` +
    `Image OCR and scanned-PDF support arrive in Wave 3.3b.`
  )
}

// ─── PDF ──────────────────────────────────────────────────────────────────

export async function extractFromPDF(buffer: Buffer): Promise<ExtractedPDF> {
  const pages: Array<{ pageNumber: number; text: string }> = []

  // pdf-parse calls `pagerender` once per page during parsing. We capture
  // per-page text here so chunks can later be annotated with page_number.
  const result = await pdfParse(buffer, {
    pagerender: async (pageData: {
      pageNumber: number
      getTextContent: (opts: {
        normalizeWhitespace: boolean
        disableCombineTextItems: boolean
      }) => Promise<{ items: Array<{ str: string }> }>
    }) => {
      const content = await pageData.getTextContent({
        normalizeWhitespace: false,
        disableCombineTextItems: false,
      })
      const text = content.items.map((i) => i.str).join(' ').trim()
      pages.push({ pageNumber: pageData.pageNumber, text })
      return text
    },
  })

  // pdf-parse doesn't guarantee pagerender is called for empty/image-only
  // pages. Backfill from `result.numpages` if needed so totalPages is honest.
  const totalPages: number =
    typeof result?.numpages === 'number' ? result.numpages : pages.length

  // Sort pages by pageNumber (pdf-parse can emit out of order on some PDFs).
  pages.sort((a, b) => a.pageNumber - b.pageNumber)

  return { kind: 'pdf', pages, totalPages }
}

// ─── DOCX ─────────────────────────────────────────────────────────────────

export async function extractFromDOCX(buffer: Buffer): Promise<ExtractedDOCX> {
  // We convert to HTML first so heading styles (Heading 1, Heading 2, etc.)
  // surface as <h1>...<h6> tags. Then we parse those out and assemble a
  // plain-text version with heading positions tracked.
  const { value: html } = await mammoth.convertToHtml({ buffer })

  // Walk the HTML linearly, extracting heading positions and plain text.
  const headings: Array<{ level: number; text: string; position: number }> = []
  let plainText = ''

  // Crude but reliable HTML walker: we only care about <h1>-<h6> and text
  // content. Mammoth's output is well-formed, no nested h tags.
  const tokenRegex = /<(\/?)([a-zA-Z0-9]+)[^>]*>|([^<]+)/g
  let openHeadingLevel: number | null = null
  let headingBuffer = ''
  let match: RegExpExecArray | null

  while ((match = tokenRegex.exec(html)) !== null) {
    const closing = match[1] === '/'
    const tag = match[2]
    const textChunk = match[3]

    if (tag) {
      const headingMatch = /^h([1-6])$/i.exec(tag)
      if (headingMatch) {
        const level = parseInt(headingMatch[1], 10)
        if (closing && openHeadingLevel !== null) {
          headings.push({
            level: openHeadingLevel,
            text: headingBuffer.trim(),
            position: plainText.length,
          })
          plainText += headingBuffer + '\n\n'
          headingBuffer = ''
          openHeadingLevel = null
        } else if (!closing) {
          openHeadingLevel = level
          headingBuffer = ''
        }
      } else if (tag === 'p' && closing) {
        plainText += '\n\n'
      } else if (tag === 'br') {
        plainText += '\n'
      }
    } else if (textChunk) {
      const decoded = decodeHtmlEntities(textChunk)
      if (openHeadingLevel !== null) {
        headingBuffer += decoded
      } else {
        plainText += decoded
      }
    }
  }

  // Collapse runs of blank lines.
  plainText = plainText.replace(/\n{3,}/g, '\n\n').trim()

  return { kind: 'docx', text: plainText, headings }
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

// ─── XLSX ─────────────────────────────────────────────────────────────────

export function extractFromXLSX(buffer: Buffer): ExtractedXLSX {
  const workbook = XLSX.read(buffer, { type: 'buffer' })

  const sheets: Array<{ name: string; text: string }> = []
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    if (!sheet) continue

    // Serialize as TSV (tab-separated) — preserves column alignment in the
    // embedded text, which helps the model attend to row context at
    // retrieval time. Skip empty cells; let blank rows separate sections.
    const tsv = XLSX.utils.sheet_to_csv(sheet, { FS: '\t', blankrows: false })
    sheets.push({ name: sheetName, text: tsv.trim() })
  }

  return { kind: 'xlsx', sheets }
}

// ─── Plain text / markdown / CSV ──────────────────────────────────────────

export function extractFromPlainText(buffer: Buffer): ExtractedPlainText {
  const text = buffer.toString('utf8')
  return { kind: 'plain', text }
}
