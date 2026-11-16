import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Settings — Budgetly' }

export default async function SettingsPage() {
  const session = await getAuthSession()
  if (!session) redirect('/login')

  return (
    <main className="bl-container bl-page">
      <div className="bl-head bl-rise">
        <h1 className="bl-h1">Settings</h1>
      </div>
      <SettingsClient />
    </main>
  )
}
