import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { safeNext, setPasswordPath } from '@/lib/account/session'
import { syncStripeEmail } from '@/lib/account/stripe-customer'
import { accountsEnabled } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Where email links land (sign-up confirmation, password reset, sign-in link, email change). Handles both the
 * PKCE `code` and the `token_hash` template styles, then continues to `next`, by way of
 * /set-password for customers who haven't chosen one yet.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNext(searchParams.get('next'))
  if (!accountsEnabled) return NextResponse.redirect(new URL('/login', origin))

  const supabase = await createClient()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { data: { user: null }, error: new Error('missing token') }

  // Email change while "Secure email change" is on: the current and the new address each get a
  // link, and the first one opened only records it (no user comes back) until the other is too
  if (type === 'email_change' && !error && !data.user) {
    const { data: current } = await supabase.auth.getUser()
    return NextResponse.redirect(
      new URL(
        current.user
          ? '/account/security?updated=email-pending'
          : '/login?notice=email-pending&next=%2Faccount%2Fsecurity',
        origin
      )
    )
  }
  if (error || !data.user) return NextResponse.redirect(new URL('/login?error=link', origin))
  if (type === 'email_change') {
    if (data.user.email) await syncStripeEmail(data.user.id, data.user.email)
    return NextResponse.redirect(new URL('/account/security?updated=email', origin))
  }
  // A password reset lands on /reset-password, which sets one anyway
  if (type !== 'recovery' && !next.startsWith('/reset-password')) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('password_set')
      .eq('id', data.user.id)
      .maybeSingle()
    if (profile && !profile.password_set)
      return NextResponse.redirect(new URL(setPasswordPath(next), origin))
  }
  return NextResponse.redirect(new URL(next, origin))
}
