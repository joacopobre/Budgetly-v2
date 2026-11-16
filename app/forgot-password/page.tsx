'use client'

import Link from 'next/link'
import { useState } from 'react'
import AuthShell, { AuthError } from '@/components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [googleAccount, setGoogleAccount] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setIsSubmitting(false)

    const data = (await res.json()) as { error?: string; googleAccount?: boolean }

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    if (data.googleAccount) {
      setGoogleAccount(true)
      return
    }

    setSubmitted(true)
  }

  const backToSignIn = (
    <Link href="/login" className="bl-link">
      Back to sign in
    </Link>
  )

  if (googleAccount) {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="This account uses Google."
        lead="There is no password to reset. Sign in with Google instead."
        aside={backToSignIn}
      >
        <Link href="/login" className="bl-btn bl-btn--primary w-full">
          Go to sign in
        </Link>
      </AuthShell>
    )
  }

  if (submitted) {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="Check your email."
        lead={
          <>
            If an account exists for <strong className="font-medium text-ink">{email}</strong>,
            you&apos;ll receive a password reset link within a few minutes.
          </>
        }
        aside={backToSignIn}
      >
        <p className="border-t border-line pt-5 text-sm leading-relaxed text-ink-muted">
          The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
        </p>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Forgot your password?"
      lead="Enter your email and we'll send you a reset link."
      aside={backToSignIn}
    >
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

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={isSubmitting} className="bl-btn bl-btn--primary mt-2 w-full">
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </button>
      </form>
    </AuthShell>
  )
}
