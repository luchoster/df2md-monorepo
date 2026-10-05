import { ButtonLink } from '@/components/button-link'
import { cn } from '@/lib/utils'
import { Section } from '../section'
import type { BlockOf } from '../types'

/** shadcnblocks Feature 187 (numbered steps with a connector line) fed by Sanity. */
export default function Steps({
  heading,
  description,
  steps,
  button,
  background,
  padding
}: BlockOf<'steps'>) {
  const list = steps ?? []
  return (
    <Section padding={padding} background={background}>
      <div className="container">
        <div className="max-w-3xl">
          <h2 className="text-3xl tracking-tight sm:text-4xl lg:text-5xl">{heading}</h2>
          {description && <p className="mt-5 text-muted-foreground md:text-lg">{description}</p>}
        </div>
        <ol
          className={cn(
            'mt-12 grid gap-10 lg:gap-6',
            list.length === 4
              ? 'lg:grid-cols-4'
              : list.length === 2
                ? 'lg:grid-cols-2'
                : 'lg:grid-cols-3'
          )}
        >
          {list.map((step, i) => {
            const last = i === list.length - 1
            return (
              <li key={step._key} className="max-lg:flex max-lg:gap-4">
                <div className="relative lg:py-6">
                  {!last && (
                    <div
                      aria-hidden
                      className="absolute h-full w-1 -translate-x-1/2 translate-y-11 bg-linear-to-b from-primary/40 to-primary/10 max-lg:left-1/2 lg:top-1/2 lg:h-1 lg:w-full lg:translate-x-6 lg:-translate-y-1/2 lg:bg-linear-to-r"
                    />
                  )}
                  <div className="relative z-0 grid size-11 place-content-center rounded-full border-4 border-primary/30 bg-background">
                    <span className="font-display text-lg font-bold text-primary">{i + 1}</span>
                  </div>
                </div>
                <div className="max-lg:mt-2">
                  <h3 className="text-lg">{step.title}</h3>
                  {step.description && (
                    <p className="mt-2 text-muted-foreground">{step.description}</p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
        {button && <ButtonLink link={button} size="lg" className="mt-12" />}
      </div>
    </Section>
  )
}
