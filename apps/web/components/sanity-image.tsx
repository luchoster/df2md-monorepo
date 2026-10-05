import { Image } from 'next-sanity/image'
import { cn } from '@/lib/utils'
import { urlFor } from '@/sanity/lib/image'

export type SanityImageValue =
  | {
      asset?: {
        _id: string
        url: string | null
        metadata?: {
          lqip?: string | null
          dimensions?: { width?: number | null; height?: number | null } | null
        } | null
      } | null
      alt?: string | null
      hotspot?: { x?: number | null; y?: number | null } | null
      crop?: unknown
    }
  | null
  | undefined

type Props = {
  image: SanityImageValue
  alt?: string
  className?: string
  sizes?: string
  priority?: boolean
  /** Fill the (positioned) parent; object-position follows the editor's hotspot. */
  fill?: boolean
  width?: number
  height?: number
}

/**
 * Every storefront image goes through here: Sanity CDN loader (auto WebP/AVIF, responsive
 * srcSet), editor crop via the URL builder, hotspot via object-position, LQIP blur placeholder.
 */
export function SanityImage({
  image,
  alt,
  className,
  sizes,
  priority,
  fill,
  width,
  height
}: Props) {
  if (!image?.asset?._id) return null
  const src = urlFor(image as never).url()
  const dims = image.asset.metadata?.dimensions
  const lqip = image.asset.metadata?.lqip ?? undefined
  const objectPosition = image.hotspot
    ? `${(image.hotspot.x ?? 0.5) * 100}% ${(image.hotspot.y ?? 0.5) * 100}%`
    : undefined
  const common = {
    src,
    alt: alt ?? image.alt ?? '',
    sizes,
    priority,
    placeholder: lqip ? ('blur' as const) : ('empty' as const),
    blurDataURL: lqip,
    style: objectPosition ? { objectPosition } : undefined
  }
  if (fill) return <Image {...common} fill className={cn('object-cover', className)} />
  return (
    <Image
      {...common}
      width={width ?? dims?.width ?? 800}
      height={height ?? dims?.height ?? 600}
      className={className}
    />
  )
}
