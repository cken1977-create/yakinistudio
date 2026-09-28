import Link from "next/link"
import { requireOperatorOrEmployee, getOperatorDisplayName } from "@/lib/supabase/auth"
import { createClient } from "@/lib/supabase/server"

export default async function DeskPage() {
  const user = await requireOperatorOrEmployee()
  const name = await getOperatorDisplayName(user)
  const supabase = await createClient()
  const today = new Date().toISOString().slice(0, 10)
  const soon = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

  const { count: waiting } = await supabase
    .from("intake_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "new")

  const { data: due } = await supabase
    .from("grants")
    .select("id, funder, title, next_report_due")
    .gte("next_report_due", today)
    .lte("next_report_due", soon)
    .order("next_report_due", { ascending: true })
    .limit(5)

  const { data: latest } = await supabase
    .from("intake_requests")
    .select("id, full_name, need, created_at, status")
    .order("created_at", { ascending: false })
    .limit(6)

  const piles = [
    { k: "People waiting", n: waiting ?? 0, href: "/admin/intakes", a: "Open the queue" },
    { k: "Reports in 30 days", n: due?.length ?? 0, href: "/admin/grants", a: "Open grants" },
    { k: "Log the work", n: "A service is not done until it is written down", href: "/admin/participants", a: "Open participants" },
  ]

  return (
    <main style={{ maxWidth: 980, margin: "0 auto", padding: "2rem 1.2rem 4rem" }}>
      <p style={{ letterSpacing: "0.16em", textTransform: "uppercase", fontSize: 12, color: "#CE1126" }}>Operator desk</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 500, fontSize: "clamp(2rem, 4vw, 3rem)", margin: "0.2rem 0 1rem" }}>
        Good morning{name ? `, ${name}` : ""}.
      </h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {piles.map((p) => (
          <Link key={p.k} href={p.href} style={{ textDecoration: "none", color: "#0A0A0A", border: "1px solid #E5E5E5", padding: "1rem", borderTop: "4px solid #0A2548" }}>
            <div style={{ fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "#767676" }}>{p.k}</div>
            <div style={{ fontFamily: "Georgia, serif", fontSize: 28, margin: "0.35rem 0" }}>{p.n}</div>
            <div style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>{p.a}</div>
          </Link>
        ))}
      </div>
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>Latest requests</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {(latest ?? []).map((row) => (
            <li key={row.id} style={{ borderBottom: "1px solid #eee", padding: "0.7rem 0" }}>
              <strong>{row.full_name || "No name"}</strong>
              <span style={{ color: "#666" }}> · {row.need || "need not stated"} · {row.status}</span>
            </li>
          ))}
          {(latest ?? []).length === 0 && <li>No requests yet. The Get Help form fills this list.</li>}
        </ul>
      </section>
      <section style={{ marginTop: 20 }}>
        <h2 style={{ fontFamily: "Georgia, serif", fontWeight: 500 }}>Due soon</h2>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {(due ?? []).map((g) => (
            <li key={g.id} style={{ borderBottom: "1px solid #eee", padding: "0.7rem 0" }}>
              {g.funder || g.title} · {g.next_report_due}
            </li>
          ))}
          {(due ?? []).length === 0 && <li>No grant report due in the next 30 days.</li>}
        </ul>
      </section>
    </main>
  )
}
