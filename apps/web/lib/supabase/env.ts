/**
 * Supabase settings. The publishable key is safe in the browser; the secret key is server-only
 * and bypasses row-level security (used by the Stripe webhook to write orders). Older projects
 * can use the legacy anon / service_role names instead.
 */
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
export const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

/** Customer accounts are switched off (pages say so) until the URL and publishable key are set. */
export const accountsEnabled = Boolean(supabaseUrl && supabasePublishableKey)
