'use client'

import { MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import {
  type FormState,
  requestPasswordReset,
  signIn,
  signUp,
  updatePassword
} from '@/lib/account/auth-actions'
import { FormField, FormMessage } from './form-field'

const initial: FormState = {}

export function LoginForm({ next, notice }: { next: string; notice?: string }) {
  const [state, action, pending] = useActionState(signIn, initial)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {notice && !state.error && <FormMessage>{notice}</FormMessage>}
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="current-password"
        required
        error={state.fieldErrors?.password}
        hint={
          <Link href="/forgot-password" className="text-sm text-brand hover:underline">
            Forgot password?
          </Link>
        }
      />
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUp, initial)
  if (state.done)
    return (
      <CheckEmail>
        We sent a confirmation link to <strong>{state.values?.email}</strong>. Open it to finish
        creating your account.
      </CheckEmail>
    )
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <input type="hidden" name="next" value={next} />
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <div className="grid grid-cols-2 gap-3">
        <FormField
          name="firstName"
          label="First name"
          autoComplete="given-name"
          required
          defaultValue={state.values?.firstName}
          error={state.fieldErrors?.firstName}
        />
        <FormField
          name="lastName"
          label="Last name"
          autoComplete="family-name"
          required
          defaultValue={state.values?.lastName}
          error={state.fieldErrors?.lastName}
        />
      </div>
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <p className="-mt-2 text-xs text-muted-foreground">At least 8 characters.</p>
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </Button>
    </form>
  )
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, initial)
  if (state.done)
    return (
      <CheckEmail>
        If there’s an account for <strong>{state.values?.email}</strong>, we’ve sent a link to reset
        your password. (Occasionally emails end up in spam.)
      </CheckEmail>
    )
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <FormField
        name="email"
        label="Email"
        type="email"
        autoComplete="email"
        required
        defaultValue={state.values?.email}
        error={state.fieldErrors?.email}
      />
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? 'Sending…' : 'Send reset link'}
      </Button>
    </form>
  )
}

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(updatePassword, initial)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <FormField
        name="password"
        label="New password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
        error={state.fieldErrors?.password}
      />
      <FormField
        name="confirm"
        label="Confirm new password"
        type="password"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />
      <Button type="submit" size="lg" className="mt-2 w-full" disabled={pending}>
        {pending ? 'Saving…' : 'Save new password'}
      </Button>
    </form>
  )
}

function CheckEmail({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center" role="status">
      <MailCheck className="size-10 text-brand" aria-hidden />
      <p className="font-semibold text-foreground">Check your email</p>
      <p className="text-sm text-muted-foreground">{children}</p>
    </div>
  )
}
