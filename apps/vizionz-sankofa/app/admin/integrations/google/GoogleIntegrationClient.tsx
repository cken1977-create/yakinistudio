'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Connection = {
  id: string
  google_email: string
  scopes: string
  created_at: string
  last_used_at: string | null
} | null

type Mapping = {
  id: string
  sheet_name: string
  spreadsheet_id: string
  last_synced_at: string | null
  is_active: boolean
}

type Props = {
  displayName: string
  connection: Connection
  mappings: Mapping[]
  justConnected: boolean
  connectedEmail: string | null
  errorCode: string | null
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Google did not return an authorization code.',
  missing_state: 'Session state missing — possible CSRF. Try again.',
  invalid_state: 'Session state mismatch — possible CSRF. Try again.',
  incomplete_tokens: 'Google did not return complete tokens. Try again.',
  missing_user_info: 'Could not retrieve your Google account info.',
  userinfo_fetch_failed: 'Failed to contact Google. Try again.',
  database_insert_failed: 'Could not save connection. Contact support.',
}

export default function GoogleIntegrationClient({
  displayName,
  connection,
  mappings,
  justConnected,
  connectedEmail,
  errorCode,
}: Props) {
  const router = useRouter()
  const [disconnecting, setDisconnecting] = useState(false)

  async function handleDisconnect() {
    if (!connection) return
    setDisconnecting(true)
    await fetch('/api/integrations/google/disconnect', { method: 'POST' })
    router.refresh()
  }

  function handleConnect() {
    window.location.href = '/api/integrations/google/start'
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Google Integration</h1>
        <p className="text-sm text-gray-500 mt-1">Signed in as {displayName}</p>
      </div>

      {/* Success banner */}
      {justConnected && connectedEmail && (
        <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          ✓ Connected as <strong>{connectedEmail}</strong>
        </div>
      )}

      {/* Error banner */}
      {errorCode && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          {ERROR_MESSAGES[errorCode] ?? 'An unexpected error occurred. Try again.'}
        </div>
      )}

      {/* Connection status card */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-700">Status</p>
            {connection ? (
              <p className="text-sm text-gray-900 mt-0.5">
                Connected as <strong>{connection.google_email}</strong>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-0.5">Not connected</p>
            )}
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              connection
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            {connection ? 'Active' : 'Disconnected'}
          </span>
        </div>

        {connection && (
          <div className="text-xs text-gray-400 space-y-0.5">
            <p>Connected {new Date(connection.created_at).toLocaleDateString()}</p>
            {connection.last_used_at && (
              <p>Last used {new Date(connection.last_used_at).toLocaleDateString()}</p>
            )}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          {connection ? (
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
            >
              {disconnecting ? 'Disconnecting…' : 'Disconnect Google account'}
            </button>
          ) : (
            <button
              onClick={handleConnect}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Connect Google account
            </button>
          )}
        </div>
      </div>

      {/* Sheet mappings */}
      {connection && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-700">Sheet Imports</h2>
            <a
              href={`/admin/integrations/google/${connection.id}/sheets`}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              + Import a sheet
            </a>
          </div>

          {mappings.length === 0 ? (
            <p className="text-sm text-gray-400">No sheets imported yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white">
              {mappings.map((m) => (
                <li key={m.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{m.sheet_name}</p>
                    {m.last_synced_at && (
                      <p className="text-xs text-gray-400">
                        Last synced {new Date(m.last_synced_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <a
                    href={`/admin/integrations/google/${connection.id}/sheets`}
                    className="text-xs text-blue-600 hover:text-blue-800"
                  >
                    Manage
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
