/** Public Sanity settings. The root .env is loaded by next.config.ts. */
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || process.env.SANITY_PROJECT_ID || 'rthdhol7'
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || process.env.SANITY_DATASET || 'production'
export const apiVersion = '2026-09-01'
