import { LoginForm } from './LoginForm'

export const dynamic = 'force-dynamic'

export default function LoginPage() {
  return (
    <main style={{ maxWidth: 420 }}>
      <h1>Momma Sally&apos;s Office</h1>
      <p className="muted">Sign in with the email Nicole added you with. We&apos;ll email you a sign-in link.</p>
      <LoginForm />
    </main>
  )
}
