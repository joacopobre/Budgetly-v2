'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

/** Light / dark switch. Uses the same saved preference as the app. */
export default function ThemeSwitch({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const options = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
  ] as const

  return (
    <div
      role="group"
      aria-label="Theme"
      className={cn('inline-flex rounded-bl-md border border-line p-1', className)}
    >
      {options.map(({ value, label, Icon }) => {
        const selected = theme === value
        return (
          <button
            key={value}
            type="button"
            aria-pressed={selected}
            onClick={() => !selected && toggleTheme()}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-bl-sm px-3 text-sm font-medium transition-colors',
              selected ? 'bg-ink text-canvas' : 'text-ink-muted hover:text-ink',
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
