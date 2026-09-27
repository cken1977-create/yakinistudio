import Link from "next/link";
import type { BrandConfig } from "@yakini/config";
export function Header({ config }: { config: BrandConfig }) {
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", position: "relative", zIndex: 2, borderBottom: "1px solid rgba(224,122,47,0.22)" }}>
      <Link href="/" style={{ color: "#f3e6d4", textDecoration: "none", letterSpacing: "0.18em", fontSize: 12, textTransform: "uppercase" }}>{config.business.dba || config.business.name}</Link>
      <nav style={{ display: "flex", gap: "1.25rem", fontSize: 13 }}>
        <Link href="/services" style={{ color: "#f3e6d4", textDecoration: "none" }}>Services</Link>
        <Link href="/about" style={{ color: "#f3e6d4", textDecoration: "none" }}>About</Link>
        <Link href="/portfolio" style={{ color: "#f3e6d4", textDecoration: "none" }}>Work</Link>
        <Link href="/contact" style={{ color: "#e07a2f", textDecoration: "none" }}>Contact</Link>
      </nav>
    </header>
  );
}
