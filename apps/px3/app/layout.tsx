import { BrandProvider } from "@yakini/ui"
import { validateBrandConfig } from "@yakini/config"
import { config } from "@/config/brand"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"
const validation = validateBrandConfig(config)
if (!validation.valid) {
  throw new Error(`Invalid brand config: ${validation.errors.join(", ")}`)
}
export const metadata = {
  title: `${config.business.name} — ${config.business.tagline}`,
  description: config.business.description,
}
const PAD = "https://cdn.midjourney.com/eda74f6d-5c3d-4855-9240-7d3d009c5bf6/0_0.png"
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#070605", color: "#f3e6d4" }}>
        <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(180deg, rgba(7,6,5,0.58) 0%, rgba(7,6,5,0.88) 52%, #070605 100%), url(${PAD})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <BrandProvider config={config}>
            <Header config={config} />
            <main style={{ minHeight: "80vh" }}>{children}</main>
            <Footer config={config} />
          </BrandProvider>
        </div>
      </body>
    </html>
  )
}
