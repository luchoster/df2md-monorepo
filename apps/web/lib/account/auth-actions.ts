'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { siteOrigin as configuredSiteOrigin } from '@/lib/site-url'
import { accountsEnabled } from '@/lib/supabase/env'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import { LOGIN_CODE_LENGTH } from './login-code'
import { safeNext, setPasswordPath } from './session'

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  done?: boolean
  values?: Record<string, string>
}

const NOT_ENABLED: FormState = { error: 'Customer accounts are not switched on yet.' }

async function siteOrigin() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  return configuredSiteOrigin(`${h.get('x-forwarded-proto') ?? 'https'}://${host}`)
}

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

const fieldErrors = (error: z.ZodError) =>
  Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]))

const email = z.email('Enter a valid email').max(200)
const password = z.string().min(8, 'Use at least 8 characters').max(72)

/** Where a customer goes right after signing in: /set-password first if they have none yet. */
async function afterSignIn(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  next: string
) {
  const { data } = await supabase
    .from('profiles')
    .select('password_set')
    .eq('id', userId)
    .maybeSingle()
  return data && !data.password_set ? setPasswordPath(next) : next
}

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = { email: str(form, 'email') }
  const parsed = z
    .object({ email, password: z.string().min(1, 'Enter your password') })
    .safeParse({ email: values.email, password: String(form.get('password') ?? '') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error)
    return {
      error:
        error.code === 'email_not_confirmed'
          ? 'Please confirm your email first. Check your inbox for the link we sent.'
          : 'Wrong email or password.',
      values
    }
  redirect(await afterSignIn(supabase, data.user.id, safeNext(form.get('next'))))
}

/**
 * Emails a one-time sign-in code to an existing account (never creates one). Reports success
 * either way, so the form can't be used to find out who has an account.
 */
export async function sendLoginCode(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = { email: str(form, 'email') }
  const parsed = email.safeParse(values.email)
  if (!parsed.success) return { fieldErrors: { email: 'Enter a valid email' }, values }

  const next = safeNext(form.get('next'))
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email: parsed.data,
    options: {
      shouldCreateUser: false,
      // The email can carry a link as well as the code; the link signs in through /auth/confirm
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`
    }
  })
  if (error?.status === 429)
    return {
      error: 'Too many codes were requested. Please wait a few minutes and try again.',
      values
    }
  return { done: true, values }
}

export async function verifyLoginCode(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = { email: str(form, 'email') }
  const token = str(form, 'token')
  const parsed = z
    .object({
      email,
      token: z
        .string()
        .regex(/^\d+$/, 'Enter the code from the email')
        .length(LOGIN_CODE_LENGTH, {
          message: `Enter all ${LOGIN_CODE_LENGTH} digits`
        })
    })
    .safeParse({ email: values.email, token })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values, done: true }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.verifyOtp({
    email: parsed.data.email,
    token: parsed.data.token,
    type: 'email'
  })
  if (error || !data.user)
    return {
      fieldErrors: {
        token: 'That code is wrong or has expired. Check the email or send a new one.'
      },
      values,
      done: true
    }
  redirect(await afterSignIn(supabase, data.user.id, safeNext(form.get('next'))))
}

export async function signUp(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = {
    firstName: str(form, 'firstName'),
    lastName: str(form, 'lastName'),
    email: str(form, 'email')
  }
  const parsed = z
    .object({
      firstName: z.string().min(1, 'Enter your first name').max(80),
      lastName: z.string().min(1, 'Enter your last name').max(80),
      email,
      password
    })
    .safeParse({ ...values, password: String(form.get('password') ?? '') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values }

  const next = safeNext(form.get('next'))
  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { first_name: parsed.data.firstName, last_name: parsed.data.lastName },
      emailRedirectTo: `${await siteOrigin()}/auth/confirm?next=${encodeURIComponent(next)}`
    }
  })
  if (error) {
    if (error.code === 'weak_password') return { fieldErrors: { password: error.message }, values }
    return { error: 'We could not create your account. Please try again.', values }
  }
  // They chose a password just now, so they're never sent to /set-password
  if (data.user)
    await createAdminClient()
      ?.from('profiles')
      .update({ password_set: true })
      .eq('id', data.user.id)
  // Email confirmation off: signed in straight away
  if (data.session) redirect(next)
  return { done: true, values }
}

/** Always reports success, so the form can't be used to find out who has an account. */
export async function requestPasswordReset(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = { email: str(form, 'email') }
  const parsed = email.safeParse(values.email)
  if (!parsed.success) return { fieldErrors: { email: 'Enter a valid email' }, values }
  const supabase = await createClient()
  await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`
  })
  return { done: true, values }
}

export async function updatePassword(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const parsed = z
    .object({ password, confirm: z.string() })
    .refine((v) => v.password === v.confirm, {
      path: ['confirm'],
      message: 'Passwords don’t match'
    })
    .safeParse({ password: form.get('password'), confirm: form.get('confirm') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error) }

  const supabase = await createClient()
  const { data, error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error)
    return {
      error:
        error.code === 'same_password'
          ? 'Choose a password you haven’t used before.'
          : 'Your session has expired. Please sign in again with an email code.'
    }
  // Server-set flag (customers can't write it), so it goes through the secret key
  await createAdminClient()?.from('profiles').update({ password_set: true }).eq('id', data.user.id)
  const next = form.get('next')
  redirect(next ? safeNext(next) : '/account?updated=password')
}

export async function signOut() {
  if (accountsEnabled) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
