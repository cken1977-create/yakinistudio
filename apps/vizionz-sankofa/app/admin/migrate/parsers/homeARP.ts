import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString, safeInt, parseCurrency, splitFullName, participantDedupKey } from './utils'

export function parseHomeARP(sheet: XLSX.WorkSheet): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const date = parseFlexibleDate(row['Date'])
    const fullName = safeString(row['Name'])
    const { firstName, lastName } = splitFullName(fullName)
    const service = safeString(row['Services (RRH/HP)'])
    const amount = parseCurrency(row['Amount'])
    const householdSize = safeInt(row['Household Size'])
    const location = safeString(row['Bernalillo/Hobbs'])
    const notes = safeString(row['Notes'])
    const staff = safeString(row['Staff Initial'])
    const comments = safeString(row['Comments'])

    if (!firstName && !lastName) {
      return {
        tabName: 'Home ARP - RRH and HP',
        rowNumber: idx + 2,
        raw: row,
        intent: { kind: 'skip', reason: 'no name' },
      }
    }

    const dedup = participantDedupKey(firstName, lastName, null)
    return {
      tabName: 'Home ARP - RRH and HP',
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'service',
        data: {
          participant_match_key: dedup.key,
          first_name: firstName,
          last_name: lastName,
          household_size: householdSize,
          delivered_at: date,
          service_label: service,
          cost_amount: amount,
          cost_funded_by: 'Home ARP',
          location,
          notes,
          staff_initials: staff,
          comments,
        },
      },
    }
  })
}
