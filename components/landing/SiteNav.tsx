'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight, Menu, X } from 'lucide-react'
import { useNavTone } from '@/lib/landing/navTone'
import { cn } from '@/lib/utils'

const links = [
  { href: '#features', label: 'Features' },
  { href: '#net-worth', label: 'Net worth' },
  { href: '#details', label: 'Details' },
  { href: '#about', label: 'About' },
]

export default function SiteNav() {
  const tone = useNavTone()
  const { data: session } = useSession()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // The sheet is a small-screen pattern: close it if the window grows.
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = () => mq.matches && setOpen(false)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <header
      className={cn('site-nav', tone === 'dark' && !open && 'dark')}
      data-scrolled={scrolled}
      data-open={open}
    >
      <div className="bl-container site-nav__bar">
        <Link href="/" className="site-nav__logo" aria-label="Budgetly home">
          <i aria-hidden="true" />
          Budgetly
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(link => (
            <a key={link.href} href={link.href} className="site-nav__link">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {session?.user ? (
            <Link href="/dashboard" className="bl-btn bl-btn--sm bl-btn--primary">
              Dashboard
              <ArrowRight className="bl-arrow" aria-hidden="true" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="bl-btn bl-btn--sm bl-btn--quiet hidden sm:inline-flex">
                Log in
              </Link>
              <Link href="/signup" className="bl-btn bl-btn--sm bl-btn--primary">
                Sign up
              </Link>
            </>
          )}
          <button
            type="button"
            className="bl-btn bl-btn--sm bl-btn--quiet md:hidden"
            style={{ paddingInline: 9 }}
            onClick={() => setOpen(v => !v)}
            aria-expanded={open}
            aria-controls="site-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
          </button>
        </div>
      </div>

      {open && (
        <div id="site-menu" className="site-nav__sheet md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <nav aria-label="Menu">
            {links.map(link => (
              <a key={link.href} href={link.href} className="site-nav__big" onClick={() => setOpen(false)}>
                {link.label}
              </a>
            ))}
          </nav>
          <div className="mt-auto grid gap-3 pt-10">
            {session?.user ? (
              <Link href="/dashboard" className="bl-btn bl-btn--primary" onClick={() => setOpen(false)}>
                Open dashboard
              </Link>
            ) : (
              <>
                <Link href="/signup" className="bl-btn bl-btn--primary" onClick={() => setOpen(false)}>
                  Create account
                </Link>
                <Link href="/login" className="bl-btn bl-btn--ghost" onClick={() => setOpen(false)}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
