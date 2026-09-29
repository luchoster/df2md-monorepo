import type { NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

export function proxy(request: NextRequest) {
  return updateSession(request)
}

// Only the pages that read the session; the catalog stays static
export const config = {
  matcher: [
    '/account/:path*',
    '/login',
    '/register',
    '/reset-password',
    '/checkout',
    '/auth/:path*'
  ]
}
