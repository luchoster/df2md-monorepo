import { stegaClean } from 'next-sanity'
import { cn } from '@/lib/utils'

type Padding = { top?: string | null; bottom?: string | null } | null | undefined

const top: Record<string, string> = {
  none: 'pt-0',
  sm: 'pt-6',
  md: 'pt-10 md:pt-14',
  lg: 'pt-16 md:pt-24'
}
const bottom: Record<string, string> = {
  none: 'pb-0',
  sm: 'pb-6',
  md: 'pb-10 md:pb-14',
  lg: 'pb-16 md:pb-24'
}

/** Background tokens editors can pick (apps/cms/lib/constants.ts BACKGROUND_COLORS). */
export const backgrounds: Record<string, string> = {
  white: 'bg-white',
  surface: 'bg-footer',
  brand: 'bg-brand text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  'brand-light': 'bg-brand-light text-white [&_h2]:text-white [&_h3]:text-white',
  'brand-lime': 'bg-brand-lime text-ink-900',
  navy: 'bg-navy text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  sky: 'bg-sky text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  'sky-band': 'bg-sky-band text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  teal: 'bg-teal text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  ink: 'bg-ink text-white [&_h2]:text-white [&_h3]:text-white [&_a]:text-white',
  accent: 'bg-accent text-white [&_h2]:text-white [&_h3]:text-white',
  sun: 'bg-sun text-ink-900',
  'sun-soft': 'bg-sun-soft text-ink-900'
}

export function Section({
  padding,
  background,
  className,
  children,
  as: Tag = 'section',
  ...rest
}: {
  padding?: Padding
  background?: string | null
  className?: string
  children: React.ReactNode
  as?: 'section' | 'div'
} & React.HTMLAttributes<HTMLElement>) {
  const t = stegaClean(padding?.top) ?? 'md'
  const b = stegaClean(padding?.bottom) ?? 'md'
  const bg = backgrounds[stegaClean(background) ?? 'white'] ?? backgrounds.white
  return (
    <Tag className={cn(top[t] ?? top.md, bottom[b] ?? bottom.md, bg, className)} {...rest}>
      {children}
    </Tag>
  )
}
