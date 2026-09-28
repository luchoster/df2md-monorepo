import { createClient } from '@sanity/client'
import { argFlag, sanityEnv } from './env'

/** Write client for the import. Refuses `production` unless `--production` is passed. */
export function importClient() {
  const env = sanityEnv()
  if (env.dataset === 'production' && !argFlag('production'))
    throw new Error(
      'SANITY_DATASET=production: pass --production to confirm writing to the live dataset'
    )
  return createClient({ ...env, useCdn: false, perspective: 'raw' })
}
