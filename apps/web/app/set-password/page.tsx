import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/account/auth-card'
import { ResetPasswordForm } from '@/components/account/auth-forms'
import { getProfile, getUser, safeNext } from '@/lib/account/session'

export const metadata: Metadata = { title: 'Choose your password', robots: { index: false } }

/**
 * First stop after signing in for customers who don't have a password on this site yet (accounts
 * brought over from the old shop). Account pages send them here until they choose one.
 */
export default async function SetPasswordPage({ searchParams }: PageProps<'/set-password'>) {
  const params = await searchParams
  const next = safeNext(params.next as string | undefined)
  const user = await getUser()
  if (!user) redirect(`/login?method=code&next=${encodeURIComponent(next)}`)
  const profile = await getProfile()
  if (profile?.password_set) redirect(next)
  return (
    <AuthCard
      heading="Choose your password"
      description={
        <>
          Welcome to the new Dog Food 2 My Door! Choose a password for{' '}
          <strong className="text-foreground">{user.email}</strong>. You can still sign in with an
          emailed code any time.
        </>
      }
    >
      <ResetPasswordForm next={next} submitLabel="Save password and continue" />
    </AuthCard>
  )
}
