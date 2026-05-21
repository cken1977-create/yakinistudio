import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseFlexibleDate, safeString, safeInt, splitFullName, participantDedupKey } from './utils'

export function parseHMISCaseMgmt(sheet: XLSX.WorkSheet): ParsedRow[] {
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null })
  return data.map((row, idx) => {
    const admittedDate = parseFlexibleDate(row['Admitted Date'])
    const fullName = safeString(row['Name'])
    const { firstName, lastName } = splitFullName(fullName)
    const dob = parseFlexibleDate(row['DOB'])
    const program = safeString(row['Training Program'])
    const awardsId = safeString(row['AWARDS ID #'])
    const piId = safeString(row['PI ID#'])
    const notes = safeString(row['Notes'])
    const withdrawnDate = parseFlexibleDate(row['Withdrawn Date'])
    const householdSize = safeInt(row['Household Size'])

    if (!firstName && !lastName) {
      return {
        tabName: 'HMIS Case Mgmt',
        rowNumber: idx + 2,
        raw: row,
        intent: { kind: 'skip', reason: 'no name' },
      }
    }

    const dedup = participantDedupKey(firstName, lastName, dob)
    return {
      tabName: 'HMIS Case Mgmt',
      rowNumber: idx + 2,
      raw: row,
      intent: {
        kind: 'merge_participant',
        matchKey: dedup.key,
        data: {
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dob,
          household_size: householdSize,
          intake_date: admittedDate,
          referral_source: 'hmis',
          legacy_source_tab: 'HMIS Case Mgmt',
          legacy_program: program,
          legacy_awards_id: awardsId,
          legacy_pi_id: piId,
          legacy_notes: notes,
          legacy_withdrawn_date: withdrawnDate,
        },
      },
    }
  })
}
