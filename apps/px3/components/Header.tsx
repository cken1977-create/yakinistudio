import Link from "next/link";
import type { BrandConfig } from "@yakini/config";

export function Header({ config }: { config: BrandConfig }) {
  const name = config.business.dba || config.business.name;
  return (
    <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.5rem", borderBottom: "1px solid rgba(196,164,106,0.22)" }}>
      <Link href="/" style={{ color: "#efe8dc", textDecoration: "none", letterSpacing: "0.16em", fontSize: 12, textTransform: "uppercase" }}>{name}</Link>
      <nav style={{ display: "flex", gap: "1.25rem", fontSize: 13 }}>
        <Link href="/services" style={{ color: "#efe8dc", textDecoration: "none" }}>Services</Link>
        <Link href="/about" style={{ color: "#efe8dc", textDecoration: "none" }}>About</Link>
        <Link href="/portfolio" style={{ color: "#efe8dc", textDecoration: "none" }}>Work</Link>
        <Link href="/contact" style={{ color: "#efe8dc", textDecoration: "none" }}>Contact</Link>
        <a href="https://composer.yakini.digital" style={{ color: "#c4a46a", textDecoration: "none" }}>Composer</a>
      </nav>
    </header>
  );
}
