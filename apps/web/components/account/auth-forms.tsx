'use client'

import { REGEXP_ONLY_DIGITS } from 'input-otp'
import { KeyRound, MailCheck } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import {
  type FormState,
  requestPasswordReset,
  sendLoginCode,
  signIn,
  signUp,
  updatePassword,
  verifyLoginCode
} from '@/lib/account/auth-actions'
import { LOGIN_CODE_LENGTH } from '@/lib/account/login-code'
import { FormField, FormMessage } from './form-field'

const initial: FormState = {}

export type LoginMethod = 'password' | 'code'

/**
 * Sign in with a password or with a code emailed to you. The code option is always offered:
 * it's how customers from the old site (who have no password here yet) get in.
 */
export function LoginForm({
  next,
  notice,
  method: initialMethod = 'password'
}: {
  next: string
  notice?: string
  method?: LoginMethod
}) {
  const [method, setMethod] = useState<LoginMethod>(initialMethod)
  const [email, setEmail] = useState('')
  return (
    <div className="flex flex-col gap-4">
      {method === 'password' ? (
        <PasswordLoginForm next={next} notice={notice} email={email} onEmail={setEmail} />
      ) : (
        <EmailCodeForm next={next} email={email} onEmail={setEmail} />
      )}
      <div className="flex items-center gap-3 text-xs text-muted-foreground uppercase">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      {method === 'password' ? (
        <Button type="button" variant="outline" size="lg" onClick={() => setMethod('code')}>
          <MailCheck aria-hidden />
          Email me a sign-in code
        </Button>
      ) : (
        <Button type="button" variant="outline" size="lg" onClick={() => setMethod('password')}>
          <KeyRound aria-hidden />
          Sign in with a password
        </Button>
      )}
    </div>
  )
}

function PasswordLoginForm({
  next,
  notice,
  email,
  onEmail
}: {
  next: string
  notice?: string
  email: string
  onEmail: (email: string) => void
}) {
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
        defaultValue={state.values?.email ?? email}
        onChange={(e) => onEmail(e.currentTarget.value)}
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

/** Step 1: ask for the email and send a code. Step 2: enter the code (submits when complete). */
function EmailCodeForm({
  next,
  email,
  onEmail
}: {
  next: string
  email: string
  onEmail: (email: string) => void
}) {
  const [sent, send, sending] = useActionState(sendLoginCode, initial)
  const [checked, verify, verifying] = useActionState(verifyLoginCode, initial)
  const [changingEmail, setChangingEmail] = useState(false)
  const [code, setCode] = useState('')
  const codeForm = useRef<HTMLFormElement>(null)

  // A new send (first one or "send a new code") shows the code step with an empty code
  useEffect(() => {
    if (!sent.done) return
    setChangingEmail(false)
    setCode('')
  }, [sent])

  // A wrong or expired code clears the boxes for the next try
  useEffect(() => {
    if (checked.fieldErrors?.token) setCode('')
  }, [checked])

  const sentTo = sent.values?.email ?? ''
  if (!sent.done || changingEmail)
    return (
      <form action={send} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <p className="text-sm text-muted-foreground">
          Shopped with us before? We’ll email you a sign-in code, no password needed.
        </p>
        {sent.error && <FormMessage>{sent.error}</FormMessage>}
        <FormField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          required
          defaultValue={sent.values?.email ?? email}
          onChange={(e) => onEmail(e.currentTarget.value)}
          error={sent.fieldErrors?.email}
        />
        <Button type="submit" size="lg" className="mt-2 w-full" disabled={sending}>
          {sending ? 'Sending…' : 'Email me a code'}
        </Button>
      </form>
    )

  const codeError = checked.fieldErrors?.token
  return (
    <div className="flex flex-col gap-4">
      <form ref={codeForm} action={verify} className="flex flex-col gap-4" noValidate>
        <input type="hidden" name="next" value={next} />
        <input type="hidden" name="email" value={sentTo} />
        <p className="text-sm text-muted-foreground" role="status">
          If there’s an account for <strong className="text-foreground">{sentTo}</strong>, we’ve
          emailed it a sign-in code. (Occasionally emails end up in spam.)
        </p>
        {sent.error && <FormMessage>{sent.error}</FormMessage>}
        <div className="flex flex-col items-center gap-2">
          <label htmlFor="login-code" className="self-start text-sm font-medium">
            Sign-in code
          </label>
          <InputOTP
            id="login-code"
            containerClassName="w-full"
            name="token"
            maxLength={LOGIN_CODE_LENGTH}
            pattern={REGEXP_ONLY_DIGITS}
            autoComplete="one-time-code"
            autoFocus
            value={code}
            onChange={setCode}
            onComplete={() => codeForm.current?.requestSubmit()}
            disabled={verifying}
            aria-invalid={codeError ? true : undefined}
            aria-describedby={codeError ? 'login-code-error' : undefined}
          >
            <InputOTPGroup className="w-full">
              {Array.from({ length: LOGIN_CODE_LENGTH }, (_, i) => (
                <InputOTPSlot key={i} index={i} className="h-12 min-w-0 flex-1 text-lg" />
              ))}
            </InputOTPGroup>
          </InputOTP>
          {codeError && (
            <p id="login-code-error" className="text-center text-sm text-destructive">
              {codeError}
            </p>
          )}
        </div>
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={verifying || code.length < LOGIN_CODE_LENGTH}
        >
          {verifying ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <form action={send}>
          <input type="hidden" name="next" value={next} />
          <input type="hidden" name="email" value={sentTo} />
          <button
            type="submit"
            className="font-medium text-brand hover:underline disabled:opacity-50"
            disabled={sending}
          >
            {sending ? 'Sending…' : 'Send a new code'}
          </button>
        </form>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground hover:underline"
          onClick={() => setChangingEmail(true)}
        >
          Use a different email
        </button>
      </div>
    </div>
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

export function ResetPasswordForm({
  next,
  submitLabel = 'Save new password'
}: {
  /** Where to go once it's saved (default: the account page) */
  next?: string
  submitLabel?: string
}) {
  const [state, action, pending] = useActionState(updatePassword, initial)
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {next && <input type="hidden" name="next" value={next} />}
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
        {pending ? 'Saving…' : submitLabel}
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
