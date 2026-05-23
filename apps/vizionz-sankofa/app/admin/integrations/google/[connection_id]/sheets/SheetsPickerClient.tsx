'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type ExistingMapping = {
  id: string
  sheet_name: string
  spreadsheet_id: string
  last_synced_at: string | null
}

type SheetOption = {
  spreadsheetId: string
  title: string
}

type Props = {
  displayName: string
  connectionId: string
  googleEmail: string
  existingMappings: ExistingMapping[]
}

export default function SheetsPickerClient({
  displayName,
  connectionId,
  googleEmail,
  existingMappings,
}: Props) {
  const router = useRouter()
  const [sheets, setSheets] = useState<SheetOption[]>([])
  const [loadingSheets, setLoadingSheets] = useState(false)
  const [sheetsError, setSheetsError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string>('')
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ inserted: number; skipped: number } | null>(null)
  const [importError, setImportError] = useState<string | null>(null)

  async function loadSheets() {
    setLoadingSheets(true)
    setSheetsError(null)
    try {
      const res = await fetch(`/api/integrations/google/sheets?connection_id=${connectionId}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed to load sheets')
      setSheets(json.sheets ?? [])
    } catch (err: unknown) {
      setSheetsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingSheets(false)
    }
  }

  async function handleImport() {
    if (!selectedId) return
    setImporting(true)
    setImportError(null)
    setImportResult(null)
    try {
      const res = await fetch('/api/integrations/google/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connection_id: connectionId, spreadsheet_id: selectedId }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Import failed')
      setImportResult({ inserted: json.inserted ?? 0, skipped: json.skipped ?? 0 })
      router.refresh()
    } catch (err: unknown) {
      setImportError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setImporting(false)
    }
  }

  const selectedSheet = sheets.find(s => s.spreadsheetId === selectedId)

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <a href="/admin/integrations/google" className="text-sm text-blue-600 hover:text-blue-800">
          ← Back to Google Integration
        </a>
        <h1 className="text-2xl font-semibold text-gray-900 mt-2">Import from Google Sheets</h1>
        <p className="text-sm text-gray-500 mt-1">
          Signed in as {displayName} · Connected as {googleEmail}
        </p>
      </div>

      {/* Existing mappings */}
      {existingMappings.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Previously imported</p>
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
            {existingMappings.map(m => (
              <li key={m.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">{m.sheet_name}</p>
                {m.last_synced_at && (
                  <p className="text-xs text-gray-400">
                    Last synced {new Date(m.last_synced_at).toLocaleDateString()}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Sheet picker */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <p className="text-sm font-medium text-gray-700">Select a spreadsheet to import</p>

        {sheets.length === 0 && !loadingSheets && (
          <button
            onClick={loadSheets}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Load my Google Sheets
          </button>
        )}

        {loadingSheets && (
          <p className="text-sm text-gray-400">Loading your sheets…</p>
        )}

        {sheetsError && (
          <p className="text-sm text-red-600">{sheetsError}</p>
        )}

        {sheets.length > 0 && (
          <div className="space-y-3">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Choose a sheet —</option>
              {sheets.map(s => (
                <option key={s.spreadsheetId} value={s.spreadsheetId}>
                  {s.title}
                </option>
              ))}
            </select>

            {selectedSheet && (
              <button
                onClick={handleImport}
                disabled={importing}
                className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
              >
                {importing ? 'Importing…' : `Import "${selectedSheet.title}"`}
              </button>
            )}
          </div>
        )}

        {importResult && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            ✓ Import complete — {importResult.inserted} added, {importResult.skipped} skipped
          </div>
        )}

        {importError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {importError}
          </div>
        )}
      </div>
    </div>
  )
}
