import type { Metadata } from 'next'
import { AccountNav } from '@/components/account/account-nav'
import { AuthCard } from '@/components/account/auth-card'
import { getProfile, getUser } from '@/lib/account/session'
import { accountsEnabled } from '@/lib/supabase/env'

export const metadata: Metadata = {
  title: { template: '%s | My account', default: 'My account' },
  robots: { index: false }
}

export default async function AccountLayout({ children }: LayoutProps<'/account'>) {
  if (!accountsEnabled) return <AuthCard heading="My account">{null}</AuthCard>
  const user = await getUser()
  // Signed out: each page redirects to /login with the right `next`
  if (!user) return children
  const profile = await getProfile()
  const name = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
  return (
    <div className="container py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <p className="text-sm text-muted-foreground">My account</p>
        <h1 className="text-2xl tracking-tight md:text-3xl">
          {name ? `Hi, ${profile?.first_name}` : 'Welcome back'}
        </h1>
        <p className="text-sm text-muted-foreground">{user.email}</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AccountNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
