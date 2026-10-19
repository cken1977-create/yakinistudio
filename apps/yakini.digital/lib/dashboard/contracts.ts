// Contract email templates and titles, shared by the dashboard page and its server routes.
// Callers must pass HTML-escaped values (the server routes do).

export const SIGN_BASE_URL = 'https://yakini.digital/sign'

export function contractTitle(type: string, business: string): string {
  const titles: Record<string, string> = {
    msa_sow: `Master Services Agreement & Statement of Work — ${business}`,
    msa:     `Master Services Agreement — ${business}`,
    sow:     `Statement of Work — ${business}`,
    nda:     `Non-Disclosure Agreement — ${business}`,
    custom:  `Service Agreement — ${business}`,
  }
  return titles[type] || `Service Agreement — ${business}`
}

// ── Email Templates ────────────────────────────────────────────────────────
export function buildClientEmail({ name, business, title, signingLink, setupFee, monthly, services, expiresAt }: {
  name: string, business: string, title: string, signingLink: string,
  setupFee: string, monthly: string, services: string[], expiresAt: string
}) {
  const svcList = services.map(s => `<li style="padding:4px 0;font-size:13px;color:#555;">${s}</li>`).join('')
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F6F3EE;">
      <div style="background:#1A3A5C;padding:28px 32px;">
        <div style="font-weight:700;font-size:20px;color:white;letter-spacing:2px;">YAKINI</div>
        <div style="font-size:9px;color:#C8A84B;letter-spacing:3px;margin-top:3px;">DIGITAL INFRASTRUCTURE</div>
      </div>
      <div style="background:#C8A84B;height:3px;"></div>
      <div style="padding:36px 32px;">
        <h2 style="font-size:22px;color:#1A3A5C;margin:0 0 8px;">Your contract is ready to sign.</h2>
        <p style="font-size:15px;color:#555;margin:0 0 24px;">Hi ${name} — your Yakini service agreement for <strong>${business}</strong> is ready for your review and signature.</p>

        <div style="background:white;border:1px solid #E0DBD0;border-radius:4px;padding:24px;margin-bottom:24px;">
          <div style="font-size:9px;font-weight:700;color:#C8A84B;letter-spacing:2px;margin-bottom:12px;">DOCUMENT</div>
          <div style="font-size:14px;font-weight:600;color:#1A3A5C;margin-bottom:16px;">${title}</div>
          ${setupFee ? `<div style="font-size:13px;color:#555;margin-bottom:6px;">Setup Fee: <strong>$${setupFee}</strong></div>` : ''}
          ${monthly ? `<div style="font-size:13px;color:#555;margin-bottom:6px;">Monthly Retainer: <strong>$${monthly}/month</strong></div>` : ''}
          ${svcList ? `<div style="font-size:9px;font-weight:700;color:#888;letter-spacing:1.5px;margin:16px 0 8px;">SERVICES INCLUDED</div><ul style="margin:0;padding-left:18px;">${svcList}</ul>` : ''}
        </div>

        <a href="${signingLink}" style="display:block;background:#1A3A5C;color:white;text-align:center;padding:18px 28px;border-radius:3px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:1px;margin-bottom:16px;">
          Review &amp; Sign Your Contract →
        </a>

        <p style="font-size:12px;color:#999;text-align:center;margin:0 0 8px;">
          This link expires on ${new Date(expiresAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.
        </p>
        <p style="font-size:12px;color:#999;text-align:center;margin:0;">
          Questions? Reply to this email or call Yakini at hello@yakini.digital
        </p>
      </div>
      <div style="background:#1A3A5C;padding:16px 32px;text-align:center;">
        <p style="font-size:11px;color:#888;margin:0;">Yakini Digital Infrastructure · yakini.digital · ESIGN Act compliant</p>
      </div>
    </div>
  `
                    }
export function buildReminderEmail({ name, business, title, signingLink }: {
  name: string, business: string, title: string, signingLink: string
}) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#F6F3EE;">
      <div style="background:#1A3A5C;padding:28px 32px;">
        <div style="font-weight:700;font-size:20px;color:white;letter-spacing:2px;">YAKINI</div>
        <div style="font-size:9px;color:#C8A84B;letter-spacing:3px;margin-top:3px;">DIGITAL INFRASTRUCTURE</div>
      </div>
      <div style="background:#C8A84B;height:3px;"></div>
      <div style="padding:36px 32px;">
        <h2 style="font-size:20px;color:#1A3A5C;margin:0 0 8px;">Friendly reminder — your contract is waiting.</h2>
        <p style="font-size:14px;color:#555;margin:0 0 24px;">Hi ${name} — just a reminder that your Yakini agreement for <strong>${business}</strong> is still waiting for your signature.</p>
        <a href="${signingLink}" style="display:block;background:#1A3A5C;color:white;text-align:center;padding:18px 28px;border-radius:3px;font-weight:700;font-size:14px;text-decoration:none;letter-spacing:1px;">
          Sign Your Contract →
        </a>
      </div>
      <div style="background:#1A3A5C;padding:16px 32px;text-align:center;">
        <p style="font-size:11px;color:#888;margin:0;">Yakini Digital Infrastructure · yakini.digital</p>
      </div>
    </div>
  `
}
