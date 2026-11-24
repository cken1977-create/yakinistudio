'use client'
import QRCode from 'qrcode'

/** QR code for the live address (spec 5.6 step 6), drawn as plain SVG rectangles. No HTML strings. */
export function Qr({ value, size = 168 }: { value: string; size?: number }) {
  let qr
  try { qr = QRCode.create(value, { errorCorrectionLevel: 'M' }) } catch { return null }
  const n = qr.modules.size
  const cells: React.ReactNode[] = []
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (qr.modules.get(x, y)) cells.push(<rect key={`${x}-${y}`} x={x + 4} y={y + 4} width="1" height="1" />)
  return (
    <svg role="img" aria-label={`QR code for ${value}`} viewBox={`0 0 ${n + 8} ${n + 8}`} width={size} height={size} shapeRendering="crispEdges" className="rounded-xl bg-white">
      <rect width={n + 8} height={n + 8} fill="#fff" />
      <g fill="#000">{cells}</g>
    </svg>
  )
}
