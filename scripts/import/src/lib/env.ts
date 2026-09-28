import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const ROOT = join(import.meta.dir, '..', '..')
const REPO_ROOT = join(ROOT, '..', '..')

/**
 * Bun only auto-loads the .env of the directory it runs in (scripts/import), so load the
 * repo-root .env explicitly. Variables already set in the shell win.
 */
function loadRootEnv() {
  const path = join(REPO_ROOT, '.env')
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/.exec(line)
    if (!m) continue
    let value = (m[2] ?? '').trim()
    if (/^(['"]).*\1$/.test(value)) value = value.slice(1, -1)
    else value = value.replace(/\s+#.*$/, '')
    if (process.env[m[1]!] === undefined) process.env[m[1]!] = value
  }
}
loadRootEnv()

/** Environment for the import pipeline. */
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name} (see .env.example)`)
  return value
}

export const OUT_DIR = join(ROOT, 'out')
export const UPLOADS_DIR = process.env.WP_UPLOADS_DIR ?? join(ROOT, 'uploads')
/** ~/Sites/dogfood/backups sits next to the repo, not inside it. */
export const DUMP_PATH =
  process.env.WP_DUMP ?? join(ROOT, '..', '..', '..', 'backups', 'backup-2026-09-19-db.sql.gz')
export const TABLE_PREFIX = process.env.WP_TABLE_PREFIX ?? 'df_'

/** Sanity settings are only read by the steps that talk to Sanity. */
export const sanityEnv = () => ({
  projectId: required('SANITY_PROJECT_ID'),
  dataset: process.env.SANITY_DATASET ?? 'production',
  token: required('SANITY_API_WRITE_TOKEN'),
  apiVersion: '2026-09-01'
})

export const argFlag = (name: string) => process.argv.includes(`--${name}`)
export const argValue = (name: string) => {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
