'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Check, Eye, EyeOff } from 'lucide-react'
import ThemeSwitch from '@/components/landing/ThemeSwitch'

function PasswordInput({
  id,
  label,
  value,
  onChange,
  autoComplete,
}: {
  id: string
  label: string
  value: string
  onChange: (v: string) => void
  autoComplete?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="bl-field">
      <label htmlFor={id}>{label}</label>
      <div className="bl-affix--end relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="bl-input"
        />
        <button
          type="button"
          onClick={() => setShow(prev => !prev)}
          aria-label={show ? 'Hide password' : 'Show password'}
          className="bl-icon-btn absolute top-1/2 right-1.5 size-8 -translate-y-1/2"
        >
          {show ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
        </button>
      </div>
    </div>
  )
}

export default function SettingsClient() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const user = useSession().data?.user

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('All fields are required')
      return
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      setError('New password must include letters and numbers')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong')
      } else {
        setSuccess(true)
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="bl-rise grid items-start gap-3 lg:grid-cols-[minmax(0,1fr)_320px]"
      style={{ '--i': 1 } as React.CSSProperties}
    >
      {/* Password */}
      <section className="bl-card bl-card--pad">
        <h2 className="bl-card-title">Change password</h2>
        <p className="mt-1 text-sm text-ink-muted">
          At least 8 characters, with letters and numbers.
        </p>

        {success ? (
          <div className="mt-6 flex max-w-md flex-col items-start gap-4">
            <div className="bl-alert bl-alert--pos w-full" role="status">
              <Check aria-hidden="true" />
              <p>
                <span className="font-medium">Password updated.</span> A confirmation email has been
                sent to your inbox.
              </p>
            </div>
            <button type="button" onClick={() => setSuccess(false)} className="bl-btn bl-btn--sm bl-btn--ghost">
              Change again
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 flex max-w-md flex-col gap-4">
            <PasswordInput
              id="currentPassword"
              label="Current password"
              value={currentPassword}
              onChange={setCurrentPassword}
              autoComplete="current-password"
            />
            <PasswordInput
              id="newPassword"
              label="New password"
              value={newPassword}
              onChange={setNewPassword}
              autoComplete="new-password"
            />
            <PasswordInput
              id="confirmPassword"
              label="Confirm new password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              autoComplete="new-password"
            />

            {error && (
              <p className="bl-alert bl-alert--neg" role="alert">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="bl-btn bl-btn--sm bl-btn--primary mt-1 self-start">
              {loading ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
      </section>

      <div className="flex flex-col gap-3">
        {/* Account */}
        {user && (
          <section className="bl-card bl-card--pad">
            <h2 className="bl-card-title">Account</h2>
            <dl className="bl-rule-list mt-2">
              {user.name && (
                <div className="flex items-center justify-between gap-4 py-3">
                  <dt className="text-[0.9375rem] text-ink-muted">Name</dt>
                  <dd className="truncate text-[0.9375rem] font-medium">{user.name}</dd>
                </div>
              )}
              {user.email && (
                <div className="flex items-center justify-between gap-4 pt-3">
                  <dt className="text-[0.9375rem] text-ink-muted">Email</dt>
                  <dd className="truncate text-[0.9375rem] font-medium">{user.email}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        {/* Appearance */}
        <section className="bl-card bl-card--pad">
          <h2 className="bl-card-title">Appearance</h2>
          <div className="mt-4 flex items-center justify-between gap-4">
            <span className="text-[0.9375rem] text-ink-muted">Theme</span>
            <ThemeSwitch />
          </div>
        </section>
      </div>
    </div>
  )
}
