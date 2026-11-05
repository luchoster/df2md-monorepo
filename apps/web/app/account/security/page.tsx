import type { Metadata } from 'next'
import { FormMessage } from '@/components/account/form-field'
import { ChangeEmailForm, ChangePasswordForm } from '@/components/account/security-forms'
import { requireUser } from '@/lib/account/session'

export const metadata: Metadata = { title: 'Sign-in & security' }

/** Where /auth/confirm sends a customer back to after an email-change link */
const NOTICES: Record<string, string> = {
  email: 'Your email is changed. Use the new address to sign in from now on.',
  'email-pending':
    'Thanks, that’s confirmed. Now open the link we sent to your other email address to finish the change.'
}

export default async function SecurityPage({ searchParams }: PageProps<'/account/security'>) {
  const params = await searchParams
  const updated = String(params.updated ?? '')
  const user = await requireUser(
    `/account/security${NOTICES[updated] ? `?updated=${updated}` : ''}`
  )
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl tracking-tight md:text-2xl">Sign-in &amp; security</h2>
        <p className="text-sm text-muted-foreground">
          The email and password you use to sign in. You can always sign in with an emailed code
          too.
        </p>
      </div>
      {NOTICES[updated] && <FormMessage tone="success">{NOTICES[updated]}</FormMessage>}

      <section className="rounded-lg border bg-card p-5 md:p-8">
        <h3 className="mb-1 font-display text-lg font-semibold">Email</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Order updates and receipts go to this address.
        </p>
        <ChangeEmailForm email={user.email} pending={user.pendingEmail} />
      </section>

      <section className="rounded-lg border bg-card p-5 md:p-8">
        <h3 className="mb-4 font-display text-lg font-semibold">Password</h3>
        <ChangePasswordForm />
      </section>
    </div>
  )
}
