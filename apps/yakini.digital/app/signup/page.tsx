import { redirect } from 'next/navigation'
import { getStartedHref } from '@/lib/portal'

// Self-serve sign-up lives in the client portal.
export default async function Page({ searchParams }: { searchParams: Promise<{ kit?: string }> }) {
  const { kit } = await searchParams
  redirect(getStartedHref(typeof kit === 'string' && /^[a-z][a-z0-9-]{1,31}$/.test(kit) ? kit : undefined))
}
