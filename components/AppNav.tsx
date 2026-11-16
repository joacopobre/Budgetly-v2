'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { signOut, useSession } from 'next-auth/react'
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCircle,
  Info,
  LogOut,
  Map,
  Menu,
  Settings,
  X,
} from 'lucide-react'
import { useOnboarding, TOUR_DONE_KEY } from '@/context/OnboardingContext'
import ThemeSwitch from '@/components/landing/ThemeSwitch'
import type { Notification } from '@/types/notifications'

const links = [
  { href: '/dashboard', label: 'Dashboard', tourTarget: 'nav-dashboard' },
  { href: '/transactions', label: 'Transactions', tourTarget: 'nav-transactions' },
  { href: '/budgets', label: 'Budgets', tourTarget: 'nav-budgets' },
]

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function initialsOf(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.split('@')[0] || ''
  const parts = source.split(/[\s._-]+/).filter(Boolean)
  if (parts.length === 0) return '·'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function TypeIcon({ type }: { type: Notification['type'] }) {
  if (type === 'WARNING') return <AlertTriangle className="mt-0.5 size-4 shrink-0 text-caution" />
  if (type === 'SUCCESS') return <CheckCircle className="mt-0.5 size-4 shrink-0 text-positive" />
  return <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" />
}

/** Closes a popover on outside press or Escape. */
function useDismiss(
  open: boolean,
  close: () => void,
  refs: React.RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    if (!open) return
    const onClickAway = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node
      if (refs.some(ref => ref.current?.contains(target))) return
      close()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('mousedown', onClickAway)
    document.addEventListener('touchstart', onClickAway)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onClickAway)
      document.removeEventListener('touchstart', onClickAway)
      document.removeEventListener('keydown', onKeyDown)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])
}

