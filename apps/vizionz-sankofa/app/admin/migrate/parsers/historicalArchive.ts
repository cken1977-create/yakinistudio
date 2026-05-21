import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString } from './utils'

// Generic archive parser — preserves every row as JSON, sets searchable_text.
export function parseHistoricalArchive(
  sheet: XLSX.WorkSheet,
  sourceProgram: string,
  sourceTab: string
): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const possibleName =
      safeString(row['Name']) ?? safeString(row['NAME']) ?? safeString(row['Participant'])
    const possibleDate =
      parseFlexibleDate(row['Date']) ?? parseFlexibleDate(row['DATE']) ?? parseFlexibleDate(row['Admitted Date'])
    const searchable = Object.entries(row)
      .map(([k, v]) => v !== null && v !== undefined ? `${k}: ${v}` : null)
      .filter(Boolean)
      .join(' | ')

    return {
      tabName: sourceTab,
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'archive',
        data: {
          source_program: sourceProgram,
          source_tab: sourceTab,
          record_type: 'row',
          participant_name: possibleName,
          record_date: possibleDate,
          raw_content: row,
          searchable_text: searchable,
        },
      },
    }
  })
}
