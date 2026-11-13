'use client'

import { useSyncExternalStore } from 'react'

/**
 * Whether the navigation bar currently sits over a dark or a light surface.
 * Sections report it as they scroll under the bar; the bar restyles itself.
 */
export type NavTone = 'dark' | 'light'

let tone: NavTone = 'dark'
const listeners = new Set<() => void>()

export function setNavTone(next: NavTone) {
  if (next === tone) return
  tone = next
  listeners.forEach(fn => fn())
}

export function useNavTone(): NavTone {
  return useSyncExternalStore(
    fn => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => tone,
    () => 'dark',
  )
}
