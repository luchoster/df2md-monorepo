import { ButtonLink } from '@/components/button-link'
import { Badge } from '@/components/ui/badge'
import { featureIcons } from '../icons'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks Feature 17 (components/shadcnblocks/feature17.tsx) fed by Sanity. */
export default function FeatureGrid({
  label,
  heading,
  features,
  button,
  background,
  padding
}: BlockOf<'feature-grid'>) {
  return (
    <Section padding={padding} background={background}>
      <div className="container">
        <div className="mx-auto mb-12 flex max-w-3xl flex-col items-center gap-4 text-center">
          {label && (
            <Badge
              variant="secondary"
              className="bg-accent text-accent-foreground uppercase tracking-wide"
            >
              {label}
            </Badge>
          )}
          <h2 className="text-3xl tracking-tight text-pretty md:text-4xl lg:text-5xl">{heading}</h2>
        </div>
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          {features?.slice(0, 6).map((f) => {
            const Icon = featureIcons[f.icon ?? ''] ?? featureIcons['paw-print']!
            return (
              <div key={f._key} className="flex gap-5 md:block md:space-y-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary md:size-12">
                  <Icon className="size-5 md:size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg tracking-tight md:mb-2 md:text-xl">{f.title}</h3>
                  {f.description && (
                    <p className="text-muted-foreground md:text-base">{f.description}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        {button && (
          <div className="mt-14 flex justify-center">
            <ButtonLink link={button} size="lg" />
          </div>
        )}
      </div>
    </Section>
  )
}
