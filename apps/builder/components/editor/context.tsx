'use client'
import { createContext, useContext } from 'react'
import type { EditOp } from '@yakini/edits'
import type { SiteDoc } from '@yakini/site-schema'
import type { EditSession } from '@/lib/editor/session'

/** What every editor panel needs: the working copy and a way to change it. */
export type Photo = { id: string; width: number; height: number; alt: string; generated?: boolean }
export type EditorApi = {
  siteId: string
  doc: SiteDoc
  session: EditSession
  pageId: string
  selected: string | null
  select: (sectionId: string | null) => void
  showPage: (pageId: string) => void
  /** Apply a change; returns an error to show next to the control, or null. */
  change: (ops: EditOp[], label: string, coalesceKey?: string) => string | null
  photos: Photo[]
  refreshPhotos: () => Promise<void>
  imageUrl: (assetId: string) => string | null
  canManageVersions: boolean
  anonymous: boolean
}

export const EditorContext = createContext<EditorApi | null>(null)
export function useEditor(): EditorApi {
  const v = useContext(EditorContext)
  if (!v) throw new Error('useEditor outside the editor')
  return v
}

export const panel = {
  h2: 'font-serif text-xl text-paper',
  label: 'block text-sm font-semibold text-paper',
  input: 'mt-1 block w-full rounded-lg border border-paper/25 bg-[#15130F] px-3 py-2.5 text-base text-paper placeholder:text-paper/40 focus:border-gold focus:outline-none',
  hint: 'mt-1 text-xs text-muted',
  error: 'mt-1 text-sm text-[#F2B8A8]',
  btn: 'inline-flex min-h-11 items-center justify-center gap-1 rounded-full border border-paper/25 px-4 text-sm font-semibold text-paper hover:border-gold disabled:cursor-not-allowed disabled:opacity-40',
  icon: 'inline-flex h-11 w-11 items-center justify-center rounded-full border border-paper/20 text-paper hover:border-gold disabled:cursor-not-allowed disabled:opacity-30',
  primary: 'inline-flex min-h-11 items-center justify-center rounded-full bg-gold px-5 text-sm font-semibold text-ink hover:brightness-110 disabled:opacity-50',
} as const
