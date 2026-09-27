export default function Page() {
  const items = [
    ["Roustabout", "Location labor. Pad and lease work. The base of the company."],
    ["Laboring hands", "Named extra hands when a crew is short."],
    ["Rig-up / rig-down", "Crews to stand up and tear down. We take the days we can staff."],
    ["Transportation", "Moves in the basin when the truck and the insurance match the ticket."],
    ["Flowback operators", "Operators for flowback when the ticket calls for it."],
    ["Cement jobs", "Hands and support on cement work. Not a cementing company — labor on the job."],
  ];
  return (
    <section style={{ maxWidth: 820, margin: "0 auto", padding: "5rem 1.5rem 6rem" }}>
      <p style={{ letterSpacing: "0.22em", fontSize: 11, color: "#e07a2f", textTransform: "uppercase" }}>PX3 Energy · Permian Basin</p>
      <h1 style={{ fontFamily: "Georgia, serif", fontWeight: 400, fontSize: "clamp(2.4rem, 6vw, 4.2rem)", lineHeight: 0.95, margin: "0.4rem 0 1.2rem" }}>What we send.</h1>
      <p style={{ color: "#d2c4b4", fontSize: 18, lineHeight: 1.55, maxWidth: 580 }}>West Texas and southern New Mexico. We list the work we will take. We do not take a ticket we cannot staff.</p>
      <ul style={{ listStyle: "none", padding: 0, margin: "2.5rem 0 0" }}>
        {items.map(([title, body]) => (
          <li key={title} style={{ borderTop: "1px solid rgba(224,122,47,0.22)", padding: "1.25rem 0" }}>
            <div style={{ color: "#e07a2f", letterSpacing: "0.14em", fontSize: 11, textTransform: "uppercase" }}>{title}</div>
            <p style={{ color: "#d2c4b4", margin: "0.4rem 0 0", fontSize: 17 }}>{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
