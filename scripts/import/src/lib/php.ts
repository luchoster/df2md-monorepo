/**
 * Minimal PHP `unserialize` for WordPress meta (arrays, strings, ints, floats, bools, null).
 * String lengths in PHP serialization are UTF-8 byte counts, so parsing works on bytes.
 * Arrays become plain objects; use `phpList` when you want the values in order.
 */
export type PhpValue = string | number | boolean | null | { [key: string]: PhpValue }

export function unserialize(input: string): PhpValue {
  const buf = Buffer.from(input, 'utf8')
  let pos = 0

  const readUntil = (ch: string) => {
    const end = buf.indexOf(ch, pos)
    if (end < 0) throw new Error(`php unserialize: expected "${ch}" at ${pos}`)
    const out = buf.toString('utf8', pos, end)
    pos = end + 1
    return out
  }
  const expect = (ch: string) => {
    if (String.fromCharCode(buf[pos]!) !== ch)
      throw new Error(`php unserialize: expected "${ch}" at ${pos}`)
    pos++
  }

  const read = (): PhpValue => {
    const type = String.fromCharCode(buf[pos]!)
    pos += 2 // type + ':' (or ';' for N)
    switch (type) {
      case 'N':
        return null
      case 'b':
        return readUntil(';') === '1'
      case 'i':
        return Number.parseInt(readUntil(';'), 10)
      case 'd':
        return Number.parseFloat(readUntil(';'))
      case 's': {
        const len = Number.parseInt(readUntil(':'), 10)
        expect('"')
        const out = buf.toString('utf8', pos, pos + len)
        pos += len
        expect('"')
        expect(';')
        return out
      }
      case 'a': {
        const count = Number.parseInt(readUntil(':'), 10)
        expect('{')
        const out: Record<string, PhpValue> = {}
        for (let k = 0; k < count; k++) {
          const key = read()
          out[String(key)] = read()
        }
        expect('}')
        return out
      }
      default:
        throw new Error(`php unserialize: unsupported type "${type}" at ${pos - 2}`)
    }
  }

  return read()
}

/** Returns `undefined` instead of throwing (WP meta is often not serialized at all). */
export function tryUnserialize(input: string | null | undefined): PhpValue | undefined {
  if (!input || !/^[aibdsN][:;]/.test(input)) return undefined
  try {
    return unserialize(input)
  } catch {
    return undefined
  }
}

export const phpList = (value: PhpValue | undefined): PhpValue[] =>
  value && typeof value === 'object' ? Object.values(value) : []
