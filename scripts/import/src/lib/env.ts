/** Environment for the import pipeline. Loaded by Bun from the repo-root .env automatically. */
function required(name: string): string {
  const value = process.env[name]
  if (!value) throw new Error(`Missing env var ${name} (see .env.example)`)
  return value
}

export const env = {
  sanity: {
    projectId: required('SANITY_PROJECT_ID'),
    dataset: process.env.SANITY_DATASET ?? 'staging',
    token: required('SANITY_API_WRITE_TOKEN'),
    apiVersion: '2026-09-01'
  },
  mysql: {
    host: process.env.WP_MYSQL_HOST ?? '127.0.0.1',
    port: Number(process.env.WP_MYSQL_PORT ?? 3307),
    user: process.env.WP_MYSQL_USER ?? 'root',
    password: process.env.WP_MYSQL_PASSWORD ?? 'local',
    database: process.env.WP_MYSQL_DATABASE ?? 'dog_food',
    tablePrefix: 'df_'
  }
} as const
