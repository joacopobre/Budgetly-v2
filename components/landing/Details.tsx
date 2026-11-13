'use client'

import { useRef } from 'react'
import { Bell, Repeat, Search } from 'lucide-react'
import { gsap, ScrollTrigger, useGSAP, MOTION_OK } from '@/lib/gsap'
import { formatCurrency } from '@/lib/currency'
import { useReveal } from '@/lib/landing/hooks'
import ThemeSwitch from './ThemeSwitch'

/** Six smaller features, each with one quiet visual. */

function Detail({
  label,
  title,
  children,
  visual,
}: {
  label: string
  title: string
  children: React.ReactNode
  visual: React.ReactNode
}) {
  return (
    <article className="bl-card detail" data-reveal>
      <p className="bl-eyebrow">{label}</p>
      <h3 className="bl-title mt-3">{title}</h3>
      <p className="mt-2.5 text-[0.9375rem] leading-relaxed text-ink-muted">{children}</p>
      <div className="detail__visual">{visual}</div>
    </article>
  )
}

const row = 'flex items-center justify-between gap-3 border-t border-line py-2.5 first:border-t-0 first:pt-0 last:pb-0'
const pill = 'bl-mono rounded-bl-sm border border-line px-2 py-1 text-[0.6875rem] uppercase tracking-[0.08em] text-ink-muted'

export default function Details() {
  const section = useRef<HTMLElement>(null)
  useReveal(section)

  // Bars and switches settle into place once, as their card arrives.
  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>('[data-grow]', section.current).forEach(el => {
          gsap.fromTo(
            el,
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 1.1,
              ease: 'expo.out',
              delay: 0.25,
              scrollTrigger: { trigger: el, start: 'top 92%', once: true },
            },
          )
        })
        gsap.utils.toArray<HTMLElement>('[data-slide]', section.current).forEach(el => {
          gsap.fromTo(
            el,
            { x: 0 },
            { x: 18, duration: 0.5, ease: 'power3.out', delay: 0.5, scrollTrigger: { trigger: el, start: 'top 92%', once: true } },
          )
        })
        ScrollTrigger.refresh()
      })
    },
    { scope: section },
  )

  return (
    <section ref={section} id="details" className="bl-section bg-canvas text-ink" aria-labelledby="details-title">
      <div className="bl-container">
        <div className="max-w-3xl">
          <p className="bl-eyebrow" data-reveal>
            Details
          </p>
          <h2 id="details-title" className="bl-display-lg mt-5" data-reveal>
            The small things are done properly.
          </h2>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Detail
            label="Recurring"
            title="Set the rhythm once"
            visual={
              <div className="text-sm">
                {[
                  { name: 'Rent', every: 'Monthly', amount: -850 },
                  { name: 'Salary', every: 'Monthly', amount: 2400 },
                  { name: 'Gym', every: 'Weekly', amount: -9 },
                ].map(item => (
                  <div key={item.name} className={row}>
                    <span className="flex items-center gap-2.5 font-medium">
                      {item.name}
                      <span className={`${pill} inline-flex items-center gap-1`}>
                        <Repeat className="size-3" aria-hidden="true" />
                        {item.every}
                      </span>
                    </span>
                    <span className={`bl-figures font-medium ${item.amount > 0 ? 'text-positive' : ''}`}>
                      {formatCurrency(item.amount, { signed: true })}
                    </span>
                  </div>
                ))}
              </div>
            }
          >
            Rent, salary, subscriptions. Make a transaction daily, weekly, monthly or yearly and
            Budgetly adds it when it is due.
          </Detail>

          <Detail
            label="Rollover"
            title="Carry it over, or start clean"
            visual={
              <div className="grid gap-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Roll over unspent money</span>
                  <span className="flex h-6 w-[42px] items-center rounded-full bg-brand p-[3px]" aria-hidden="true">
                    <span data-slide className="size-[18px] rounded-full bg-white shadow-bl-sm" style={{ transform: 'translateX(18px)' }} />
                  </span>
                </div>
                <div>
                  <div className="flex justify-between text-ink-muted">
                    <span>Groceries, April</span>
                    <span className="bl-figures">{formatCurrency(400, { decimals: 'never' })} + {formatCurrency(35, { decimals: 'never' })}</span>
                  </div>
                  <div className="mt-2 flex h-1.5 gap-0.5 overflow-hidden rounded-full">
                    <span data-grow className="h-full origin-left rounded-full bg-ink-faint" style={{ width: '92%' }} />
                    <span data-grow className="h-full origin-left rounded-full bg-brand" style={{ width: '8%' }} />
                  </div>
                </div>
              </div>
            }
          >
            A spend budget can take what is left into next month or reset to zero. You choose for
            each budget.
          </Detail>

          <Detail
            label="Alerts"
            title="A nudge at the right moment"
            visual={
              <div className="flex items-start gap-3 rounded-bl-md border border-line bg-canvas p-3.5 text-sm">
                <span className="relative mt-0.5 text-ink-muted">
                  <Bell className="size-4" aria-hidden="true" />
                  <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-caution ring-2 ring-canvas" />
                </span>
                <span>
                  <span className="block font-medium">Transport is running low</span>
                  <span className="block text-ink-muted">Less than 20% remaining</span>
                </span>
              </div>
            }
          >
            Budgetly flags a budget running low, a savings goal nearly reached and a category close
            to its limit.
          </Detail>

          <Detail
            label="Search"
            title="Find any transaction"
            visual={
              <div className="grid gap-3 text-sm">
                <div className="flex h-10 items-center gap-2.5 rounded-bl-md border border-line-strong px-3 text-ink">
                  <Search className="size-4 text-ink-faint" aria-hidden="true" />
                  netflix
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={pill}>This month</span>
                  <span className={pill}>Expense</span>
                  <span className={`${pill} text-ink-faint`}>1 result</span>
                </div>
              </div>
            }
          >
            Search by description and filter by month or type. The list pages itself, so a busy
            year stays quick.
          </Detail>

          <Detail label="Theme" title="Light by day, dark by night" visual={<ThemeSwitch />}>
            Both themes are designed, not inverted. Try it here: your choice carries into the app.
          </Detail>

          <Detail
            label="Sign in"
            title="Your account, your way in"
            visual={
              <div className="grid gap-2 text-sm">
                <span className="flex h-10 items-center justify-center rounded-bl-md border border-line-strong font-medium">
                  Continue with Google
                </span>
                <span className="flex h-10 items-center justify-center rounded-bl-md border border-line font-medium text-ink-muted">
                  Email and password
                </span>
              </div>
            }
          >
            Use your Google account or an email and password. Forgotten passwords reset by email.
          </Detail>
        </div>
      </div>
    </section>
  )
}
