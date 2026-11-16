'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { THEME_STORAGE_KEY } from '@/lib/theme'

type Theme = 'light' | 'dark'


const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void } | null>(null)

/* The theme is one class on <html>, so every page (landing, auth, app) and
   anything rendered outside the page tree follows it. */
function apply(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    if (stored === 'dark' || stored === 'light') {
      setTheme(stored)
      apply(stored)
    }
  }, [])

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    localStorage.setItem(THEME_STORAGE_KEY, next)
    apply(next)
    setTheme(next)
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
