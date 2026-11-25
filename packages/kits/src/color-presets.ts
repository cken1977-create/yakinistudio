import type { Palette } from './types'

/**
 * Ready-made color sets an owner can pick on /new when they don't have brand colors yet. Picking
 * one is the owner's own choice, so it is stored exactly as listed and labelled as theirs (R6).
 * Each set is Main (buttons and headings), Dark (header, footer and text) and Accent (highlights).
 */
export type ColorPreset = { id: string; name: string; colors: Palette }

export const COLOR_PRESETS: readonly ColorPreset[] = [
  { id: 'navy-gold', name: 'Navy and gold', colors: { primary: '#1F4E79', secondary: '#14202B', accent: '#E0A526' } },
  { id: 'brick-cream', name: 'Brick and cream', colors: { primary: '#9A3B2E', secondary: '#2A1A15', accent: '#E8C88A' } },
  { id: 'forest', name: 'Forest', colors: { primary: '#2F6B3F', secondary: '#16241A', accent: '#C2D86B' } },
  { id: 'ocean', name: 'Ocean', colors: { primary: '#0F6E8C', secondary: '#0C2430', accent: '#5FD3C6' } },
  { id: 'sunset', name: 'Sunset', colors: { primary: '#D2572B', secondary: '#2B1B17', accent: '#F4B942' } },
  { id: 'plum', name: 'Plum', colors: { primary: '#6B2D5C', secondary: '#21131D', accent: '#E5A3C4' } },
  { id: 'charcoal-red', name: 'Charcoal and red', colors: { primary: '#C8102E', secondary: '#1E1E1E', accent: '#9AA0A6' } },
  { id: 'sage', name: 'Sage and clay', colors: { primary: '#6E8B74', secondary: '#25302A', accent: '#D08C60' } },
  { id: 'royal', name: 'Royal purple', colors: { primary: '#4B2E83', secondary: '#1A1230', accent: '#F2C14E' } },
  { id: 'teal-coral', name: 'Teal and coral', colors: { primary: '#127A72', secondary: '#0E2624', accent: '#FF7F66' } },
  { id: 'earth', name: 'Earth', colors: { primary: '#8B5E34', secondary: '#2B2118', accent: '#D9B26F' } },
  { id: 'slate-blue', name: 'Slate blue', colors: { primary: '#3E5C76', secondary: '#1D2731', accent: '#F0A202' } },
  { id: 'kente', name: 'Kente', colors: { primary: '#B22222', secondary: '#1C1A14', accent: '#F2B705' } },
  { id: 'pine-copper', name: 'Pine and copper', colors: { primary: '#1E5945', secondary: '#0F1F19', accent: '#C77B48' } },
  { id: 'blush', name: 'Blush', colors: { primary: '#B5546A', secondary: '#2A1C21', accent: '#F3C9B9' } },
  { id: 'black-white', name: 'Black and white', colors: { primary: '#111111', secondary: '#111111', accent: '#BDBDBD' } },
]

export function colorPresetById(id: string | undefined | null): ColorPreset | undefined {
  return id ? COLOR_PRESETS.find((p) => p.id === id) : undefined
}
