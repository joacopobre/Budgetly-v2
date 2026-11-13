'use client'

import { useEffect, useRef, useState } from 'react'
import type { HyperframesPlayer } from '@hyperframes/player'
import { useTheme } from '@/context/ThemeContext'
import {
  DEMO_HEIGHT,
  DEMO_RUNTIME_SRC,
  DEMO_SRC,
  DEMO_WIDTH,
  demoPoster,
  demoSlot,
  type DemoId,
} from '@/lib/demos'
import { cn } from '@/lib/utils'

/**
 * A looping product demo, played live by the HyperFrames player.
 *
 * - Server-renders only a still frame (the poster), so there is nothing to
 *   hydrate and no layout shift.
 * - The player and its runtime load only when the demo nears the viewport.
 * - It plays only while visible, in the foreground tab, and `active`. Until it
 *   has played, the poster stays on top.
 * - With reduced motion the player never loads: the poster is the demo.
 * - Changing `demo` on a mounted player just moves it to another scene of the
 *   same composition, so a whole section can share one player.
 */

type Props = {
  demo: DemoId
  /** What the demo shows, for screen readers. */
  label: string
  /** Set false to hold the demo paused (e.g. another chapter is in focus). */
  active?: boolean
  /** 'full' shows the whole 16:10 screen; 'center' crops to the middle 6:5;
   *  'responsive' crops on small screens only, so the UI stays legible. */
  crop?: 'full' | 'center' | 'responsive'
  /** Load the poster eagerly (for demos near the top of the page). */
  eager?: boolean
  className?: string
}

const SWITCH_OUT_MS = 170

export default function DemoPlayer({ demo, label, active = true, crop = 'full', eager = false, className }: Props) {
  const { theme } = useTheme()
  const hostRef = useRef<HTMLDivElement>(null)
  const mountRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<HyperframesPlayer | null>(null)
  const shownDemo = useRef<DemoId>(demo)

  const [near, setNear] = useState(false)
  const [visible, setVisible] = useState(false)
  const [ready, setReady] = useState(false)
  const [started, setStarted] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [reduced, setReduced] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setReduced(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  // Near the viewport → worth loading. Actually on screen → worth playing.
  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const nearIO = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: '60% 0px' })
    const visibleIO = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.25 })
    nearIO.observe(host)
    visibleIO.observe(host)
    return () => {
      nearIO.disconnect()
      visibleIO.disconnect()
    }
  }, [])

  // Create the player when needed; remove it when the demo is far away again.
  useEffect(() => {
    if (!near || reduced) return
    const mount = mountRef.current
    if (!mount) return
    let cancelled = false
    let el: HyperframesPlayer | null = null
    const onReady = () => !cancelled && setReady(true)

    import('@hyperframes/player').then(() => {
      if (cancelled) return
      const slot = demoSlot(shownDemo.current)
      el = document.createElement('hyperframes-player') as HyperframesPlayer
      el.setAttribute('src', theme === 'dark' ? `${DEMO_SRC}?theme=dark` : DEMO_SRC)
      el.setAttribute('runtime-src', DEMO_RUNTIME_SRC)
      el.setAttribute('width', String(DEMO_WIDTH))
      el.setAttribute('height', String(DEMO_HEIGHT))
      el.setAttribute('range-start', String(slot.start))
      el.setAttribute('range-end', String(slot.end))
      el.setAttribute('assets-loading-ui', 'none')
      el.setAttribute('shader-loading', 'none')
      el.setAttribute('aria-hidden', 'true')
      el.toggleAttribute('muted', true)
      el.toggleAttribute('audio-locked', true)
      el.toggleAttribute('loop', true)
      el.toggleAttribute('disable-click-to-play', true)
      el.toggleAttribute('low-power-idle', true)
      el.toggleAttribute('no-load-timeout', true)
      el.tabIndex = -1
      el.addEventListener('ready', onReady)
      mount.appendChild(el)
      playerRef.current = el
    })

    return () => {
      cancelled = true
      setReady(false)
      setStarted(false)
      if (el) {
        el.removeEventListener('ready', onReady)
        el.pause()
        el.remove()
      }
      playerRef.current = null
    }
  }, [near, reduced, theme])

  // Play only when it can be seen.
  useEffect(() => {
    const el = playerRef.current
    if (!el || !ready) return
    const sync = () => {
      if (visible && active && !switching && !document.hidden) {
        el.play()
        setStarted(true)
      }
      else el.pause()
    }
    sync()
    document.addEventListener('visibilitychange', sync)
    return () => document.removeEventListener('visibilitychange', sync)
  }, [ready, visible, active, switching])

  // Another scene of the same composition: dip, move the playhead, return.
  useEffect(() => {
    if (shownDemo.current === demo) return
    const el = playerRef.current
    if (!el || !ready) {
      shownDemo.current = demo
      return
    }
    setSwitching(true)
    const timer = window.setTimeout(() => {
      const slot = demoSlot(demo)
      shownDemo.current = demo
      el.pause()
      // Widen before narrowing, so the range is never empty in between.
      if (slot.start >= (el.rangeEnd ?? Infinity)) {
        el.rangeEnd = slot.end
        el.rangeStart = slot.start
      } else {
        el.rangeStart = slot.start
        el.rangeEnd = slot.end
      }
      el.seek(slot.start)
      setSwitching(false)
    }, SWITCH_OUT_MS)
    return () => window.clearTimeout(timer)
  }, [demo, ready])

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={label}
      className={cn('demo-player', crop !== 'full' && `demo-player--${crop}`, className)}
      style={{ '--demo-ratio': `${DEMO_WIDTH} / ${DEMO_HEIGHT}` } as React.CSSProperties}
    >
      <div className="demo-player__frame">
        {(['light', 'dark'] as const).map(mode => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={mode}
            src={demoPoster(demo, mode)}
            alt=""
            width={DEMO_WIDTH}
            height={DEMO_HEIGHT}
            loading="lazy"
            fetchPriority={eager ? 'high' : 'auto'}
            decoding="async"
            className={cn('demo-player__poster', mode === 'light' ? 'dark:hidden' : 'hidden dark:block')}
          />
        ))}
        <div
          ref={mountRef}
          className="demo-player__live"
          data-live={ready && started && !switching ? 'true' : 'false'}
        />
      </div>
    </div>
  )
}
