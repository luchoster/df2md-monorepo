import { cva, type VariantProps } from 'class-variance-authority'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { hrefFor, isExternal, type LinkValue } from '@/lib/links'
import { cn } from '@/lib/utils'

/** Bootstrap 4 `.btn` as the old site styled it: 4px radius, 6×12 padding, bold 16px. */
export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded border px-3 py-1.5 font-sans text-base font-bold leading-normal no-underline transition-colors duration-150 ease-in-out hover:no-underline disabled:pointer-events-none disabled:opacity-65',
  {
    variants: {
      variant: {
        default: 'border-brand bg-brand text-white hover:border-brand-dark hover:bg-brand-dark',
        secondary: 'border-sky bg-navy text-white hover:bg-sky',
        dark: 'border-brand-dark bg-brand-dark uppercase text-white hover:bg-brand',
        outline: 'border-brand bg-transparent text-brand hover:bg-brand hover:text-white',
        link: 'border-transparent bg-transparent px-0 text-link underline-offset-4 hover:underline'
      },
      size: {
        default: '',
        lg: 'px-4 py-2 text-xl',
        sm: 'px-2 py-1 text-sm',
        block: 'w-full'
      }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)

type Variant = VariantProps<typeof buttonVariants>['variant']
const VARIANTS = new Set(['default', 'secondary', 'dark', 'outline', 'link'])
export const toVariant = (value: string | null | undefined): Variant =>
  value && VARIANTS.has(value) ? (value as Variant) : 'default'

export function Button({
  className,
  variant,
  size,
  ...props
}: ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  return <button className={cn(buttonVariants({ variant, size }), className)} {...props} />
}

/** Renders a Sanity `link` object as a button (or nothing when it has no destination). */
export function ButtonLink({
  link,
  children,
  className,
  size
}: { link: LinkValue; children?: React.ReactNode; className?: string } & Pick<
  VariantProps<typeof buttonVariants>,
  'size'
>) {
  const href = hrefFor(link)
  if (!href) return null
  const classes = cn(buttonVariants({ variant: toVariant(link?.buttonVariant), size }), className)
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
