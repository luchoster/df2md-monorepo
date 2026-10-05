import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { AuthCard } from '@/components/account/auth-card'
import { RegisterForm } from '@/components/account/auth-forms'
import { getUser, safeNext } from '@/lib/account/session'

export const metadata: Metadata = { title: 'Create an account', robots: { index: false } }

export default async function RegisterPage({ searchParams }: PageProps<'/register'>) {
  const next = safeNext((await searchParams).next as string | undefined)
  if (await getUser()) redirect(next)
  return (
    <AuthCard
      heading="Create an account"
      description="Save your address, see every order and manage Autoship in one place."
      footer={
        <>
          <span>Already have an account?</span>
          <Link
            href={`/login${next === '/account' ? '' : `?next=${encodeURIComponent(next)}`}`}
            className="font-medium text-brand hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <RegisterForm next={next} />
    </AuthCard>
  )
}
