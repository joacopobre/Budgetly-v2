'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/lib/gsap'
import { useDarkSection, useReveal } from '@/lib/landing/hooks'
import type { RGB } from '@/lib/landing/color'
import GuillocheCanvas, { type GuillocheColors } from './GuillocheCanvas'
import ThemeSwitch from './ThemeSwitch'

/**
 * Closing call to action and footer. The hero's line-work returns as a
 * bookend: flat rules that wake up as you arrive.
 */

const colors: GuillocheColors = {
  bgFrom: [6, 18, 14] as RGB,
  bgTo: [6, 18, 14] as RGB,
  lineFrom: [126, 232, 183] as RGB,
  lineTo: [27, 58, 44] as RGB,
  glow: [16, 185, 129] as RGB,
}

export default function Closing() {
  const section = useRef<HTMLElement>(null)
  const calm = useRef(0)
  const { data: session } = useSession()

  useReveal(section)
  useDarkSection(section)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        calm.current = 1
        ScrollTrigger.create({
          trigger: section.current,
          start: 'top 85%',
          end: 'top 15%',
          onUpdate: self => (calm.current = 1 - self.progress),
          onRefresh: self => (calm.current = 1 - self.progress),
        })
        return () => {
          calm.current = 0
        }
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} className="dark relative overflow-hidden bg-forest-950 text-ink" aria-labelledby="closing-title">
      <div className="absolute inset-0" aria-hidden="true">
        <GuillocheCanvas calm={calm} colors={colors} className="block size-full" />
      </div>

      <div className="relative">
        <div className="bl-container py-[clamp(112px,17vw,224px)]">
          <h2 id="closing-title" className="bl-display-xl max-w-[11ch]" data-reveal>
            Start with this month.
          </h2>
          <p className="bl-lead mt-7 max-w-md" data-reveal>
            Add your first transaction or import a statement, and see where you stand.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" data-reveal>
            {session?.user ? (
              <Link href="/dashboard" className="bl-btn bl-btn--accent">
                Open dashboard
                <ArrowRight className="bl-arrow" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link href="/signup" className="bl-btn bl-btn--accent">
                  Create account
                  <ArrowRight className="bl-arrow" aria-hidden="true" />
                </Link>
                <Link href="/login" className="bl-btn bl-btn--ghost">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>

        <footer className="border-t border-line/70 bg-forest-950/70 backdrop-blur-sm">
          <div className="bl-container grid gap-10 py-14 md:grid-cols-[1.2fr_1fr_1fr]">
            <div id="about">
              <p className="site-nav__logo">
                <i aria-hidden="true" />
                Budgetly
              </p>
              <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-muted">
                Budgetly is built to make personal finance easier to understand, so you can spend
                with intention and grow financial confidence over time.
              </p>
            </div>
            <div id="contact">
              <p className="bl-eyebrow">Contact</p>
              <p className="mt-4 text-sm leading-relaxed text-ink-muted">
                Questions about Budgetly? Write to
                <br />
                <span className="text-ink select-all">support@budgetly.app</span>
              </p>
            </div>
            <div>
              <p className="bl-eyebrow">Theme</p>
              <ThemeSwitch className="mt-4" />
            </div>
          </div>
          <div className="bl-container flex flex-wrap items-center justify-between gap-4 border-t border-line/70 py-6">
            <p className="bl-eyebrow">© {new Date().getFullYear()} Budgetly</p>
            <nav className="flex gap-5 text-sm text-ink-muted" aria-label="Footer">
              <Link href="/login" className="hover:text-ink">
                Log in
              </Link>
              <Link href="/signup" className="hover:text-ink">
                Sign up
              </Link>
            </nav>
          </div>
        </footer>
      </div>
    </section>
  )
}
