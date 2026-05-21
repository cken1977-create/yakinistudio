// Shared types for the migrate flow.

export type TabPreview = {
  tabName: string
  rowsRead: number
  willCreate: number
  duplicatesMerged: number
  skipped: number
}

export type MigrationPreview = {
  tabs: TabPreview[]
  warnings: string[]
}

export type ParsedRow = {
  tabName: string
  rowNumber: number
  raw: Record<string, unknown>
  // What the parser intends to do with this row at commit time
  intent:
    | { kind: 'create_participant'; data: Record<string, unknown> }
    | { kind: 'merge_participant'; matchKey: string; data: Record<string, unknown> }
    | { kind: 'archive'; data: Record<string, unknown> }
    | { kind: 'service'; data: Record<string, unknown> }
    | { kind: 'case_note'; data: Record<string, unknown> }
    | { kind: 'identifier'; data: Record<string, unknown> }
    | { kind: 'family_member'; data: Record<string, unknown> }
    | { kind: 'address'; data: Record<string, unknown> }
    | { kind: 'skip'; reason: string }
}

export type ParsedWorkbook = {
  fileName: string
  rows: ParsedRow[]
}
