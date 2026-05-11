// VIZIONZ SANKOFA · /admin/documents · shared types & constants (Wave 3.2 hotfix)
// Extracted from actions/documents.ts so "use server" file exports only async functions.

export type DocumentCategory =
  | 'grant_application'
  | 'grant_award'
  | 'budget'
  | 'bank_statement'
  | 'financial_report'
  | 'tax_form'
  | 'board_minutes'
  | 'mou'
  | 'contract'
  | 'program_documentation'
  | 'policy'
  | 'correspondence'
  | 'other'

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  grant_application: 'Grant Application',
  grant_award: 'Grant Award',
  budget: 'Budget',
  bank_statement: 'Bank Statement',
  financial_report: 'Financial Report',
  tax_form: 'Tax Form',
  board_minutes: 'Board Minutes',
  mou: 'MOU',
  contract: 'Contract',
  program_documentation: 'Program Documentation',
  policy: 'Policy',
  correspondence: 'Correspondence',
  other: 'Other',
}

export type UploadDocumentInput = {
  title: string
  category: DocumentCategory
  description?: string | null
  document_date?: string | null
  related_intake?: string | null
  related_program?: string | null
  file_name: string
  file_size_bytes: number
  mime_type: string
  storage_path: string
}

export type UploadResult =
  | { ok: true; document_id: string; storage_path: string }
  | { ok: false; error: string; file_name: string }

export type UpdateDocumentInput = {
  title?: string
  category?: DocumentCategory
  description?: string | null
  document_date?: string | null
  related_intake?: string | null
  related_program?: string | null
}
