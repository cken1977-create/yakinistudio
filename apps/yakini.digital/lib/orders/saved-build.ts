// In-progress /start build. Stored on the device, and optionally emailed as a link.
// The portal draft endpoint may not exist yet. Callers treat a miss as "nothing to restore".

import { emptyDraft, validEmail, type ContactDetails, type Draft } from './logic'

export const BUILD_STORAGE_KEY = 'yakini.build'
const STEP_COUNT = 5
const TOKEN_RE = /^[A-Za-z0-9_-]{6,200}$/

export type SavedBuild = {
  step: number
  templateId: string
  businessId: string
  businessOther: string
  featureIds: string[]
  addonIds: string[]
  planId: string
  planTouched: boolean
  domainKind: 'existing' | 'register'
  domain: string
  hostname: string
  hostnameTouched: boolean
  preferredNames: string[]
  contact: ContactDetails
}

export type BuildEmailPayload = {
  consent: true
  name: string
  email: string
  build: SavedBuild
}

const BUILD_KEYS = [
  'step',
  'templateId',
  'businessId',
  'businessOther',
  'featureIds',
  'addonIds',
  'planId',
  'planTouched',
  'domainKind',
  'domain',
  'hostname',
  'hostnameTouched',
  'preferredNames',
  'contact',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function clip(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}

function strList(value: unknown, max: number, itemMax = 80): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().slice(0, itemMax))
    .filter(Boolean)
    .slice(0, max)
}

/** Pull a build out of local storage, a portal draft, or `{ build }` / `{ draft }` wrappers. */
export function parseSavedBuild(raw: unknown): SavedBuild | null {
  if (!isRecord(raw)) return null
  const source = isRecord(raw.build) ? raw.build : isRecord(raw.draft) ? raw.draft : raw
  if (!BUILD_KEYS.some((key) => key in source)) return null
  const contactRaw = isRecord(source.contact) ? source.contact : {}
  const step = typeof source.step === 'number' && Number.isFinite(source.step) ? Math.trunc(source.step) : 0
  const planId = clip(source.planId, 40)
  return {
    step: Math.min(STEP_COUNT - 1, Math.max(0, step)),
    templateId: clip(source.templateId, 80),
    businessId: clip(source.businessId, 80),
    businessOther: clip(source.businessOther, 200),
    featureIds: strList(source.featureIds, 40),
    addonIds: strList(source.addonIds, 40),
    planId,
    planTouched: source.planTouched === true || (!('planTouched' in source) && planId.length > 0),
    domainKind: source.domainKind === 'register' ? 'register' : 'existing',
    domain: clip(source.domain, 253),
    hostname: clip(source.hostname, 253),
    hostnameTouched: source.hostnameTouched === true,
    preferredNames: strList(source.preferredNames, 5),
    contact: {
      name: clip(contactRaw.name, 80),
      email: clip(contactRaw.email, 254),
      phone: clip(contactRaw.phone, 40),
      businessName: clip(contactRaw.businessName, 200),
    },
  }
}

export function savedFromDraft(draft: Draft, step: number): SavedBuild {
  return {
    step: Math.min(STEP_COUNT - 1, Math.max(0, Math.trunc(step))),
    templateId: draft.templateId,
    businessId: draft.businessId,
    businessOther: draft.businessOther,
    featureIds: draft.featureIds.slice(0, 40),
    addonIds: draft.addonIds.slice(0, 40),
    planId: draft.planId,
    planTouched: draft.planTouched,
    domainKind: draft.domainKind,
    domain: draft.domain,
    hostname: draft.hostname,
    hostnameTouched: draft.hostnameTouched,
    preferredNames: draft.preferredNames.slice(0, 5),
    contact: { ...draft.contact },
  }
}

export function draftFromSaved(saved: SavedBuild, fallbackPlanId = ''): Draft {
  const base = emptyDraft(saved.planId || fallbackPlanId)
  return {
    ...base,
    templateId: saved.templateId,
    businessId: saved.businessId,
    businessOther: saved.businessOther,
    featureIds: saved.featureIds,
    addonIds: saved.addonIds,
    planId: saved.planId || fallbackPlanId,
    planTouched: saved.planTouched,
    domainKind: saved.domainKind,
    domain: saved.domain,
    hostname: saved.hostname,
    hostnameTouched: saved.hostnameTouched,
    preferredNames: saved.preferredNames.length ? saved.preferredNames : [''],
    contact: { ...saved.contact },
  }
}

/** A fresh visit with only the suggested plan is not a saved build. */
export function buildHasProgress(saved: SavedBuild): boolean {
  return saved.step > 0
    || saved.businessId.length > 0
    || saved.featureIds.length > 0
    || saved.addonIds.length > 0
    || saved.domain.trim().length > 0
    || saved.preferredNames.some((name) => name.trim().length > 1)
    || saved.contact.name.trim().length > 0
    || saved.contact.email.trim().length > 0
    || saved.planTouched
}

export function readStoredBuild(storage: Pick<Storage, 'getItem'>): SavedBuild | null {
  try {
    const raw = storage.getItem(BUILD_STORAGE_KEY)
    if (!raw) return null
    return parseSavedBuild(JSON.parse(raw) as unknown)
  } catch {
    return null
  }
}

export function writeStoredBuild(storage: Pick<Storage, 'setItem'>, saved: SavedBuild): void {
  try {
    storage.setItem(BUILD_STORAGE_KEY, JSON.stringify(saved))
  } catch {
    // Private mode, or a full disk. The flow still works.
  }
}

export function clearStoredBuild(storage: Pick<Storage, 'removeItem'>): void {
  try {
    storage.removeItem(BUILD_STORAGE_KEY)
  } catch {
    // Same as a write that could not land.
  }
}

/** Consent has to be explicit. Name and email come from the contact step. */
export function emailBuildPayload(saved: SavedBuild, name: string, email: string, consent: boolean): BuildEmailPayload | null {
  if (consent !== true) return null
  const cleanName = name.trim().replace(/\s+/g, ' ').slice(0, 80)
  const cleanEmail = email.trim().slice(0, 254)
  if (cleanName.length < 2 || !validEmail(cleanEmail)) return null
  return { consent: true, name: cleanName, email: cleanEmail, build: saved }
}

export function safeBuildToken(value: string): string | null {
  const token = value.trim()
  return TOKEN_RE.test(token) ? token : null
}
