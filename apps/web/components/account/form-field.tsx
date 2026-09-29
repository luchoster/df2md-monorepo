import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** Label + input + inline error, wired for screen readers. */
export function FormField({
  name,
  label,
  error,
  className,
  hint,
  ...input
}: React.ComponentProps<typeof Input> & {
  name: string
  label: string
  error?: string
  hint?: React.ReactNode
}) {
  const id = input.id ?? `f-${name}`
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        {hint}
      </div>
      <Input
        id={id}
        name={name}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...input}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  )
}

export function FormMessage({
  tone = 'error',
  children
}: {
  tone?: 'error' | 'success'
  children: React.ReactNode
}) {
  return (
    <p
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md px-3 py-2 text-sm',
        tone === 'error' ? 'bg-destructive/10 text-destructive' : 'bg-brand/10 text-brand-dark'
      )}
    >
      {children}
    </p>
  )
}
