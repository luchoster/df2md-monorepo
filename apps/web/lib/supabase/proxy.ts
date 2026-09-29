import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { accountsEnabled, supabasePublishableKey, supabaseUrl } from './env'

/** Refreshes the auth cookies before account pages render (Server Components can't set cookies). */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })
  if (!accountsEnabled) return response

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value)
        response = NextResponse.next({ request })
        for (const { name, value, options } of cookiesToSet)
          response.cookies.set(name, value, options)
        for (const [key, value] of Object.entries(headers ?? {})) response.headers.set(key, value)
      }
    }
  })
  // Don't put code between createServerClient and getClaims: it refreshes an expired session
  await supabase.auth.getClaims()
  return response
}
