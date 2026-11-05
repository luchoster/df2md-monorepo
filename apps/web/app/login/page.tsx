import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/account/auth-card'
import { LoginForm } from '@/components/account/auth-forms'
import { getUser, safeNext } from '@/lib/account/session'

export const metadata: Metadata = { title: 'Sign in', robots: { index: false } }

const NOTICES: Record<string, { tone: 'success' | 'error'; text: string }> = {
  link: {
    tone: 'error',
    text: 'That link has expired or was already used. Sign in, or request a new link.'
  },
  // First of the two email-change links, opened where the customer isn't signed in
  'email-pending': {
    tone: 'success',
    text: 'Thanks, that’s confirmed. Now open the link we sent to your other email address to finish the change.'
  }
}

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams
  const next = safeNext(params.next as string | undefined)
  if (await getUser()) redirect(next)
  const register = `/register${next === '/account' ? '' : `?next=${encodeURIComponent(next)}`}`
  return (
    <AuthCard
      heading="Sign in"
      description="Track orders, manage your Autoship and check out faster."
      footer={
        <>
          <span>New here?</span>
          <Link href={register} className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <LoginForm
        next={next}
        notice={NOTICES[String(params.error ?? params.notice ?? '')]}
        method={params.method === 'code' ? 'code' : 'password'}
      />
    </AuthCard>
  )
}
