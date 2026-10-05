import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'
import { createGunzip } from 'node:zlib'

export type Row = Record<string, string | null>
export type Tables = Record<string, Row[]>

/**
 * Streams a mysqldump (.sql or .sql.gz) and returns the requested tables as row objects keyed by
 * column name. Column names come from the dump's own `CREATE TABLE`, so nothing is hard-coded.
 * Handles MySQL string escapes properly (\n, \r, \t, \0, \Z, \\, \', \").
 */
export async function readDump(path: string, wanted: string[]): Promise<Tables> {
  const want = new Set(wanted)
  const columns: Record<string, string[]> = {}
  const tables: Tables = Object.fromEntries(wanted.map((t) => [t, []]))
  let creating: { table: string; cols: string[] } | null = null

  const input = createReadStream(path)
  const stream = path.endsWith('.gz') ? input.pipe(createGunzip()) : input
  const lines = createInterface({ input: stream, crlfDelay: Number.POSITIVE_INFINITY })

  for await (const line of lines) {
    if (creating) {
      const col = /^\s*`([^`]+)`\s/.exec(line)
      if (col) creating.cols.push(col[1]!)
      else if (/^\)/.test(line)) {
        columns[creating.table] = creating.cols
        creating = null
      }
      continue
    }
    const create = /^CREATE TABLE `([^`]+)`/.exec(line)
    if (create) {
      if (want.has(create[1]!)) creating = { table: create[1]!, cols: [] }
      continue
    }
    const insert = /^INSERT INTO `([^`]+)`(?: \([^)]*\))? VALUES /.exec(line)
    if (!insert || !want.has(insert[1]!)) continue
    const table = insert[1]!
    const cols = columns[table]
    if (!cols) throw new Error(`INSERT for ${table} before its CREATE TABLE`)
    for (const values of parseValues(line, insert[0].length)) {
      if (values.length !== cols.length)
        throw new Error(`${table}: row has ${values.length} values, expected ${cols.length}`)
      const row: Row = {}
      cols.forEach((c, i) => {
        row[c] = values[i]!
      })
      tables[table]!.push(row)
    }
  }
  return tables
}

const ESCAPES: Record<string, string> = {
  '0': '\0',
  n: '\n',
  r: '\r',
  t: '\t',
  Z: '\x1a',
  b: '\b'
}

/** Parses `(…),(…);` tuples starting at `start`. Exported for tests. */
export function parseValues(s: string, start = 0): (string | null)[][] {
  const rows: (string | null)[][] = []
  let i = start
  const n = s.length
  while (i < n) {
    if (s[i] !== '(') {
      i++
      continue
    }
    i++
    const row: (string | null)[] = []
    for (;;) {
      while (s[i] === ' ' || s[i] === '\n') i++
      if (s[i] === "'") {
        i++
        let buf = ''
        let chunk = i
        for (;;) {
          const c = s[i]
          if (c === undefined) throw new Error('Unterminated string in dump')
          if (c === '\\') {
            buf += s.slice(chunk, i)
            const e = s[i + 1]!
            buf += ESCAPES[e] ?? e
            i += 2
            chunk = i
            continue
          }
          if (c === "'") {
            if (s[i + 1] === "'") {
              buf += s.slice(chunk, i + 1)
              i += 2
              chunk = i
              continue
            }
            buf += s.slice(chunk, i)
            i++
            break
          }
          i++
        }
        row.push(buf)
      } else {
        let j = i
        while (s[j] !== ',' && s[j] !== ')') j++
        const tok = s.slice(i, j).trim()
        row.push(tok === 'NULL' ? null : tok)
        i = j
      }
      if (s[i] === ',') {
        i++
        continue
      }
      if (s[i] === ')') {
        i++
        break
      }
    }
    rows.push(row)
  }
  return rows
}
