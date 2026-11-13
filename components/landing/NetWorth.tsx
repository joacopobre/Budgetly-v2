'use client'

import { useRef } from 'react'
import { gsap, useGSAP, MOTION_OK } from '@/lib/gsap'
import { formatCurrency } from '@/lib/currency'
import { useDarkSection, useReveal } from '@/lib/landing/hooks'

/**
 * Net worth: the line draws itself as you scroll, and the figure follows it.
 * Example data, drawn to scale.
 */

const points = [
  { label: 'Aug', value: 11200 },
  { label: 'Sep', value: 11800 },
  { label: 'Oct', value: 12400 },
  { label: 'Nov', value: 13100 },
  { label: 'Dec', value: 13800 },
  { label: 'Jan', value: 15200 },
  { label: 'Feb', value: 16400 },
  { label: 'Mar', value: 17556 },
]

const W = 1200
const H = 420
const PAD = { top: 24, right: 8, bottom: 44, left: 8 }
const Y_MIN = 10000
const Y_MAX = 18000
const ticks = [12000, 14000, 16000, 18000]

const x = (i: number) => PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right)
const y = (v: number) => PAD.top + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * (H - PAD.top - PAD.bottom)

/** Smooth path through the points (monotone-ish cubic, no overshoot). */
function linePath() {
  const p = points.map((pt, i) => [x(i), y(pt.value)] as const)
  let d = `M ${p[0][0]} ${p[0][1]}`
  for (let i = 0; i < p.length - 1; i++) {
    const [x0, y0] = p[i]
    const [x1, y1] = p[i + 1]
    const mid = (x0 + x1) / 2
    d += ` C ${mid} ${y0}, ${mid} ${y1}, ${x1} ${y1}`
  }
  return d
}

const LINE = linePath()
const AREA = `${LINE} L ${x(points.length - 1)} ${H - PAD.bottom} L ${x(0)} ${H - PAD.bottom} Z`
const first = points[0].value
const last = points[points.length - 1].value

/** Net worth at a fraction 0…1 of the way along the months. */
function valueAt(t: number) {
  const f = Math.min(1, Math.max(0, t)) * (points.length - 1)
  const i = Math.min(points.length - 2, Math.floor(f))
  return points[i].value + (points[i + 1].value - points[i].value) * (f - i)
}

export default function NetWorth() {
  const section = useRef<HTMLElement>(null)
  const figure = useRef<HTMLSpanElement>(null)
  const line = useRef<SVGPathElement>(null)
  const dot = useRef<SVGGElement>(null)
  const clip = useRef<SVGRectElement>(null)

  useReveal(section)
  useDarkSection(section)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        const path = line.current
        if (!path) return
        const length = path.getTotalLength()
        const state = { t: 0 }
        const render = () => {
          const at = path.getPointAtLength(length * state.t)
          const t = (at.x - PAD.left) / (W - PAD.left - PAD.right)
          path.style.strokeDashoffset = String(1 - state.t)
          clip.current?.setAttribute('width', String(at.x))
          dot.current?.setAttribute('transform', `translate(${at.x} ${at.y})`)
          if (figure.current) figure.current.textContent = formatCurrency(valueAt(t), { decimals: 'never' })
        }
        render()
        gsap.to(state, {
          t: 1,
          ease: 'none',
          onUpdate: render,
          scrollTrigger: { trigger: '.networth__chart', start: 'top 78%', end: 'bottom 62%', scrub: 0.6 },
        })
        // Axis labels drift a little slower than the page.
        gsap.fromTo(
          '.networth__axis',
          { y: 14 },
          { y: 0, ease: 'none', scrollTrigger: { trigger: '.networth__chart', start: 'top bottom', end: 'bottom 40%', scrub: true } },
        )
      })
    },
    { scope: section },
  )

  return (
    <section
      ref={section}
      id="net-worth"
      className="dark bl-section bl-rules bg-canvas text-ink"
      aria-labelledby="net-worth-title"
    >
      <div className="bl-container">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
          <div>
            <p className="bl-eyebrow" data-reveal>
              Net worth
            </p>
            <h2 id="net-worth-title" className="bl-display-lg mt-5 max-w-[12ch]" data-reveal>
              Watch the line that matters.
            </h2>
          </div>
          <div data-reveal>
            <p className="bl-lead max-w-md">
              Every transaction moves it. Budgetly keeps the history, so you can see where you stand
              this month and how far you have come.
            </p>
            <div className="mt-8 flex flex-wrap items-end gap-x-5 gap-y-2">
              <span ref={figure} className="bl-display-lg bl-figures">
                {formatCurrency(last, { decimals: 'never' })}
              </span>
              <span className="bl-mono pb-2 text-sm text-brand-ink">
                {formatCurrency(last - first, { decimals: 'never', signed: true })} ·{' '}
                {Math.round(((last - first) / first) * 100)}% since August
              </span>
            </div>
          </div>
        </div>

        <figure className="mt-14" data-reveal>
          <svg
            className="networth__chart"
            viewBox={`0 0 ${W} ${H}`}
            role="img"
            aria-label={`Example net worth rising from ${formatCurrency(first, { decimals: 'never' })} in August to ${formatCurrency(last, { decimals: 'never' })} in March.`}
          >
            <defs>
              <linearGradient id="networth-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--bl-accent)" stopOpacity="0.28" />
                <stop offset="100%" stopColor="var(--bl-accent)" stopOpacity="0" />
              </linearGradient>
              <clipPath id="networth-clip">
                <rect ref={clip} x="0" y="0" width={W} height={H} />
              </clipPath>
            </defs>

            <g className="networth__axis">
              {ticks.map(tick => (
                <g key={tick}>
                  <line x1={PAD.left} x2={W - PAD.right} y1={y(tick)} y2={y(tick)} stroke="var(--bl-border)" strokeWidth="1" strokeDasharray="2 6" />
                  <text x={PAD.left} y={y(tick) - 8}>
                    {formatCurrency(tick, { compact: true })}
                  </text>
                </g>
              ))}
              {points.map((pt, i) => (
                <text key={pt.label} x={x(i)} y={H - 12} textAnchor={i === 0 ? 'start' : i === points.length - 1 ? 'end' : 'middle'}>
                  {pt.label.toUpperCase()}
                </text>
              ))}
            </g>

            <path d={AREA} fill="url(#networth-fill)" clipPath="url(#networth-clip)" />
            <path
              ref={line}
              d={LINE}
              fill="none"
              stroke="var(--bl-accent)"
              strokeWidth="2.5"
              strokeLinecap="round"
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset="0"
              vectorEffect="non-scaling-stroke"
            />
            <g ref={dot} transform={`translate(${x(points.length - 1)} ${y(last)})`}>
              <circle r="11" fill="var(--bl-accent)" opacity="0.18" />
              <circle r="5" fill="var(--bl-accent)" stroke="var(--bl-bg)" strokeWidth="2" />
            </g>
          </svg>
          <figcaption className="bl-eyebrow mt-4">Example data</figcaption>
        </figure>
      </div>
    </section>
  )
}
