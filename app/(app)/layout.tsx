import AppShell from '@/components/AppShell'
import { BudgetsProvider } from '@/context/BudgetsContext'
import { TransactionsProvider } from '@/context/TransactionsContext'
import { OnboardingProvider } from '@/context/OnboardingContext'
import { OnboardingTour } from '@/components/onboarding/OnboardingTour'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <TransactionsProvider>
      <BudgetsProvider>
        <OnboardingProvider>
          <AppShell>{children}</AppShell>
          <OnboardingTour />
        </OnboardingProvider>
      </BudgetsProvider>
    </TransactionsProvider>
  )
}
