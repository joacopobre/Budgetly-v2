'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useOnboarding, TOUR_DONE_KEY } from '@/context/OnboardingContext'

type Step = {
  target: string
  title: string
  description: string
}

const STEPS: Step[] = [
  {
    target: 'nav-dashboard',
    title: 'Welcome to Budgetly!',
    description: 'This is your Dashboard — your financial overview at a glance.',
  },
  {
    target: 'nav-transactions',
    title: 'Transactions',
    description:
      'Track every income and expense here. You can filter, search and import from CSV.',
  },
  {
    target: 'nav-budgets',
    title: 'Budgets',
    description: 'Create spending envelopes or savings goals and move funds between them.',
  },
  {
    target: 'dashboard-stats',
    title: 'Your Key Stats',
    description: 'Your key stats for the current period — income, spending and net balance.',
  },
  {
    target: 'dashboard-trend',
    title: 'Spending Trends',
    description: 'Visualise your spending trends over time with flexible date filters.',
  },
  {
    target: 'add-transaction',
    title: 'Add a Transaction',
    description: 'Add any income or expense here. You can also set it to recur automatically.',
  },
]

const SPOT_PAD = 8
const TOOLTIP_W = 320
const TOOLTIP_H_EST = 210

export function OnboardingTour() {
  const { isActive, endTour } = useOnboarding()
  const [step, setStep] = useState(0)
  const [rect, setRect] = useState<DOMRect | null>(null)
  // Track previous step to detect direction (unused visually but kept for future)
  const prevStepRef = useRef(0)

  const currentStep = STEPS[step]

  const updateRect = useCallback(() => {
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`)
    setRect(el ? el.getBoundingClientRect() : null)
  }, [currentStep.target])

  useEffect(() => {
    if (!isActive) return
    const id = requestAnimationFrame(updateRect)
    window.addEventListener('resize', updateRect)
    window.addEventListener('scroll', updateRect, true)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener('resize', updateRect)
      window.removeEventListener('scroll', updateRect, true)
    }
  }, [isActive, updateRect])


  useEffect(() => {
    if (isActive) {
      prevStepRef.current = 0
      setStep(0)
    }
  }, [isActive])

  const finish = useCallback(() => {
    try {
      localStorage.setItem(TOUR_DONE_KEY, '1')
    } catch {}
    endTour()
  }, [endTour])

  const next = useCallback(() => {
    if (step < STEPS.length - 1) {
      prevStepRef.current = step
      setStep(s => s + 1)
    } else {
      finish()
    }
  }, [step, finish])

  const back = useCallback(() => {
    prevStepRef.current = step
    setStep(s => Math.max(0, s - 1))
  }, [step])

  if (!isActive) return null

  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1200
  const gap = 12

  // Fallback: no target found — centered card
  if (!rect) {
    return (
      <>
        <div
          className="fixed inset-0 z-[9998] bg-(--bl-scrim)"
          onClick={finish}
          aria-hidden="true"
        />
        <div
          role="dialog"
          aria-label={`Tour step ${step + 1} of ${STEPS.length}`}
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: TOOLTIP_W,
            zIndex: 9999,
          }}
          className="rounded-bl-lg border border-line bg-surface text-ink shadow-bl-lg"
        >
          <TooltipInner
            step={step}
            total={STEPS.length}
            title={currentStep.title}
            description={currentStep.description}
            onNext={next}
            onBack={back}
            onSkip={finish}
          />
        </div>
      </>
    )
  }

  // Spotlight bounds
  const spotTop = rect.top - SPOT_PAD
  const spotLeft = rect.left - SPOT_PAD
  const spotRight = rect.right + SPOT_PAD
  const spotBottom = rect.bottom + SPOT_PAD

  // Tooltip position: prefer below → above → right → left
  let tooltipTop: number
  let tooltipLeft: number

  if (spotBottom + gap + TOOLTIP_H_EST < vh) {
    tooltipTop = spotBottom + gap
    tooltipLeft = Math.max(gap, Math.min(rect.left, vw - TOOLTIP_W - gap))
  } else if (spotTop - gap - TOOLTIP_H_EST > 0) {
    tooltipTop = spotTop - gap - TOOLTIP_H_EST
    tooltipLeft = Math.max(gap, Math.min(rect.left, vw - TOOLTIP_W - gap))
  } else if (spotRight + gap + TOOLTIP_W < vw) {
    tooltipLeft = spotRight + gap
    tooltipTop = Math.max(gap, Math.min(rect.top, vh - TOOLTIP_H_EST - gap))
  } else {
    tooltipLeft = Math.max(gap, spotLeft - gap - TOOLTIP_W)
    tooltipTop = Math.max(gap, Math.min(rect.top, vh - TOOLTIP_H_EST - gap))
  }

  const transStyle = { transition: 'top 0.25s ease, left 0.25s ease, width 0.25s ease, height 0.25s ease' }

  const spotW = spotRight - spotLeft
  const spotH = spotBottom - spotTop
  const svgMask = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'><defs><mask id='m'><rect width='100%25' height='100%25' fill='white'/><rect x='${spotLeft}' y='${spotTop}' width='${spotW}' height='${spotH}' rx='10' fill='black'/></mask></defs><rect width='100%25' height='100%25' mask='url(%23m)' fill='white'/></svg>")`

  return (
    <>
      {/* Single overlay with SVG mask punch-out for the spotlight */}
      <div
        onClick={finish}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          backgroundColor: 'var(--bl-scrim)',
          WebkitMaskImage: svgMask,
          maskImage: svgMask,
        }}
      />

      {/* Focus ring around the target element */}
      <div
        aria-hidden="true"
        style={{
          position: 'fixed',
          top: spotTop,
          left: spotLeft,
          width: spotRight - spotLeft,
          height: spotBottom - spotTop,
          zIndex: 9998,
          pointerEvents: 'none',
          borderRadius: 10,
          boxShadow: '0 0 0 2px var(--bl-accent), 0 0 0 6px var(--bl-focus-ring)',
          ...transStyle,
        }}
      />

      {/* Tooltip card */}
      <div
        role="dialog"
        aria-label={`Tour step ${step + 1} of ${STEPS.length}`}
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_W,
          zIndex: 9999,
          transition: 'top 0.25s ease, left 0.25s ease',
        }}
        className="rounded-bl-lg border border-line bg-surface text-ink shadow-bl-lg"
      >
        <TooltipInner
          step={step}
          total={STEPS.length}
          title={currentStep.title}
          description={currentStep.description}
          onNext={next}
          onBack={back}
          onSkip={finish}
        />
      </div>
    </>
  )
}

function TooltipInner({
  step,
  total,
  title,
  description,
  onNext,
  onBack,
  onSkip,
}: {
  step: number
  total: number
  title: string
  description: string
  onNext: () => void
  onBack: () => void
  onSkip: () => void
}) {
  const isLast = step === total - 1

  return (
    <div className="p-5">
      <p className="bl-eyebrow">
        Step {step + 1} of {total}
      </p>

      <h3 className="mt-2 text-lg leading-snug font-medium tracking-[-0.02em]">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{description}</p>

      {/* Progress */}
      <div className="mt-5 flex gap-1" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <i
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors ${i <= step ? 'bg-ink' : 'bg-line'}`}
          />
        ))}
      </div>

      {/* Actions */}
      <div className="mt-5 flex items-center justify-between gap-2">
        <button type="button" onClick={onSkip} className="bl-btn bl-btn--xs bl-btn--quiet -ml-2.5">
          Skip tour
        </button>
        <div className="flex items-center gap-2">
          {step > 0 && (
            <button type="button" onClick={onBack} className="bl-btn bl-btn--xs bl-btn--ghost">
              Back
            </button>
          )}
          <button type="button" onClick={onNext} className="bl-btn bl-btn--xs bl-btn--primary">
            {isLast ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
