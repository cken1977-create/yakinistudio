import Link from "next/link";
import { config } from "@/config/brand";

const MARK = "https://cdn.midjourney.com/bcb5412a-c0e6-4027-8654-5e6b9a04ef54/0_0.png";
const CREST_VIDEO = "https://cdn.midjourney.com/video/38673713-5cb1-4157-8fc1-b7fe1fbc402a/1.mp4";
const PAD = "https://cdn.midjourney.com/eda74f6d-5c3d-4855-9240-7d3d009c5bf6/0_0.png";
const CREW = "https://cdn.midjourney.com/cc8f150f-43db-44ff-a8ad-2212384d88e3/0_2.png";

export default function HomePage() {
  return (
    <div style={{ background: "#070605", color: "#f3e6d4" }}>
      <section style={{ minHeight: "88vh", display: "grid", placeItems: "center", padding: "3.5rem 1.5rem 4rem", background: "radial-gradient(70% 50% at 50% 0%, #3a1a0a 0%, #070605 58%)" }}>
        <div style={{ maxWidth: 720, textAlign: "center" }}>
          <p style={{ letterSpacing: "0.28em", fontSize: 11, color: "#e07a2f", textTransform: "uppercase", marginBottom: 20 }}>Odessa · Permian Basin</p>
          <video autoPlay muted loop playsInline poster={MARK} style={{ width: "min(420px, 86vw)", height: "auto", margin: "0 auto 1.6rem", background: "#070605" }}>
            <source src={CREST_VIDEO} type="video/mp4" />
          </video>
          <h1 style={{ fontFamily: "Georgia, Times New Roman, serif", fontWeight: 400, fontSize: "clamp(2.8rem, 8vw, 5.6rem)", lineHeight: 0.92, margin: "0 0 1.1rem", color: "#f6ead8" }}>
            Prestige<br /><em style={{ color: "#e07a2f", fontStyle: "italic" }}>on the pad.</em>
          </h1>
          <p style={{ maxWidth: 520, margin: "0 auto 2rem", color: "#b7a898", fontSize: 18 }}>{config.home.hero.subheadline}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/contact" style={{ background: "#e07a2f", color: "#1a0c04", padding: "0.95rem 1.4rem", textDecoration: "none", letterSpacing: "0.12em", fontSize: 12, textTransform: "uppercase", fontWeight: 700 }}>Request a crew</Link>
            <Link href="/services" style={{ border: "1px solid #5a3a28", color: "#f3e6d4", padding: "0.95rem 1.4rem", textDecoration: "none", letterSpacing: "0.12em", fontSize: 12, textTransform: "uppercase" }}>What we send</Link>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 980, margin: "0 auto", padding: "0 1.5rem 5rem" }}>
        <p style={{ letterSpacing: "0.22em", fontSize: 11, color: "#e07a2f", textTransform: "uppercase" }}>The work</p>
        <h2 style={{ fontFamily: "Georgia, serif", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 400, margin: "0.4rem 0 1.5rem" }}>Pad light. Named hands.</h2>
        <img src={PAD} alt="" style={{ width: "100%", height: "auto", marginBottom: 28 }} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 28, alignItems: "center" }}>
          <img src={CREW} alt="" style={{ width: "100%", height: "auto" }} />
          <div>
            <p style={{ color: "#b7a898", fontSize: 17, lineHeight: 1.55, margin: 0 }}>
              Production locations in the Permian. The roster is named. The cards are dated. If a hand cannot stand on that pad this morning, he does not roll.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
