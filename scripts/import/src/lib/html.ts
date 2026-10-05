import { randomUUID } from 'node:crypto'
import { htmlToBlocks } from '@portabletext/block-tools'
import { Schema } from '@sanity/schema'
import { builtinTypes } from '@sanity/schema/_internal'
import { JSDOM } from 'jsdom'
import blockContent from '../../../../apps/cms/schemaTypes/objects/block-content'
import simpleContent from '../../../../apps/cms/schemaTypes/objects/simple-content'
import table from '../../../../apps/cms/schemaTypes/objects/table'

/**
 * WordPress HTML → Portable Text, validated against the Studio's own `block-content` and
 * `simple-content` types so only styles/marks the Studio allows survive.
 *
 * Images are emitted as `{ _type: 'image', _wpImage: { attachmentId?, src } }` placeholders;
 * 03-load uploads them and swaps in the asset reference.
 */

const schema = Schema.compile({
  name: 'import',
  types: [
    ...builtinTypes,
    blockContent,
    simpleContent,
    table,
    {
      name: 'holder',
      type: 'object',
      fields: [
        { name: 'rich', type: 'block-content' },
        { name: 'simple', type: 'simple-content' }
      ]
    }
  ]
})
const holder = schema.get('holder')
const richType = holder.fields.find((f: any) => f.name === 'rich').type
const simpleType = holder.fields.find((f: any) => f.name === 'simple').type
const cellType = schema
  .get('table')
  .fields.find((f: any) => f.name === 'rows')
  .type.of[0].fields.find((f: any) => f.name === 'cells')
  .type.of[0].fields.find((f: any) => f.name === 'value').type

const key = () => randomUUID().replace(/-/g, '').slice(0, 12)
// One window for the whole run: a JSDOM per field made the transform ~10× slower.
const parser = new new JSDOM('').window.DOMParser()
const parseHtml = (html: string) => parser.parseFromString(html, 'text/html')

export type Warning = { where: string; message: string }

// ---------------------------------------------------------------- WordPress cleanup

const attr = (attrs: string, name: string) => {
  const m = new RegExp(`${name}="([^"]*)"`).exec(attrs)
  return m ? m[1]! : ''
}
const vcLink = (raw: string) => {
  // WPBakery links look like url:%2Fshop|title:…|target:…
  const url = /url:([^|]*)/.exec(raw)?.[1]
  return url ? decodeURIComponent(url) : ''
}

/** Expands the WPBakery shortcodes that carry content and strips the layout ones. */
export function stripShortcodes(html: string): string {
  return (
    html
      // [vc_raw_html]BASE64(rawurlencode(html))[/vc_raw_html]
      .replace(/\[vc_raw_html[^\]]*\]([\s\S]*?)\[\/vc_raw_html\]/g, (_, b64: string) => {
        try {
          return decodeURIComponent(Buffer.from(b64.trim(), 'base64').toString('utf8'))
        } catch {
          return ''
        }
      })
      .replace(/\[vc_custom_heading([^\]]*)\]/g, (_, attrs: string) => {
        const tag = /tag:(h[1-6]|p|div)/.exec(attr(attrs, 'font_container'))?.[1] ?? 'h2'
        const level = tag.startsWith('h') ? `h${Math.max(2, Number(tag[1]))}` : 'p'
        const text = attr(attrs, 'text')
        const href = vcLink(attr(attrs, 'link'))
        const inner = href ? `<a href="${href}">${text}</a>` : text
        return `\n\n<${level}>${inner}</${level}>\n\n`
      })
      .replace(/\[vc_btn([^\]]*)\]/g, (_, attrs: string) => {
        const href = vcLink(attr(attrs, 'link'))
        const title = attr(attrs, 'title')
        return href ? `\n\n<p><a href="${href}">${title}</a></p>\n\n` : ''
      })
      .replace(/\[vc_single_image([^\]]*)\]/g, (_, attrs: string) => {
        const id = attr(attrs, 'image')
        return id ? `\n\n<img data-wp-attachment="${id}" />\n\n` : ''
      })
      .replace(/\[vc_gallery([^\]]*)\]/g, (_, attrs: string) =>
        attr(attrs, 'images')
          .split(',')
          .filter(Boolean)
          .map((id) => `\n\n<img data-wp-attachment="${id.trim()}" />\n\n`)
          .join('')
      )
      .replace(/\[vc_video([^\]]*)\]/g, (_, attrs: string) => {
        const link = attr(attrs, 'link')
        return link ? `\n\n<p><a href="${link}">${link}</a></p>\n\n` : ''
      })
      // Layout-only shortcodes; content between them is kept.
      .replace(/\[\/?vc_[a-z_]+[^\]]*\]/g, '\n\n')
  )
}

const BLOCK_TAGS =
  'table|thead|tfoot|caption|col|colgroup|tbody|tr|td|th|div|dl|dd|dt|ul|ol|li|pre|form|map|area|blockquote|address|math|style|p|h[1-6]|hr|fieldset|legend|section|article|aside|hgroup|header|footer|nav|figure|figcaption|details|menu|summary|img'

