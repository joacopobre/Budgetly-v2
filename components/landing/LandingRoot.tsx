'use client'

import { useTheme } from '@/context/ThemeContext'
import { cn } from '@/lib/utils'

/**
 * Root of the landing page: applies the redesign fonts and the saved theme
 * (the same `budgetly-theme` preference the app uses).
 */
export default function LandingRoot({
  children,
  fontVariables,
}: {
  children: React.ReactNode
  fontVariables: string
}) {
  const { theme } = useTheme()
  return (
    <div id="landing-root" className={cn('landing', fontVariables, theme === 'dark' && 'dark')}>
      {children}
    </div>
  )
}
