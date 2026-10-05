'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { accountsEnabled } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import { safeNext } from './session'

export type FormState = {
  error?: string
  fieldErrors?: Record<string, string>
  done?: boolean
  values?: Record<string, string>
}

const NOT_ENABLED: FormState = { error: 'Customer accounts are not switched on yet.' }

async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host')
  return `${h.get('x-forwarded-proto') ?? 'https'}://${host}`
}

const str = (form: FormData, key: string) => String(form.get(key) ?? '').trim()

const fieldErrors = (error: z.ZodError) =>
  Object.fromEntries(error.issues.map((i) => [String(i.path[0]), i.message]))

const email = z.email('Enter a valid email').max(200)
const password = z.string().min(8, 'Use at least 8 characters').max(72)

export async function signIn(_: FormState, form: FormData): Promise<FormState> {
  if (!accountsEnabled) return NOT_ENABLED
  const values = { email: str(form, 'email') }
  const parsed = z
    .object({ email, password: z.string().min(1, 'Enter your password') })
    .safeParse({ email: values.email, password: String(form.get('password') ?? '') })
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error)
    return {
      error:
        error.code === 'email_not_confirmed'
          ? 'Please confirm your email first. Check your inbox for the link we sent.'
          : 'Wrong email or password.',
      values
    }
  redirect(safeNext(form.get('next')))
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
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error)
    return {
      error:
        error.code === 'same_password'
          ? 'Choose a password you haven’t used before.'
          : 'Your reset link has expired. Please request a new one.'
    }
  redirect('/account?updated=password')
}

export async function signOut() {
  if (accountsEnabled) {
    const supabase = await createClient()
    await supabase.auth.signOut()
  }
  redirect('/')
}
