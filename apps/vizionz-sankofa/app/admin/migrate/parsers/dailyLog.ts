import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString } from './utils'

// Daily activity log: Date | Name | Contact (method) | Action Performed | Notes
// One row → one case note tied to the participant (matched by name).
export function parseDailyLog(sheet: XLSX.WorkSheet, staffName: string): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null, header: 'A' })
  const rows: ParsedRow[] = []

  data.forEach((row, idx) => {
    // header detection: skip if all empty or header-like
    const date = parseFlexibleDate(row['A'])
    const name = safeString(row['B'])
    const contact = safeString(row['C'])
    const action = safeString(row['D'])
    const notes = safeString(row['E'])

    if (!date && !name && !action) return // empty row
    if (!name && !action) return // header-ish row

    if (!action) {
      rows.push({
        tabName: `Daily Log (${staffName})`,
        rowNumber: idx + 1,
        raw: row,
        intent: { kind: 'skip', reason: 'no action recorded' },
      })
      return
    }

    rows.push({
      tabName: `Daily Log (${staffName})`,
      rowNumber: idx + 1,
      raw: row,
      intent: {
        kind: 'case_note',
        data: {
          staff_name: staffName,
          participant_name: name,
          contact_method_raw: contact,
          occurred_at: date,
          subject: action.slice(0, 120),
          content: action + (notes ? `\n\nNotes: ${notes}` : ''),
        },
      },
    })
  })

  return rows
}
