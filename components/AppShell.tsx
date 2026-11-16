import AppNav from '@/components/AppNav'

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div id="wrapper" className="min-h-screen bg-canvas text-ink">
      <AppNav />
      {children}
    </div>
  )
}
