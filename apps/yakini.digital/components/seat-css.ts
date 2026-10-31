// Founding seat meter styles (plain module so server pages can import it).
export const SEAT_CSS = `
  .yk-seats { margin-top: 18px; }
  .yk-seats-bar { display: flex; gap: 6px; }
  .yk-seat { flex: 1; height: 8px; border-radius: 999px; background: var(--gold, #1638E8); box-shadow: 0 0 12px rgba(22,56,232,0.35); }
  .yk-seat-taken { background: rgba(11,20,55,0.2); box-shadow: none; }
  .yk-seats-copy { margin-top: 10px; font-size: 15px; color: rgba(11,20,55,0.85); }
  .yk-seats-copy strong { color: var(--gold, #1638E8); }
`
