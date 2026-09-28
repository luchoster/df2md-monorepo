import { PortableText, type PortableTextComponents } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import Link from 'next/link'
import { isExternal } from '@/lib/links'
import { cn } from '@/lib/utils'
import { SanityImage, type SanityImageValue } from './sanity-image'

type TableValue = {
  headerRows?: number | null
  rows?: { _key: string; cells?: { _key: string; value?: PortableTextBlock[] }[] }[]
}

/** Cells hold ordinary Portable Text; render it inline so a cell doesn't get paragraph margins. */
const cellComponents: PortableTextComponents = {
  block: { normal: ({ children }) => <>{children}</> }
}

function Table({ value }: { value: TableValue }) {
  const header = Math.max(0, value.headerRows ?? 0)
  const rows = value.rows ?? []
  const head = rows.slice(0, header)
  const body = rows.slice(header)
  return (
    <div className="my-6 overflow-x-auto">
      {/* the old .feeding-guidelines look: full width, zebra rows, green header */}
      <table className="w-full border-collapse text-left text-sm md:text-base">
        {head.length > 0 && (
          <thead className="bg-brand text-white">
            {head.map((row) => (
              <tr key={row._key}>
                {row.cells?.map((cell) => (
                  <th
                    key={cell._key}
                    scope="col"
                    className="border border-line px-3 py-2 font-semibold"
                  >
                    <PortableText value={cell.value ?? []} components={cellComponents} />
                  </th>
                ))}
              </tr>
            ))}
          </thead>
        )}
        <tbody>
          {body.map((row) => (
            <tr key={row._key} className="odd:bg-footer">
              {row.cells?.map((cell) => (
                <td key={cell._key} className="border border-line px-3 py-2 align-top">
                  <PortableText value={cell.value ?? []} components={cellComponents} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const components: PortableTextComponents = {
  block: {
    normal: ({ children }) => <p>{children}</p>,
    h2: ({ children }) => <h2 className="mt-8 first:mt-0">{children}</h2>,
    h3: ({ children }) => <h3 className="mt-6 first:mt-0">{children}</h3>,
    h4: ({ children }) => <h4 className="mt-5 first:mt-0">{children}</h4>,
    blockquote: ({ children }) => (
      <blockquote className="my-6 border-l-4 border-brand pl-4 italic">{children}</blockquote>
    )
  },
  list: {
    bullet: ({ children }) => <ul className="mb-4 list-disc space-y-1 pl-6">{children}</ul>,
    number: ({ children }) => <ol className="mb-4 list-decimal space-y-1 pl-6">{children}</ol>
  },
  marks: {
    underline: ({ children }) => <span className="underline">{children}</span>,
    link: ({ value, children }) => {
      const href: string = value?.href ?? '#'
      if (isExternal(href) || value?.openInNewTab)
        return (
          <a href={href} target={value?.openInNewTab ? '_blank' : undefined} rel="noopener">
            {children}
          </a>
        )
      return <Link href={href}>{children}</Link>
    }
  },
  types: {
    image: ({ value }: { value: SanityImageValue }) => (
      <figure className="my-6">
        <SanityImage
          image={value}
          sizes="(min-width: 992px) 720px, 100vw"
          className="h-auto max-w-full"
        />
      </figure>
    ),
    table: Table
  }
}

export function PortableTextRenderer({
  value,
  className
}: {
  value: PortableTextBlock[] | null | undefined
  className?: string
}) {
  if (!value?.length) return null
  return (
    <div className={cn('[&>*:last-child]:mb-0', className)}>
      <PortableText value={value} components={components} />
    </div>
  )
}
