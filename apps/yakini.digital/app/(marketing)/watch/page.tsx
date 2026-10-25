import type { Metadata } from 'next'
import { SiteShell } from '@/components/SiteShell'
import { FinalCta } from '@/components/site/Sections'
import { SECTIONS_CSS } from '@/components/site/content'
import { CLIPS, FULL, FULL_CHAPTERS, SHOWCASE } from '@/lib/watch'
import { VideoCard } from './VideoCard'
import { WATCH_CSS } from './watch-css'

const lead = FULL ?? CLIPS[0]
const DESC = 'Short videos of the Yakini portal: plans, setup, customer rooms, the help desk and booking. Press play, no sign-in.'

export const metadata: Metadata = {
  title: 'Watch · See Yakini in action',
  description: DESC,
  alternates: { canonical: '/watch' },
  openGraph: {
    title: 'See Yakini in action',
    description: DESC,
    url: '/watch',
    siteName: 'Yakini',
    type: 'video.other',
    images: [{ url: lead.poster, width: 1280, height: 720, alt: lead.title }],
    videos: [{ url: lead.src, secureUrl: lead.src, type: 'video/mp4', width: 1920, height: 1080 }],
  },
  twitter: { card: 'summary_large_image', title: 'See Yakini in action', description: DESC, images: [lead.poster] },
}

export default function WatchPage() {
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + WATCH_CSS}</style>
      <header className="yk-page-header wv-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>WATCH</span></div>
          <h1 className="yk-page-h1">
            See Yakini
            <br />
            <span className="yk-gold yk-italic">in action.</span>
          </h1>
          <p className="yk-page-sub">The full five-minute walkthrough, or one short video at a time, with captions. Press play. Nothing to download and no sign-in.</p>
        </div>
      </header>

      <div className="wv-wrap">
        {FULL && (
          <section className="wv-section" aria-label="The full walkthrough">
            <VideoCard v={FULL} big label="The full walkthrough" chapters={FULL_CHAPTERS} />
          </section>
        )}

        <section className="wv-section" aria-labelledby="wv-parts">
          <h2 id="wv-parts" className="wv-h2">{FULL ? 'Or watch one part' : 'The portal, one minute at a time'}</h2>
          <p className="wv-lead">Each video has its own link. Use &ldquo;Share this video&rdquo; to send one or post it.</p>
          <div className="wv-grid">
            {CLIPS.map((v, i) => <VideoCard key={v.id} v={v} label={`Video ${i + 1} of ${CLIPS.length}`} />)}
          </div>
        </section>

        {SHOWCASE.length > 0 && (
          <section className="wv-section" aria-labelledby="wv-showcase">
            <h2 id="wv-showcase" className="wv-h2">See what we build</h2>
            <p className="wv-lead">Custom builds for real kinds of businesses.</p>
            <div className="wv-grid">
              {SHOWCASE.map((v) => <VideoCard key={v.id} v={v} />)}
            </div>
          </section>
        )}
      </div>

      <FinalCta />
    </SiteShell>
  )
}
