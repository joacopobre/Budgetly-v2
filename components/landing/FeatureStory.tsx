'use client'

import { useRef, useState } from 'react'
import { gsap, ScrollTrigger, useGSAP, DESKTOP } from '@/lib/gsap'
import { useReveal } from '@/lib/landing/hooks'
import type { DemoId } from '@/lib/demos'
import DemoPlayer from './DemoPlayer'

/**
 * Four chapters, each with a looping demo of the real feature.
 *
 * Desktop: the demo stage sticks while the chapters scroll past; one player
 * moves between scenes as the chapter in focus changes. Scrolling is never
 * taken over. Small screens: chapters stack, each with its own demo.
 */

type Chapter = {
  demo: DemoId
  area: string
  title: string
  body: string
  points: string[]
  label: string
}

const chapters: Chapter[] = [
  {
    demo: 'capture',
    area: 'Transactions',
    title: 'Write it down in seconds.',
    body: 'Add income, expenses and transfers as they happen. Pick a category, say which budget it comes out of, and you are done.',
    points: ['Create categories as you type', 'Mark anything that repeats'],
    label:
      'Adding a transaction: the Add transaction form opens, Coffee and 3.40 are typed in, and the new row appears at the top of the table.',
  },
  {
    demo: 'import',
    area: 'Import',
    title: 'Or bring in a whole month.',
    body: 'Export a CSV from your bank and drop it in. Match its columns to date, description and amount, then check every row before anything is saved.',
    points: ['Works with any bank that exports CSV', 'Only valid rows are imported'],
    label:
      'Importing a bank statement: a CSV file is dropped in, its columns are matched, the rows are reviewed and the transactions table fills.',
  },
  {
    demo: 'fund',
    area: 'Budgets',
    title: 'Set money aside on purpose.',
    body: 'Spend budgets for money going out, save budgets for goals. Move money in or out and watch each one fill.',
    points: ['A full history of every adjustment', 'Roll unspent money over, or start fresh'],
    label:
      'Funding a savings budget: 250 pounds is added to the Holiday Fund, its progress bar fills from 33 to 45 percent and the adjustment is logged.',
  },
  {
    demo: 'limit',
    area: 'Spending limits',
    title: 'Know before you overspend.',
    body: 'Put a monthly cap on any category. Budgetly tells you when you are getting close, and the cap resets itself each month.',
    points: ['A warning at 80% of the limit', 'Resets automatically on the 1st'],
    label:
      'Setting a spending limit: an 80 pound monthly limit is set for Dining out, a new expense pushes it past 80 percent and an alert appears.',
  },
]

export default function FeatureStory() {
  const section = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)

  useReveal(section)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(DESKTOP, () => {
        gsap.utils.toArray<HTMLElement>('.story__chapter', section.current).forEach((el, i) => {
          ScrollTrigger.create({
            trigger: el,
            start: 'top 55%',
            end: 'bottom 55%',
            onToggle: self => self.isActive && setActive(i),
          })
        })
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} id="features" className="bl-section bg-canvas text-ink" aria-labelledby="features-title">
      <div className="bl-container">
        <div className="max-w-3xl">
          <p className="bl-eyebrow" data-reveal>
            How it works
          </p>
          <h2 id="features-title" className="bl-display-lg mt-5" data-reveal>
            Built around what you do each month.
          </h2>
        </div>

        <div className="story__grid mt-14 lg:mt-0">
          <div>
            {chapters.map((chapter, i) => (
              <article key={chapter.demo} className="story__chapter" data-active={i === active}>
                <p className="bl-eyebrow text-brand-ink">{chapter.area}</p>
                <h3 className="bl-display-md mt-4">{chapter.title}</h3>
                <p className="bl-lead mt-5 max-w-md">{chapter.body}</p>
                <ul className="mt-6 grid gap-2.5 text-[0.9375rem] text-ink">
                  {chapter.points.map(point => (
                    <li key={point} className="flex items-baseline gap-3">
                      <span className="size-1.5 shrink-0 -translate-y-0.5 rounded-[2px] bg-brand" aria-hidden="true" />
                      {point}
                    </li>
                  ))}
                </ul>

                {/* Small screens: the demo sits with its chapter. */}
                <div className="bl-window mt-9 lg:hidden">
                  <DemoPlayer demo={chapter.demo} label={chapter.label} crop="center" />
                </div>
              </article>
            ))}
          </div>

          {/* Desktop: one stage, one player, scene follows the chapter. */}
          <div className="story__stage hidden lg:flex" aria-hidden={false}>
            <div className="w-full">
              <div className="bl-window">
                <DemoPlayer demo={chapters[active].demo} label={chapters[active].label} crop="center" />
              </div>
              <div className="story__rail" aria-hidden="true">
                {chapters.map((chapter, i) => (
                  <i key={chapter.demo}>
                    <b style={{ transform: `scaleX(${i <= active ? 1 : 0})`, transition: 'transform 600ms var(--bl-ease-out)' }} />
                  </i>
                ))}
              </div>
              <p className="bl-eyebrow mt-3 flex justify-between" aria-hidden="true">
                <span>{chapters[active].area}</span>
                <span className="bl-figures">
                  {String(active + 1).padStart(2, '0')} / {String(chapters.length).padStart(2, '0')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
