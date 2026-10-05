/** Parses a host or URL from the environment; adds https:// when the scheme is missing. */
function parse(value: string | undefined | null): URL | null {
  const v = value?.trim()
  if (!v) return null
  try {
    return new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`)
  } catch {
    return null
  }
}

/**
 * The site's public origin, without a trailing slash. Nothing is hardcoded: it is
 * NEXT_PUBLIC_SITE_URL (a bare host like `df2md.zera.us` is fine), else the host Vercel assigns
 * to this deployment, else the caller's fallback (e.g. the request origin), else localhost.
 * Never throws, so a bad value can't break the build.
 */
export function siteOrigin(fallback?: string): string {
  const url =
    parse(process.env.NEXT_PUBLIC_SITE_URL) ??
    parse(process.env.VERCEL_PROJECT_PRODUCTION_URL) ??
    parse(process.env.VERCEL_URL) ??
    parse(fallback) ??
    new URL('http://localhost:3000')
  return url.origin
}

/** Same as siteOrigin, as a URL for Next's `metadataBase`. */
export const siteUrl = () => new URL(siteOrigin())
