import type { EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { safeNext } from '@/lib/account/session'
import { accountsEnabled } from '@/lib/supabase/env'
import { createClient } from '@/lib/supabase/server'

/**
 * Where email links land (sign-up confirmation, password reset). Handles both the PKCE `code`
 * and the `token_hash` template styles, then continues to `next`.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const next = safeNext(searchParams.get('next'))
  if (!accountsEnabled) return NextResponse.redirect(new URL('/login', origin))

  const supabase = await createClient()
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
      : { error: new Error('missing token') }

  if (error) return NextResponse.redirect(new URL('/login?error=link', origin))
  return NextResponse.redirect(new URL(next, origin))
}
