import { createClient } from '@sanity/client'
import { sanityEnv } from './env'

/** Write client for the import. Targets `production` unless SANITY_DATASET says otherwise. */
export function importClient() {
  return createClient({ ...sanityEnv(), useCdn: false, perspective: 'raw' })
}
