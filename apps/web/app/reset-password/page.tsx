import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/account/auth-card'
import { ResetPasswordForm } from '@/components/account/auth-forms'
import { getUser } from '@/lib/account/session'
import { accountsEnabled } from '@/lib/supabase/env'

export const metadata: Metadata = { title: 'Choose a new password', robots: { index: false } }

/** Reached from the reset email via /auth/confirm, which signs the customer in first. */
export default async function ResetPasswordPage() {
  const user = await getUser()
  return (
    <AuthCard
      heading="Choose a new password"
      description={user ? `For ${user.email}` : undefined}
      footer={
        <Link href="/account" className="font-medium text-brand hover:underline">
          Go to my account
        </Link>
      }
    >
      {user || !accountsEnabled ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-3 text-center text-sm">
          <p className="text-muted-foreground">
            This page opens from the link in your password reset email, and that link has expired.
          </p>
          <Link href="/forgot-password" className="font-medium text-brand hover:underline">
            Send a new link
          </Link>
        </div>
      )}
    </AuthCard>
  )
}
