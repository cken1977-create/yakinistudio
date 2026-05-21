import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString, safeInt, splitFullName, participantDedupKey } from './utils'

export function parseRefugeeCommunity(sheet: XLSX.WorkSheet): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const fullName = safeString(Object.values(row)[0])
    const { firstName, lastName } = splitFullName(fullName)
    const dob = parseFlexibleDate(row['DOB'])
    const phone = safeString(row['PHONE #'])
    const country = safeString(row['COUNTRY OF ORIGIN'])
    const spouse = safeString(row['SPOUSE NAME'])
    const householdSize = safeInt(row['# IN HOUSHOLD'] ?? row['# IN HOUSEHOLD'])
    const address = safeString(row['ADDRESS'])

    if (!firstName && !lastName) {
      return {
        tabName: 'Refugee Community',
        rowNumber: idx + 2,
        raw: row,
        intent: { kind: 'skip', reason: 'no name' },
      }
    }

    const dedup = participantDedupKey(firstName, lastName, dob)
    return {
      tabName: 'Refugee Community',
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'merge_participant',
        matchKey: dedup.key,
        data: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          phone_primary: phone,
          country_of_origin: country,
          household_size: householdSize,
          referral_source: 'refugee_agency',
          legacy_source_tab: 'Refugee Community',
          legacy_spouse_name: spouse,
          legacy_address: address,
        },
      },
    }
  })
}
