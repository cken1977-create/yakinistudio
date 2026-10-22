// Founding seat meter styles (plain module so server pages can import it).
export const SEAT_CSS = `
  .yk-seats { margin-top: 18px; }
  .yk-seats-bar { display: flex; gap: 6px; }
  .yk-seat { flex: 1; height: 8px; border-radius: 999px; background: var(--gold, #C9A84C); box-shadow: 0 0 12px rgba(201,168,76,0.35); }
  .yk-seat-taken { background: rgba(245,239,227,0.18); box-shadow: none; }
  .yk-seats-copy { margin-top: 10px; font-size: 15px; color: rgba(245,239,227,0.85); }
  .yk-seats-copy strong { color: var(--gold, #C9A84C); }
`
