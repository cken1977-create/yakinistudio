import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { SiteShell } from '@/components/SiteShell'
import { FinalCta } from '@/components/site/Sections'
import { SECTIONS_CSS } from '@/components/site/content'
import { ALL, CLIPS, videoById } from '@/lib/watch'
import { VideoCard } from '../VideoCard'
import { WATCH_CSS } from '../watch-css'

type Props = { params: Promise<{ clip: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return ALL.map((v) => ({ clip: v.id }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const v = videoById((await params).clip)
  if (!v) return {}
  const title = `${v.title} · Yakini`
  return {
    title,
    description: v.sub,
    alternates: { canonical: `/watch/${v.id}` },
    openGraph: {
      title,
      description: v.sub,
      url: `/watch/${v.id}`,
      siteName: 'Yakini',
      type: 'video.other',
      images: [{ url: v.poster, width: 1280, height: 720, alt: v.title }],
      videos: [{ url: v.src, secureUrl: v.src, type: 'video/mp4', width: 1920, height: 1080 }],
    },
    twitter: { card: 'summary_large_image', title, description: v.sub, images: [v.poster] },
  }
}

export default async function ClipPage({ params }: Props) {
  const v = videoById((await params).clip)
  if (!v) notFound()
  const i = CLIPS.findIndex((c) => c.id === v.id)
  const prev = i > 0 ? CLIPS[i - 1] : null
  const next = i >= 0 && i < CLIPS.length - 1 ? CLIPS[i + 1] : null
  return (
    <SiteShell>
      <style>{SECTIONS_CSS + WATCH_CSS}</style>
      <header className="yk-page-header wv-header">
        <div className="yk-page-header-inner">
          <div className="yk-eyebrow"><span className="yk-eyebrow-dot" /><span>WATCH{i >= 0 ? ` · PART ${i + 1} OF ${CLIPS.length}` : ''}</span></div>
          <h1 className="yk-page-h1">{v.title}</h1>
        </div>
      </header>
      <div className="wv-wrap">
        <VideoCard v={v} big label={i >= 0 ? `Part ${i + 1} of ${CLIPS.length}` : undefined} />
        {i >= 0 && (
          <nav className="wv-nav" aria-label="More videos">
            {prev ? <Link href={`/watch/${prev.id}`}>← {prev.title}</Link> : <span />}
            {next ? <Link href={`/watch/${next.id}`}>{next.title} →</Link> : <span />}
          </nav>
        )}
        <p className="wv-back"><Link className="wv-open" href="/watch">All Yakini videos</Link></p>
      </div>
      <FinalCta />
    </SiteShell>
  )
}
