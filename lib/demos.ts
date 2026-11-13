import manifest from './demos.manifest.json'

/**
 * The product demos embedded on the landing page.
 *
 * Sources live in demos/ (one HyperFrames project, one scene per demo) and are
 * copied to public/demos/ by `npm run demos:sync`, which also regenerates the
 * manifest imported here. Posters come from `npm run demos:posters`.
 */

export type DemoId = 'dashboard' | 'capture' | 'import' | 'fund' | 'limit'

export const DEMO_WIDTH = manifest.width
export const DEMO_HEIGHT = manifest.height
export const DEMO_SRC = '/demos/index.html'
export const DEMO_RUNTIME_SRC = '/demos/vendor/hyperframe.runtime.iife.js'

type Slot = { start: number; end: number }
const scenes = manifest.scenes as Partial<Record<DemoId, Slot>>

/** Where a demo sits on the shared timeline, in seconds. */
export function demoSlot(id: DemoId): Slot {
  return scenes[id] ?? { start: 0, end: 0 }
}

export function demoPoster(id: DemoId, theme: 'light' | 'dark'): string {
  return `/demos/posters/${id}-${theme}.webp`
}