/** A pragmatic port of WordPress `wpautop`: blank lines → paragraphs, single newlines → <br>. */
export function wpautop(input: string): string {
  let html = input.replace(/\r\n?/g, '\n').trim()
  if (!html) return ''
  const blockOpen = new RegExp(`(<(?:${BLOCK_TAGS})[\\s/>])`, 'gi')
  const blockClose = new RegExp(`(</(?:${BLOCK_TAGS})>)`, 'gi')
  html = html.replace(blockOpen, '\n\n$1').replace(blockClose, '$1\n\n')
  const chunks = html
    .split(/\n\s*\n/)
    .map((c) => c.trim())
    .filter(Boolean)
  const isBlock = new RegExp(`^</?(?:${BLOCK_TAGS})[\\s/>]`, 'i')
  return (
    chunks
      .map((chunk) => {
        if (isBlock.test(chunk)) return chunk
        return `<p>${chunk.replace(/\n/g, '<br />\n')}</p>`
      })
      .join('\n')
      // Inside table cells and list items keep line breaks as spaces
      .replace(/<(td|th|li)([^>]*)>\s*<p>([\s\S]*?)<\/p>\s*<\/\1>/gi, '<$1$2>$3</$1>')
  )
}

/** Everything a WP HTML field needs before it becomes Portable Text. */
export const prepareWpHtml = (html: string | null | undefined) =>
  wpautop(stripShortcodes(html ?? ''))

// ---------------------------------------------------------------- HTML → Portable Text

type Block = Record<string, any>

function cellBlocks(el: Element): Block[] {
  const html = el.innerHTML.trim()
  if (!html) return [emptyBlock()]
  const blocks = (
    htmlToBlocks(`<p>${html.replace(/<\/?(p|div|h[1-6])[^>]*>/gi, ' ')}</p>`, cellType, {
      parseHtml,
      keyGenerator: key
    }) as Block[]
  ).filter((b) => b._type === 'block')
  return blocks.length ? blocks : [emptyBlock()]
}

function emptyBlock(): Block {
  return {
    _type: 'block',
    _key: key(),
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: key(), text: '', marks: [] }]
  }
}

function tableFromElement(el: Element): Block | null {
  const rows = Array.from(el.querySelectorAll('tr'))
  if (!rows.length) return null
  const first = rows[0]!
  const firstCells = Array.from(first.children)
  const header =
    !!el.querySelector('thead') ||
    (firstCells.length > 0 && firstCells.every((c) => c.tagName === 'TH')) ||
    first.classList.contains('th2') ||
    firstCells.some((c) => c.classList.contains('th2'))
  const width = Math.max(...rows.map((r) => r.children.length))
  return {
    _type: 'table',
    _key: key(),
    headerRows: header ? 1 : 0,
    rows: rows.map((tr) => {
      const cells = Array.from(tr.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH')
      // colspans are flattened: pad short rows so the grid stays rectangular
      while (cells.length < width) cells.push(tr.ownerDocument.createElement('td'))
      return {
        _type: 'row',
        _key: key(),
        cells: cells.map((cell) => ({ _type: 'cell', _key: key(), value: cellBlocks(cell) }))
      }
    })
  }
}

function imagePlaceholder(el: Element): Block | null {
  const attachmentId = Number(el.getAttribute('data-wp-attachment')) || undefined
  const src = el.getAttribute('src') ?? undefined
  if (!attachmentId && !src) return null
  return {
    _type: 'image',
    _key: key(),
    alt: el.getAttribute('alt') || undefined,
    _wpImage: { attachmentId, src }
  }
}

const drop = (s: string) => s.replace(/ /g, ' ')

/** Removes empty text blocks and trims whitespace-only spans left over from WP markup. */
function tidy(blocks: Block[]): Block[] {
  return blocks.filter((b) => {
    if (b._type !== 'block') return true
    const text = (b.children ?? []).map((c: Block) => c.text ?? '').join('')
    b.children = b.children.map((c: Block) =>
      typeof c.text === 'string' ? { ...c, text: drop(c.text) } : c
    )
    return text.trim().length > 0
  })
}

export function htmlToRich(
  html: string | null | undefined,
  where: string,
  warnings: Warning[]
): Block[] {
  const prepared = prepareWpHtml(html)
  if (!prepared.trim()) return []
  const blocks = htmlToBlocks(prepared, richType, {
    parseHtml,
    keyGenerator: key,
    rules: [
      {
        deserialize(el: any, _next: any, createBlock: any) {
          const tag = el.tagName?.toLowerCase()
          if (tag === 'table') {
            const t = tableFromElement(el)
            if (!t) warnings.push({ where, message: 'table without rows dropped' })
            return t ? createBlock(t) : undefined
          }
          if (tag === 'img') {
            const img = imagePlaceholder(el)
            return img ? createBlock(img) : undefined
          }
          // WP editors used <style>/<script>/<iframe> occasionally; never keep them
          if (tag === 'style' || tag === 'script' || tag === 'iframe' || tag === 'form') {
            warnings.push({ where, message: `<${tag}> dropped` })
            return createBlock({ _type: '__drop' })
          }
          return undefined
        }
      }
    ]
  }) as Block[]
  return tidy(blocks.filter((b) => b._type !== '__drop'))
}

export function textToSimple(text: string | null | undefined): Block[] {
  const t = (text ?? '').trim()
  if (!t) return []
  return tidy(htmlToBlocks(wpautop(t), simpleType, { parseHtml, keyGenerator: key }) as Block[])
}

export function htmlToPlainText(html: string | null | undefined): string {
  const t = prepareWpHtml(html)
  if (!t) return ''
  return (parseHtml(`<body>${t}</body>`).body.textContent ?? '').replace(/\s+/g, ' ').trim()
}
