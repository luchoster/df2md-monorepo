import type { Metadata } from 'next'
import Link from 'next/link'
import { AuthCard } from '@/components/account/auth-card'
import { ForgotPasswordForm } from '@/components/account/auth-forms'

export const metadata: Metadata = { title: 'Forgot password', robots: { index: false } }

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      heading="Forgot your password?"
      description="Enter your email and we’ll send you a link to choose a new one."
      footer={
        <Link href="/login" className="font-medium text-brand hover:underline">
          Back to sign in
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
