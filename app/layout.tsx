import type { Metadata } from 'next'
import './globals.css'
import { fontVariables } from './fonts'
import Providers from './providers'
import { THEME_STORAGE_KEY } from '@/lib/theme'

export const metadata: Metadata = {
  title: 'Budgetly',
  description: 'Personal budgeting app',
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
}

/* Applies the saved theme before first paint, so a dark-theme visitor never
   sees a flash of the light page. ThemeProvider takes over from there. */
const themeScript = `try{if(localStorage.getItem('${THEME_STORAGE_KEY}')==='dark')document.documentElement.classList.add('dark')}catch(e){}`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
