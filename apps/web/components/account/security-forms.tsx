'use client'

import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { changePassword, type FormState, requestEmailChange } from '@/lib/account/auth-actions'
import { FormField, FormMessage } from './form-field'

const initial: FormState = {}

/**
 * Asks Supabase to change the sign-in email. Nothing changes until the customer opens the
 * confirmation link(s) Supabase emails; `pending` is a change still waiting for that.
 */
export function ChangeEmailForm({ email, pending }: { email: string; pending: string | null }) {
  const [state, action, sending] = useActionState(requestEmailChange, initial)
  const waitingFor = state.done ? state.values?.email : pending
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      {waitingFor && (
        <div className="flex gap-3 rounded-md bg-brand/10 px-3 py-3 text-sm text-brand-dark">
          <MailCheck className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p role="status">
            Check your email: we sent a confirmation link to <strong>{waitingFor}</strong>. To keep
            your account safe you may get one at <strong>{email}</strong> too. Your email changes
            once every link we sent has been opened. Until then you keep signing in with {email}.
          </p>
        </div>
      )}
      <FormField name="current_email" label="Current email" value={email} disabled readOnly />
      <FormField
        name="email"
        label="New email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.done ? '' : state.values?.email}
        error={state.fieldErrors?.email}
      />
      <div>
        <Button type="submit" size="lg" disabled={sending}>
          {sending ? 'Sending…' : waitingFor ? 'Send a new link' : 'Change email'}
        </Button>
      </div>
    </form>
  )
}

export function ChangePasswordForm() {
  const [state, action, saving] = useActionState(changePassword, initial)
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (!state.done) return
    toast.success('Your new password is saved')
    form.current?.reset()
  }, [state])
  const e = state.fieldErrors ?? {}
  return (
    <form ref={form} action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <FormField
        name="current"
        label="Current password"
        type="password"
        autoComplete="current-password"
        required
        error={e.current}
        hint={
          <Link href="/forgot-password" className="text-sm font-medium text-brand hover:underline">
            Forgot it?
          </Link>
        }
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          name="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          error={e.password}
        />
        <FormField
          name="confirm"
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          error={e.confirm}
        />
      </div>
      <div>
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? 'Saving…' : 'Change password'}
        </Button>
      </div>
    </form>
  )
}