export default function AppNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { startTour } = useOnboarding()

  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  const [accountOpen, setAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)

  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])

  const close = () => setOpen(false)

  const handleStartTour = () => {
    try {
      localStorage.removeItem(TOUR_DONE_KEY)
    } catch {}
    startTour()
    if (pathname !== '/dashboard') {
      router.push('/dashboard')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) setNotifications(await res.json())
    } catch {}
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllRead = async () => {
    await fetch('/api/notifications/mark-all-read', { method: 'PATCH' })
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  useDismiss(open, close, [menuRef, toggleRef])
  useDismiss(notifOpen, () => setNotifOpen(false), [notifRef])
  useDismiss(accountOpen, () => setAccountOpen(false), [accountRef])

  const user = session?.user
  const initials = initialsOf(user?.name, user?.email)

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-lg backdrop-saturate-150">
      <div className="bl-container flex h-[60px] items-center gap-2">
        <Link href="/dashboard" className="bl-logo mr-3 md:mr-7" aria-label="Budgetly dashboard">
          <i aria-hidden="true" />
          Budgetly
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              data-tour={link.tourTarget}
              aria-current={pathname === link.href ? 'page' : undefined}
              className="bl-navlink"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
              aria-expanded={notifOpen}
              onClick={() => setNotifOpen(prev => !prev)}
              className="bl-icon-btn"
            >
              <Bell aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="bl-mono absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] leading-none font-medium text-on-brand ring-2 ring-canvas">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <div
                className="bl-menu top-full -right-12 mt-2 w-80 max-w-[calc(100vw-32px)] origin-top-right p-0 md:right-0"
                style={{ minWidth: 0 }}
              >
                <div className="flex items-center justify-between gap-3 border-b border-line py-2.5 pr-2 pl-4">
                  <span className="bl-eyebrow">Notifications</span>
                  <div className="flex items-center gap-1">
                    {unreadCount > 0 && (
                      <button type="button" onClick={markAllRead} className="bl-link px-1 text-xs">
                        Mark all as read
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() => setNotifOpen(false)}
                      className="bl-icon-btn size-7"
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </div>
                </div>

                <div className="bl-rule-list max-h-80 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-9 text-center text-sm text-ink-muted">
                      No notifications yet
                    </p>
                  ) : (
                    notifications.map(n => (
                      <div
                        key={n.id}
                        className={`flex items-start gap-3 px-4 py-3 ${n.read ? '' : 'bg-brand-soft'}`}
                      >
                        <TypeIcon type={n.type} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm leading-snug ${n.read ? 'text-ink-muted' : 'text-ink'}`}>
                            {n.message}
                          </p>
                          <p className="bl-meta mt-1 text-[0.6875rem]">{timeAgo(n.createdAt)}</p>
                        </div>
                        {!n.read && (
                          <button
                            type="button"
                            onClick={() => markRead(n.id)}
                            className="bl-icon-btn -mt-1 -mr-1.5 size-7"
                            aria-label="Mark as read"
                            title="Mark as read"
                          >
                            <Check aria-hidden="true" className="size-4" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Account (desktop) */}
          <div className="relative hidden md:block" ref={accountRef}>
            <button
              type="button"
              aria-label="Account menu"
              aria-expanded={accountOpen}
              onClick={() => setAccountOpen(prev => !prev)}
              className="ml-1 grid size-8 place-items-center rounded-full bg-forest-800 text-[0.6875rem] font-semibold tracking-wide text-paper transition-shadow hover:ring-4 hover:ring-brand-soft aria-expanded:ring-4 aria-expanded:ring-brand-soft dark:border dark:border-line-strong"
            >
              {initials}
            </button>

            {accountOpen && (
              <div className="bl-menu top-full right-0 mt-2 w-64 origin-top-right" style={{ minWidth: 0 }}>
                {user && (
                  <>
                    <div className="px-[11px] pt-1.5 pb-2">
                      {user.name && <p className="truncate text-sm font-medium">{user.name}</p>}
                      {user.email && <p className="truncate text-sm text-ink-muted">{user.email}</p>}
                    </div>
                    <div className="bl-menu__rule" />
                  </>
                )}
                <Link
                  href="/settings"
                  className="bl-menu__item bl-menu__item--icon"
                  onClick={() => setAccountOpen(false)}
                >
                  <Settings aria-hidden="true" />
                  Account settings
                </Link>
                <button
                  type="button"
                  className="bl-menu__item bl-menu__item--icon"
                  onClick={() => {
                    setAccountOpen(false)
                    handleStartTour()
                  }}
                >
                  <Map aria-hidden="true" />
                  Take the tour
                </button>
                <div className="bl-menu__rule" />
                <div className="flex items-center justify-between gap-3 py-1 pr-1 pl-[11px]">
                  <span className="text-[0.9375rem]">Theme</span>
                  <ThemeSwitch />
                </div>
                <div className="bl-menu__rule" />
                <button
                  type="button"
                  className="bl-menu__item bl-menu__item--icon"
                  onClick={() => signOut({ callbackUrl: '/login' })}
                >
                  <LogOut aria-hidden="true" />
                  Sign out
                </button>
              </div>
            )}
          </div>

          {/* Menu (mobile) */}
          <button
            ref={toggleRef}
            type="button"
            aria-label={open ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={open}
            aria-controls="app-menu"
            onClick={() => setOpen(prev => !prev)}
            className="bl-icon-btn md:hidden"
          >
            {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>
      </div>

      {open && (
        <div
          id="app-menu"
          ref={menuRef}
          className="absolute inset-x-0 top-full border-b border-line bg-canvas shadow-bl-md md:hidden"
        >
          <div className="bl-container flex flex-col gap-1 py-3">
            {links.map(link => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="bl-navlink py-2.5"
                onClick={close}
              >
                {link.label}
              </Link>
            ))}
            <div className="my-2 h-px bg-line" />
            <Link
              href="/settings"
              onClick={close}
              aria-current={pathname === '/settings' ? 'page' : undefined}
              className="bl-navlink flex items-center gap-2.5 py-2.5"
            >
              <Settings aria-hidden="true" className="size-4" />
              Account settings
            </Link>
            <button
              type="button"
              onClick={() => {
                close()
                handleStartTour()
              }}
              className="bl-navlink flex items-center gap-2.5 py-2.5 text-left"
            >
              <Map aria-hidden="true" className="size-4" />
              Take the tour
            </button>
            <div className="flex items-center justify-between gap-3 py-2 pl-[13px]">
              <span className="text-[0.9375rem] font-medium text-ink-muted">Theme</span>
              <ThemeSwitch />
            </div>
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="bl-btn bl-btn--sm bl-btn--ghost mt-2"
            >
              Sign out
            </button>
            {user?.email && (
              <p className="bl-meta mt-2 truncate text-center normal-case">{user.email}</p>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
