import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString, safeInt, splitFullName, participantDedupKey } from './utils'

export function parseHousingStability(sheet: XLSX.WorkSheet): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const fullName = safeString(row['A1'] ?? row['Name'] ?? Object.values(row)[0])
    const { firstName, lastName } = splitFullName(fullName)
    const age = safeInt(row['AGE'])
    const gender = safeString(row['GENDER'])
    const race = safeString(row['RACE'])
    const phone = safeString(row['PHONE #'])
    const appNum = safeString(row['APPLICATION #'])
    const email = safeString(row['EMAIL'])
    const subDate = parseFlexibleDate(row['SUB DATE'])
    const awardDate = parseFlexibleDate(row['AWARD DATE'])
    const status = safeString(row['STATUS'])

    if (!firstName && !lastName) {
      return {
        tabName: 'Housing Stability',
        rowNumber: idx + 2,
        raw: row,
        intent: { kind: 'skip', reason: 'no name' },
      }
    }

    const dedup = participantDedupKey(firstName, lastName, null)
    return {
      tabName: 'Housing Stability',
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'merge_participant',
        matchKey: dedup.key,
        data: {
          first_name: firstName,
          last_name: lastName,
          gender,
          race_ethnicity: race ? [race] : null,
          phone_primary: phone,
          email,
          intake_date: subDate,
          referral_source: 'self',
          status: status === 'Awarded' ? 'active' : 'intake',
          legacy_source_tab: 'Housing Stability',
          legacy_application_number: appNum,
          legacy_award_date: awardDate,
          legacy_age: age,
        },
      },
    }
  })
}
