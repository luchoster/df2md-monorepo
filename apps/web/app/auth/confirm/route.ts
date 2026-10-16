import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { safeNext, setPasswordPath } from '@/lib/account/session'
import { accountsEnabled } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Where email links land (sign-up confirmation, password reset, sign-in link). Handles both the
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

  if (error || !data.user) return NextResponse.redirect(new URL('/login?error=link', origin))
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
