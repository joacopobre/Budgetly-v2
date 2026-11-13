'use client'

import type { RefObject } from 'react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/lib/gsap'
import { duration, ease, stagger } from '@/lib/motion'
import { setNavTone } from './navTone'

/**
 * Reveal every `[data-reveal]` element inside `scope` as it scrolls into view.
 * Elements entering together are staggered. Without motion they simply stay
 * visible, which is also their server-rendered state.
 */
export function useReveal(scope: RefObject<HTMLElement | null>) {
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const items = gsap.utils.toArray<HTMLElement>('[data-reveal]', scope.current)
        if (!items.length) return
        gsap.set(items, { opacity: 0, y: 26 })
        ScrollTrigger.batch(items, {
          start: 'top 90%',
          once: true,
          onEnter: batch =>
            gsap.to(batch, {
              opacity: 1,
              y: 0,
              duration: duration.hero,
              ease: ease.out,
              stagger: stagger.items,
              overwrite: true,
            }),
        })
      })
    },
    { scope },
  )
}

/** Tell the navigation bar it is over a dark surface while `ref` is under it. */
export function useDarkSection(ref: RefObject<HTMLElement | null>) {
  useGSAP(() => {
    if (!ref.current) return
    ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 32px',
      end: 'bottom 32px',
      onToggle: self => setNavTone(self.isActive ? 'dark' : 'light'),
    })
  })
}
