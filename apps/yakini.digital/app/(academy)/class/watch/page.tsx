import { WatchView, watchMetadata } from '@/components/academy/WatchView'

export const metadata = watchMetadata('en')
export const dynamic = 'force-dynamic'

export default async function Page({ searchParams }: { searchParams: Promise<{ t?: string | string[] }> }) {
  const t = (await searchParams).t
  return <WatchView lang="en" token={typeof t === 'string' ? t : null} />
}
