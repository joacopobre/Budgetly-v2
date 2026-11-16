'use client'

import Link from 'next/link'
import { useState, Suspense } from 'react'
import { signIn, signOut } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check } from 'lucide-react'
import AuthShell, { AuthDivider, AuthError, GoogleButton } from '@/components/auth/AuthShell'

function SuccessBanner() {
  const searchParams = useSearchParams()
  if (searchParams.get('success') !== 'password-reset') return null
  return (
    <div className="bl-alert bl-alert--pos mb-6" role="status">
      <Check aria-hidden="true" />
      <p>Password reset successfully. You can now sign in with your new password.</p>
    </div>
  )
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function onGoogleSignIn() {
    await signOut({ redirect: false })
    await signIn('google', { callbackUrl: '/dashboard' }, { prompt: 'select_account' })
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const result = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    })

    setIsSubmitting(false)

    if (!result || result.error) {
      setError(result?.error ?? 'Invalid email or password')
      return
    }

    router.push(result.url ?? '/dashboard')
  }

  return (
    <AuthShell
      eyebrow="Log in"
      title="Welcome back."
      lead="Sign in to manage your budgets and spending."
      aside={
        <>
          New here?{' '}
          <Link href="/signup" className="bl-link">
            Create account
          </Link>
        </>
      }
    >
      <Suspense>
        <SuccessBanner />
      </Suspense>

      <GoogleButton onClick={onGoogleSignIn} />

      <AuthDivider>or with email</AuthDivider>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="bl-field" htmlFor="email">
          Email
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="bl-input"
          />
        </label>

        <div className="bl-field">
          <div className="flex items-center justify-between">
            <label htmlFor="password">Password</label>
            <Link href="/forgot-password" className="bl-link">
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            className="bl-input"
          />
        </div>

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={isSubmitting} className="bl-btn bl-btn--primary mt-2 w-full">
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthShell>
  )
}
