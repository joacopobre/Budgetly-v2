import { Geist_Mono } from 'next/font/google'
import { switzerVariable } from '../fonts'
import { ThemeProvider } from '@/context/ThemeContext'
import LandingRoot from '@/components/landing/LandingRoot'
import './landing.css'

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
})

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <LandingRoot fontVariables={`${switzerVariable.variable} ${geistMono.variable}`}>
        {children}
      </LandingRoot>
    </ThemeProvider>
  )
}
