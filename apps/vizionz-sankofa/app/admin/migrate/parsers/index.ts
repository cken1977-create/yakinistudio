// Parser router — maps workbook tab names to parser functions.

import * as XLSX from 'xlsx'
import type { ParsedRow } from '../types'
import { parseHousingStability } from './housingStability'
import { parseRefugeeCommunity } from './refugeeCommunity'
import { parseHomeARP } from './homeARP'
import { parseACSClients } from './acsClients'
import { parseHMISCaseMgmt } from './hmisCaseMgmt'
import { parseDailyLog } from './dailyLog'
import { parseHistoricalArchive } from './historicalArchive'

// Map workbook tab name (case-insensitive, trimmed) → parser function
const TAB_PARSERS: Record<string, (sheet: XLSX.WorkSheet) => ParsedRow[]> = {
  'housing stability': parseHousingStability,
  'refugee community': parseRefugeeCommunity,
  'home arp- rrh and hp': parseHomeARP,
  'home arp - rrh and hp': parseHomeARP,
  'acs clients': parseACSClients,
  'hmis case mgmt': parseHMISCaseMgmt,
  'khadijah': (s) => parseDailyLog(s, 'Khadijah Asili'),
  'carly': (s) => parseDailyLog(s, 'Carly Anderson'),
  'pastor wilondja': (s) => parseDailyLog(s, 'Pastor Wilondja'),
  'will': (s) => parseDailyLog(s, 'Will'),
  // Archive-only tabs
  'home-arp time sheet/ kb': (s) => parseHistoricalArchive(s, 'Home ARP Timesheet KB', 'Home-ARP Time Sheet/ KB'),
  'home-arp time sheet/ ca': (s) => parseHistoricalArchive(s, 'Home ARP Timesheet CA', 'Home-ARP Time Sheet/ CA'),
  'home-arp ledger': (s) => parseHistoricalArchive(s, 'Home ARP Ledger', 'Home-ARP Ledger'),
  'erap 20': (s) => parseHistoricalArchive(s, 'ERAP Historical', 'ERAP 20xx'),
}

export function parseWorkbook(buffer: ArrayBuffer): {
  rows: ParsedRow[]
  unknownTabs: string[]
} {
  const wb = XLSX.read(buffer, { type: 'array' })
  const rows: ParsedRow[] = []
  const unknownTabs: string[] = []

  for (const sheetName of wb.SheetNames) {
    const key = sheetName.trim().toLowerCase()
    const parser = TAB_PARSERS[key] ?? Object.entries(TAB_PARSERS).find(([k]) => key.startsWith(k))?.[1]
    if (!parser) {
      unknownTabs.push(sheetName)
      continue
    }
    const parsed = parser(wb.Sheets[sheetName])
    parsed.forEach((row) => { row.tabName = sheetName })
    rows.push(...parsed)
  }

  return { rows, unknownTabs }
}
