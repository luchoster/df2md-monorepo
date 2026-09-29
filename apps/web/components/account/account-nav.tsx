'use client'

import { CreditCard, Dog, LogOut, type LucideIcon, Package, Repeat, UserRound } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { openBillingPortal } from '@/lib/account/actions'
import { signOut } from '@/lib/account/auth-actions'
import { cn } from '@/lib/utils'

const LINKS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/account', label: 'Profile', icon: UserRound },
  { href: '/account/orders', label: 'Orders', icon: Package },
  { href: '/account/autoship', label: 'Autoship', icon: Repeat },
  { href: '/account/dogs', label: 'My dogs', icon: Dog }
]

const item =
  'flex shrink-0 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'

/** Sidebar on desktop, a scrolling tab row on phones (shadcnblocks Settings Profile 4 layout). */
export function AccountNav() {
  const pathname = usePathname()
  const active = (href: string) =>
    href === '/account' ? pathname === href : pathname === href || pathname.startsWith(`${href}/`)
  return (
    <nav aria-label="Account" className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:px-0">
      <ul className="flex gap-1 lg:flex-col">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? 'page' : undefined}
              className={cn(item, active(href) && 'bg-brand/10 text-brand-dark hover:bg-brand/10')}
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
        <li>
          <form action={openBillingPortal}>
            <button type="submit" className={cn(item, 'w-full')}>
              <CreditCard className="size-4" aria-hidden />
              Payment methods
            </button>
          </form>
        </li>
        <li className="lg:mt-4 lg:border-t lg:pt-4">
          <form action={signOut}>
            <button type="submit" className={cn(item, 'w-full')}>
              <LogOut className="size-4" aria-hidden />
              Sign out
            </button>
          </form>
        </li>
      </ul>
    </nav>
  )
}
