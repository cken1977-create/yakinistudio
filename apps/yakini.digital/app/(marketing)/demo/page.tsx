'use client'

import { SiteShell } from '@/components/SiteShell'
import { DemoBuilder } from '@/components/demo/DemoBuilder'
import { DEMO_CSS } from '@/components/demo/demo-css'
import { HEADLINE, PITCH, QUOTE_NOTE } from '@/lib/pricing'

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
            See your kit
            <br />
            <span className="yk-gold">in your brand, in a minute.</span>
          </h1>
          <p className="yk-page-sub">
            Enter your website. We pull your logo, colors, and name from the public page, you pick a kit and the features you want, and you get a sample dashboard plus an estimate. {HEADLINE}
          </p>
          <p className="pr-lead">{PITCH} {QUOTE_NOTE}</p>
        </div>
      </header>
      <section className="yk-section pr-build" id="demo">
        <div className="yk-section-inner">
          <div className="yk-section-tag"><span className="yk-num">01</span><span>Build a free demo</span></div>
          <h2 className="yk-section-h2">Your site. Your kit. Sample data, clearly labeled.</h2>
          <DemoBuilder />
        </div>
      </section>
    </SiteShell>
  )
}
