'use client'

import { useRef } from 'react'
import GuillocheCanvas, { type GuillocheColors } from '@/components/landing/GuillocheCanvas'
import type { RGB } from '@/lib/landing/color'

/** The landing page's banknote line-work, as the auth pages' side panel. */

const colors: GuillocheColors = {
  bgFrom: [6, 18, 14] as RGB,
  bgTo: [6, 18, 14] as RGB,
  lineFrom: [126, 232, 183] as RGB,
  lineTo: [27, 58, 44] as RGB,
  glow: [16, 185, 129] as RGB,
}

export default function AuthArt() {
  const calm = useRef(0)

  return (
    <aside className="dark relative m-3 hidden overflow-hidden rounded-bl-xl bg-forest-950 text-ink lg:block">
      <div className="absolute inset-0" aria-hidden="true">
        <GuillocheCanvas calm={calm} colors={colors} className="block size-full" />
      </div>
      <div className="relative flex h-full flex-col p-[clamp(32px,4vw,56px)]">
        <p className="bl-eyebrow">Personal budgeting, kept in order</p>
        <p className="mt-5 max-w-[9ch] text-[clamp(2.75rem,4.6vw,4.5rem)] leading-[0.98] font-medium tracking-[-0.045em] text-balance">
          Every pound, accounted for.
        </p>
        <p className="bl-eyebrow mt-auto">Free · No bank login · Import a CSV</p>
      </div>
    </aside>
  )
}
