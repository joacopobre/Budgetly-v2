'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { signIn, signOut } from 'next-auth/react'
import AuthShell, { AuthDivider, AuthError, GoogleButton } from '@/components/auth/AuthShell'

export default function SignupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
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

    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, confirmPassword }),
    })

    const data = (await response.json()) as { error?: string }
    if (!response.ok) {
      setIsSubmitting(false)
      setError(data.error ?? 'Unable to sign up')
      return
    }

    const signInResult = await signIn('credentials', {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
      callbackUrl: '/dashboard',
    })

    setIsSubmitting(false)

    if (!signInResult || signInResult.error) {
      setError(signInResult?.error ?? 'Sign in failed after signup')
      return
    }

    router.push(signInResult.url ?? '/dashboard')
  }

  return (
    <AuthShell
      eyebrow="Sign up"
      title="Create your account."
      lead="Start tracking your spending in minutes."
      aside={
        <>
          Have an account?{' '}
          <Link href="/login" className="bl-link">
            Log in
          </Link>
        </>
      }
    >
      <GoogleButton onClick={onGoogleSignIn} />

      <AuthDivider>or with email</AuthDivider>

      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="bl-field" htmlFor="name">
          <span>
            Name <span className="bl-field__hint">(optional)</span>
          </span>
          <input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Your name"
            className="bl-input"
          />
        </label>

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

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="bl-field" htmlFor="password">
            Password
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
              required
              className="bl-input"
            />
          </label>

          <label className="bl-field" htmlFor="confirmPassword">
            Confirm password
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Repeat it"
              required
              className="bl-input"
            />
          </label>
        </div>

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={isSubmitting} className="bl-btn bl-btn--primary mt-2 w-full">
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthShell>
  )
}
