'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowDown, ArrowRight } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/lib/gsap'
import { duration, ease, stagger } from '@/lib/motion'
import { useTheme } from '@/context/ThemeContext'
import { mixRgb, readToken, rgbCss, type RGB } from '@/lib/landing/color'
import { setNavTone } from '@/lib/landing/navTone'
import GuillocheCanvas, { type GuillocheColors } from './GuillocheCanvas'
import DemoPlayer from './DemoPlayer'

/**
 * The hero and the statement that follows share one background: the guilloché
 * line-work. Scrolling calms the lines until they lie flat, turns the dark
 * ground into the page colour, and leaves the statement sitting on ledger
 * rules. Nothing is pinned; the background simply stays in view while the
 * content scrolls over it.
 */

// The hero always opens on the dark forest, in either theme.
const NIGHT = {
  bg: [6, 18, 14] as RGB,
  fg: [243, 245, 240] as RGB,
  muted: [168, 184, 174] as RGB,
  border: [52, 80, 63] as RGB,
  line: [126, 232, 183] as RGB,
  glow: [16, 185, 129] as RGB,
}
const PAPER: RGB = [243, 245, 240]
const RULE: RGB = [217, 222, 211]

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

const STATEMENT =
  'Most budgeting tools are too simple to trust or too heavy to keep up with. Budgetly sits in between. Transactions, budgets, limits and net worth, in one calm view.'

