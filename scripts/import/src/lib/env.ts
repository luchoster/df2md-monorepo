import { join } from 'node:path'

/** Environment for the import pipeline. Bun loads the repo-root .env automatically. */
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name} (see .env.example)`)
  return value
}

export const ROOT = join(import.meta.dir, '..', '..')
export const OUT_DIR = join(ROOT, 'out')
export const UPLOADS_DIR = process.env.WP_UPLOADS_DIR ?? join(ROOT, 'uploads')
/** ~/Sites/dogfood/backups sits next to the repo, not inside it. */
export const DUMP_PATH =
  process.env.WP_DUMP ?? join(ROOT, '..', '..', '..', 'backups', 'backup-2026-09-19-db.sql.gz')
export const TABLE_PREFIX = process.env.WP_TABLE_PREFIX ?? 'df_'

/** Sanity settings are only read by the steps that talk to Sanity. */
export const sanityEnv = () => ({
  projectId: required('SANITY_PROJECT_ID'),
  dataset: process.env.SANITY_DATASET ?? 'staging',
  token: required('SANITY_API_WRITE_TOKEN'),
  apiVersion: '2026-09-01'
})

export const argFlag = (name: string) => process.argv.includes(`--${name}`)
export const argValue = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
