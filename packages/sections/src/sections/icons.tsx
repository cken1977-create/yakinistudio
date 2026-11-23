import type { SERVICE_ICONS } from '@yakini/site-schema'

type IconName = (typeof SERVICE_ICONS)[number]

/** Small inline line icons (no icon fonts, no outside requests: R2). Decorative only. */
const PATHS: Record<IconName, string> = {
  star: 'M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.6 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z',
  truck: 'M2 6h11v9H2zM13 9h4l3 3v3h-7zM6.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM16.5 18.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  calendar: 'M4 6h16v14H4zM4 10h16M8 3v5M16 3v5',
  utensils: 'M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10M17 3c-2 2-2 6 0 8v10',
  gift: 'M4 10h16v10H4zM3 7h18v3H3zM12 7v13M12 7C10 3 7 4 8 6.5 9 8 12 7 12 7zm0 0c2-4 5-3 4-.5C15 8 12 7 12 7z',
  users: 'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 6.5M18 14a6 6 0 0 1 3.5 6',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  leaf: 'M5 19C5 10 10 5 20 4c0 10-5 15-14 15zM5 19l8-8',
  flame: 'M12 21c4 0 6-2.6 6-6 0-4-3-6-4-9-1 2-2 3-3 3 0-2-1-4-2-5-1 4-5 6-5 11 0 3.4 2.5 6 8 6z',
  heart: 'M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9z',
  'map-pin': 'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z',
}

export function Icon({ name }: { name: IconName }) {
  return (
    <svg className="ys-icon" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
