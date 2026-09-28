import type React from 'react'
import { cn } from '@/lib/utils'

type DataItem = {
  id: number
  title: string
  description: string
}

const DATA: DataItem[] = [
  {
    id: 1,
    title: 'Step 1: Plan Your Strategy',
    description: 'Define your goals and create a roadmap to achieve them efficiently.'
  },
  {
    id: 2,
    title: 'Step 2: Execute Your Plan',
    description: 'Implement your strategy with precision and monitor progress in real-time.'
  },
  {
    id: 3,
    title: 'Step 3: Review and Improve',
    description: 'Analyze results, gather feedback, and refine your approach for better outcomes.'
  }
]

type StepItemProps = {
  step: DataItem
  isLast: boolean
  className?: string
}

const StepItem: React.FC<StepItemProps> = ({ step, isLast, className }) => {
  return (
    <div className={cn('max-lg:flex max-lg:gap-4', className)}>
      <div className="relative lg:py-6">
        <div
          className={`absolute h-full w-1 -translate-x-1/2 translate-y-11 bg-muted/50 bg-linear-to-b max-lg:left-1/2 lg:top-1/2 lg:h-1 lg:w-full lg:translate-x-6 lg:-translate-y-1/2 lg:bg-linear-to-r ${
            isLast ? 'from-muted/50 to-white' : ''
          }`}
        />
        <div className="relative z-0 grid size-11 place-content-center rounded-full border-4 bg-background">
          <p className="text-lg font-bold">{step.id}</p>
        </div>
      </div>
      <div className="max-lg:mt-2">
        <p className="text-lg font-semibold text-black">{step.title}</p>
        <p className="mt-2 text-muted-foreground">{step.description}</p>
      </div>
    </div>
  )
}

interface Feature187Props {
  className?: string
}

const Feature187 = ({ className }: Feature187Props) => {
  return (
    <section className={cn('py-32', className)}>
      <div className="container">
        <div>
          <h2 className="text-4xl font-medium sm:text-5xl lg:text-6xl">
            Achieve Success with Ease
          </h2>
          <p className="mt-8 text-muted-foreground md:text-lg">
            Follow our proven steps to streamline your workflow and achieve your goals with
            confidence.
          </p>
        </div>
        <div className="mt-12 grid gap-10 lg:grid-cols-3 lg:gap-6">
          {DATA.map((step, index) => (
            <StepItem key={step.id} step={step} isLast={index === DATA.length - 1} />
          ))}
        </div>
      </div>
    </section>
  )
}

export { Feature187 }
