'use client'

// Client wrapper for the migrate upload + preview + commit flow.

import { useState } from 'react'
import { uploadAndPreviewAction, commitMigrationAction } from './actions'
import type { MigrationPreview } from './types'

export function MigrateClient() {
  const [file, setFile] = useState<File | null>(null)
  const [stage, setStage] = useState<'idle' | 'parsing' | 'preview' | 'committing' | 'done' | 'error'>('idle')
  const [preview, setPreview] = useState<MigrationPreview | null>(null)
  const [batchId, setBatchId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [committed, setCommitted] = useState<{ counts: Record<string, number> } | null>(null)

  async function handlePreview() {
    if (!file) return
    setStage('parsing')
    setError(null)
    const form = new FormData()
    form.append('file', file)
    const result = await uploadAndPreviewAction(form)
    if (result.ok) {
      setPreview(result.preview)
      setBatchId(result.batchId)
      setStage('preview')
    } else {
      setError(result.error)
      setStage('error')
    }
  }

  async function handleCommit() {
    if (!batchId) return
    setStage('committing')
    const result = await commitMigrationAction(batchId)
    if (result.ok) {
      setCommitted({ counts: result.counts })
      setStage('done')
    } else {
      setError(result.error)
      setStage('error')
    }
  }

  return (
    <div className="space-y-4">
      {stage === 'idle' || stage === 'parsing' ? (
        <>
          <label className="block">
            <span className="text-sm font-medium text-stone-700">Workbook (.xlsx)</span>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-2 block w-full text-sm text-stone-600 file:mr-4 file:rounded-md file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-stone-700"
              disabled={stage === 'parsing'}
            />
          </label>
          {file && (
            <p className="text-xs text-stone-500">
              Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
          <button
            onClick={handlePreview}
            disabled={!file || stage === 'parsing'}
            className="rounded-md bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700 disabled:opacity-50"
          >
            {stage === 'parsing' ? 'Parsing...' : 'Parse & Preview'}
          </button>
        </>
      ) : null}

      {stage === 'preview' && preview && (
        <PreviewView
          preview={preview}
          onCommit={handleCommit}
          onCancel={() => { setStage('idle'); setPreview(null); setBatchId(null); setFile(null); }}
        />
      )}

      {stage === 'committing' && (
        <p className="text-sm text-stone-600">Committing migration to database...</p>
      )}

      {stage === 'done' && committed && (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-900">Migration complete.</p>
          <ul className="mt-2 space-y-1 text-xs text-emerald-800">
            {Object.entries(committed.counts).map(([table, count]) => (
              <li key={table}>{table}: {count} rows</li>
            ))}
          </ul>
        </div>
      )}

      {stage === 'error' && error && (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <p className="font-semibold">Error</p>
          <p className="mt-1">{error}</p>
          <button
            onClick={() => { setStage('idle'); setError(null); }}
            className="mt-3 rounded-md border border-red-300 px-3 py-1 text-xs"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}

function PreviewView({
  preview,
  onCommit,
  onCancel,
}: {
  preview: MigrationPreview
  onCommit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-stone-900">Preview — review before committing</p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone-200 text-left text-xs uppercase text-stone-500">
            <th className="py-2">Tab</th>
            <th>Rows in workbook</th>
            <th>Will create</th>
            <th>Duplicates merged</th>
            <th>Skipped</th>
          </tr>
        </thead>
        <tbody>
          {preview.tabs.map((tab) => (
            <tr key={tab.tabName} className="border-b border-stone-100">
              <td className="py-2 font-medium text-stone-800">{tab.tabName}</td>
              <td>{tab.rowsRead}</td>
              <td>{tab.willCreate}</td>
              <td>{tab.duplicatesMerged}</td>
              <td>{tab.skipped}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {preview.warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Warnings:</p>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {preview.warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      <div className="flex gap-3">
        <button
          onClick={onCommit}
          className="rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600"
        >
          Commit Migration
        </button>
        <button
          onClick={onCancel}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm text-stone-700 hover:bg-stone-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
