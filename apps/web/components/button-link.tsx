import type { VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import { hrefFor, isExternal, type LinkValue } from '@/lib/links'
import { cn } from '@/lib/utils'

type Variant = VariantProps<typeof buttonVariants>['variant']
type Size = VariantProps<typeof buttonVariants>['size']
const VARIANTS = new Set([
  'default',
  'secondary',
  'dark',
  'outline',
  'ghost',
  'link',
  'destructive'
])

/** Sanity `link.buttonVariant` → a shadcn button variant ("default" = brand green). */
export const toVariant = (value: string | null | undefined): Variant =>
  value && VARIANTS.has(value) ? (value as Variant) : 'default'

/** Renders a Sanity `link` object as a button (or nothing when it has no destination). */
export function ButtonLink({
  link,
  children,
  className,
  size,
  variant
}: {
  link: LinkValue
  children?: React.ReactNode
  className?: string
  size?: Size
  variant?: Variant
}) {
  const href = hrefFor(link)
  if (!href) return null
  const classes = cn(
    buttonVariants({ variant: variant ?? toVariant(link?.buttonVariant), size }),
    'no-underline hover:no-underline',
    className
  )
  const label = children ?? link?.title
  if (isExternal(href) || link?.target)
    return (
      <a
        href={href}
        className={classes}
        target={link?.target ? '_blank' : undefined}
        rel="noopener"
      >
        {label}
      </a>
    )
  return (
    <Link href={href} className={classes}>
      {label}
    </Link>
  )
}
