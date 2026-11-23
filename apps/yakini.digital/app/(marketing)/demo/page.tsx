import { SiteShell } from '@/components/SiteShell'
import { DemoBuilder } from '@/components/demo/DemoBuilder'
import { DEMO_CSS } from '@/components/demo/demo-css'
import { handoffFromEnv } from '@/lib/demo/handoff'
import { HEADLINE } from '@/lib/pricing'

// BUILDER_HANDOFF_ENABLED is read when the page is built, so the page stays static and fast.
// Vercel ties env values to a deployment anyway: flip the flag, then redeploy.

export default function DemoPage() {
  return (
    <SiteShell>
      <style>{DEMO_CSS}</style>
      <header className="yk-page-header pr-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow">
            <span className="yk-eyebrow-dot" />
            <span>FREE KIT DEMO</span>
          </div>
          <h1 className="yk-page-h1">
            See your demo right now.
            <br />
            <span className="yk-gold">Free, no contact info needed.</span>
          </h1>
          <p className="yk-page-sub">
            Paste your website. We pull your logo, colors, and name from the public page, you pick a kit, and you walk through a sample of that kit in your brand. It is free, and you do not have to leave a name, email, or phone number to see it. {HEADLINE}
          </p>
        </div>
      </header>
      <section className="yk-section pr-build" id="demo">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">01</span><span>Build a free demo</span></div>
          <h2 className="yk-section-h2">Walk through your kit. Sample data, clearly labeled.</h2>
          <DemoBuilder handoff={handoffFromEnv()} />
        </div>
      </section>
    </SiteShell>
  )
}
