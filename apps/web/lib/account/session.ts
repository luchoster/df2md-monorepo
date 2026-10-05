import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { accountsEnabled } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/lib/supabase/types'

export type SessionUser = { id: string; email: string; emailConfirmed: boolean }

/** The signed-in customer (verified with the auth server), or null. Cached per request. */
export const getUser = cache(async (): Promise<SessionUser | null> => {
  if (!accountsEnabled) return null
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user?.email) return null
  return {
    id: data.user.id,
    email: data.user.email,
    emailConfirmed: Boolean(data.user.email_confirmed_at)
  }
})

/** For account pages: sends signed-out visitors to /login and back here afterwards. */
export async function requireUser(next: string) {
  const user = await getUser()
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`)
  return user
}

export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getUser()
  if (!user) return null
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  return (data as Profile | null) ?? null
})

/** Only same-site paths are allowed as a post-login destination. */
export function safeNext(
  value: FormDataEntryValue | string | null | undefined,
  fallback = '/account'
) {
  const next = typeof value === 'string' ? value : ''
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : fallback
}
