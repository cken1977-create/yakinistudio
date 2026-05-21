import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString, parseCurrency, splitFullName, participantDedupKey } from './utils'

export function parseACSClients(sheet: XLSX.WorkSheet): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const date = parseFlexibleDate(row['Date'])
    const fullName = safeString(row['Name'])
    const { firstName, lastName } = splitFullName(fullName)
    const demographics = safeString(row['Demographics'])
    const service = safeString(row['Services Provided'])
    const amount = parseCurrency(row['Amount'])
    const notes = safeString(row['Notes'])
    const additional = safeString(row['Additional Comments'])

    if (!firstName && !lastName) {
      return {
        tabName: 'ACS Clients',
        rowNumber: idx + 2,
        raw: row,
        intent: { kind: 'skip', reason: 'no name' },
      }
    }

    const dedup = participantDedupKey(firstName, lastName, null)
    return {
      tabName: 'ACS Clients',
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'merge_participant',
        matchKey: dedup.key,
        data: {
          first_name: firstName,
          last_name: lastName,
          intake_date: date,
          referral_source: 'acs',
          demographic_legacy: demographics,
          legacy_source_tab: 'ACS Clients',
          legacy_service: service,
          legacy_amount: amount,
          legacy_notes: notes,
          legacy_additional_comments: additional,
        },
      },
    }
  })
}
