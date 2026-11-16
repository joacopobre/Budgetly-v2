'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AuthShell, { AuthError } from '@/components/auth/AuthShell'

export default function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const isInvalidToken = !token

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password, confirmPassword }),
    })

    setIsSubmitting(false)

    if (!res.ok) {
      const data = (await res.json()) as { error?: string }
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    router.push('/login?success=password-reset')
  }

  const backToSignIn = (
    <Link href="/login" className="bl-link">
      Back to sign in
    </Link>
  )

  if (isInvalidToken) {
    return (
      <AuthShell
        eyebrow="Reset password"
        title="This link isn't valid."
        lead="The password reset link is missing or invalid. Please request a new one."
        aside={backToSignIn}
      >
        <Link href="/forgot-password" className="bl-btn bl-btn--primary w-full">
          Request new link
        </Link>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      eyebrow="Reset password"
      title="Choose a new password."
      lead="It replaces the current password on your account."
      aside={backToSignIn}
    >
      <form className="flex flex-col gap-4" onSubmit={onSubmit}>
        <label className="bl-field" htmlFor="password">
          New password
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            className="bl-input"
          />
        </label>

        <label className="bl-field" htmlFor="confirmPassword">
          Confirm new password
          <input
            id="confirmPassword"
            type="password"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            placeholder="Repeat your password"
            required
            className="bl-input"
          />
        </label>

        {error && <AuthError>{error}</AuthError>}

        <button type="submit" disabled={isSubmitting} className="bl-btn bl-btn--primary mt-2 w-full">
          {isSubmitting ? 'Resetting…' : 'Reset password'}
        </button>
      </form>
    </AuthShell>
  )
}
