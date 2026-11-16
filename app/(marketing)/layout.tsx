import LandingRoot from '@/components/landing/LandingRoot'
import './landing.css'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <LandingRoot>{children}</LandingRoot>
}