export default function HeroScope() {
  const scope = useRef<HTMLDivElement>(null)
  const hero = useRef<HTMLElement>(null)
  const calm = useRef(0)
  const tone = useRef(0)
  const day = useRef({ bg: PAPER, fg: [12, 26, 20] as RGB, muted: [85, 99, 91] as RGB, border: [195, 202, 188] as RGB })
  const { theme } = useTheme()
  const { data: session } = useSession()

  const [colors, setColors] = useState<GuillocheColors>({
    bgFrom: NIGHT.bg,
    lineFrom: NIGHT.line,
    bgTo: PAPER,
    lineTo: RULE,
    glow: NIGHT.glow,
  })

  /** Paint the scope for a scroll progress of 0…1. */
  const paint = useCallback((progress: number) => {
    const el = scope.current
    if (!el) return
    calm.current = progress
    // Colour changes over a shorter stretch than the lines take to settle, and
    // text flips quickly in the middle so it never sits grey on grey.
    const t = smooth(0.28, 0.7, progress)
    const flip = smooth(0.4, 0.6, t)
    tone.current = t
    const to = day.current
    el.style.setProperty('--hero-bg', rgbCss(mixRgb(NIGHT.bg, to.bg, t)))
    el.style.setProperty('--hero-fg', rgbCss(mixRgb(NIGHT.fg, to.fg, flip)))
    el.style.setProperty('--hero-muted', rgbCss(mixRgb(NIGHT.muted, to.muted, flip)))
    el.style.setProperty('--hero-border', rgbCss(mixRgb(NIGHT.border, to.border, flip)))
    setNavTone(t > 0.5 ? 'light' : 'dark')
  }, [])

  // Where the transition lands depends on the theme: paper, or the dark canvas.
  useEffect(() => {
    const el = scope.current
    if (!el) return
    day.current = {
      bg: readToken(el, '--bl-bg'),
      fg: readToken(el, '--bl-fg'),
      muted: readToken(el, '--bl-fg-muted'),
      border: readToken(el, '--bl-border-strong'),
    }
    setColors({
      bgFrom: NIGHT.bg,
      lineFrom: NIGHT.line,
      bgTo: day.current.bg,
      lineTo: readToken(el, '--bl-border'),
      glow: NIGHT.glow,
    })
    paint(calm.current)
  }, [theme, paint])

  useGSAP(
    () => {
      const mm = gsap.matchMedia()

      mm.add(MOTION_OK, () => {
        // Entrance: headline lines rise from behind a mask, the rest follows.
        gsap
          .timeline({
            delay: 0.1,
            onComplete: () => hero.current?.setAttribute('data-entered', 'true'),
          })
          .fromTo(
            '.hero-line > span',
            { yPercent: 112, opacity: 1 },
            { yPercent: 0, duration: 1.15, ease: ease.out, stagger: stagger.lines },
            0,
          )
          .fromTo(
            '[data-hero-fade]',
            { opacity: 0, y: 18 },
            { opacity: 1, y: 0, duration: duration.hero, ease: ease.out, stagger: 0.07 },
            0.3,
          )

        // Scroll: lines settle, dark turns to page colour.
        ScrollTrigger.create({
          trigger: scope.current,
          start: 'top top',
          end: () => `+=${Math.round(window.innerHeight * 0.75)}`,
          onUpdate: self => paint(self.progress),
          onRefresh: self => paint(self.progress),
        })

        // The product window lifts into place as it comes up the screen.
        gsap.fromTo(
          '.hero-window__inner',
          { y: 56, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: 'none',
            scrollTrigger: { trigger: '.hero-window', start: 'top bottom', end: 'top 32%', scrub: 0.5 },
          },
        )

        // The statement inks in word by word.
        gsap.fromTo(
          '.statement__text .sw',
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { trigger: '.statement__text', start: 'top 84%', end: 'bottom 48%', scrub: true },
          },
        )

        return () => paint(0)
      })

      // Without motion the scope stays dark: tell the nav when it leaves.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        ScrollTrigger.create({
          trigger: scope.current,
          start: 'top top',
          end: 'bottom 64px',
          onToggle: self => setNavTone(self.isActive ? 'dark' : 'light'),
          onRefresh: self => setNavTone(self.isActive || self.progress === 0 ? 'dark' : 'light'),
        })
      })
    },
    { scope },
  )

  const words = STATEMENT.split(' ')

  return (
    <div ref={scope} className="hero-scope">
      <div className="hero-scope__bg" aria-hidden="true">
        <div className="hero-scope__sticky">
          <GuillocheCanvas calm={calm} tone={tone} colors={colors} />
        </div>
      </div>

      <section ref={hero} className="hero" aria-labelledby="hero-title">
        <div className="bl-container">
          <p className="bl-eyebrow" data-hero-fade>
            Personal budgeting, kept in order
          </p>
          <h1 id="hero-title" className="bl-display-xl mt-5">
            <span className="hero-line">
              <span>Every pound,</span>
            </span>
            <span className="hero-line">
              <span>accounted for.</span>
            </span>
          </h1>
          <p className="bl-lead mt-7 max-w-[34rem]" data-hero-fade>
            Budgetly is one calm workspace for your transactions, budgets, spending limits and net
            worth.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3" data-hero-fade>
            {session?.user ? (
              <Link href="/dashboard" className="bl-btn bl-btn--accent">
                Open dashboard
                <ArrowRight className="bl-arrow" aria-hidden="true" />
              </Link>
            ) : (
              <Link href="/signup" className="bl-btn bl-btn--accent">
                Get started
                <ArrowRight className="bl-arrow" aria-hidden="true" />
              </Link>
            )}
            <a href="#features" className="bl-btn bl-btn--ghost">
              See how it works
              <ArrowDown className="bl-arrow-down" aria-hidden="true" />
            </a>
          </div>
          <p className="bl-eyebrow mt-6" data-hero-fade>
            Free · No bank login · Import a CSV
          </p>

          <div className="hero-window" id="demo" data-hero-fade>
            <div className="hero-window__inner bl-window">
              <DemoPlayer
                demo="dashboard"
                crop="responsive"
                eager
                label="The Budgetly dashboard: the date range switches from this month to this year and the income, spending and net worth charts redraw."
              />
            </div>
          </div>
        </div>
      </section>

      <section className="statement" aria-label="Why Budgetly">
        <div className="bl-container">
          <p className="bl-eyebrow">Why Budgetly</p>
          <p className="statement__text mt-6">
            {words.map((word, i) => (
              <span key={i}>
                <span className="sw">{word}</span>{' '}
              </span>
            ))}
          </p>
        </div>
      </section>
    </div>
  )
}
