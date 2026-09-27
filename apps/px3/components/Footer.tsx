import Link from "next/link";
import type { BrandConfig } from "@yakini/config";
export function Footer({ config }: { config: BrandConfig }) {
  return (
    <footer style={{ padding: "2.5rem 1.5rem", borderTop: "1px solid rgba(224,122,47,0.18)", color: "#8a7d70", fontSize: 13 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <span>{config.business.name} · Odessa, Texas</span>
        <span>Prestige Production Performance</span>
      </div>
      <p style={{ marginTop: 12 }}><Link href="/contact" style={{ color: "#e07a2f" }}>Request a crew</Link></p>
    </footer>
  );
}
