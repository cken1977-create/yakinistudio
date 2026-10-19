import { redirect } from 'next/navigation'
import { LOGIN_HREF } from '@/lib/portal'

// Returning clients log in on the portal with a one-time email link.
export default function Page() {
  redirect(LOGIN_HREF)
}
