'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderIcon } from 'lucide-react'
import { useId, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { cn } from '@/lib/utils'

import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface Button {
  text: string
  url: string
  icon?: React.ReactNode
}
interface Logo {
  src: string
  alt: string
  srcDark?: string
  className?: string
}

interface ForgotPasswordFormProps {
  logo?: Logo & { url?: string }
  heading: string
  description: string
  emailLabel?: string
  emailPlaceholder?: string
  button: Button
  backLink?: Button
  successMessage: string
  submittingLabel: string
  className?: string
}

interface ForgotPassword1Props extends ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordFormData) => Promise<void>
}
type Props = Partial<ForgotPassword1Props>

const defaultProps: ForgotPassword1Props = {
  logo: {
    src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg',
    alt: 'shadcnblocks',
    url: 'https://www.shadcnblocks.com'
  },
  heading: 'Forgot your password?',
  description:
    'Enter the email on your account and we will send a reset link if it matches a workspace.',
  emailLabel: 'Email',
  emailPlaceholder: 'you@company.com',
  button: {
    text: 'Send reset link',
    url: '#'
  },
  backLink: {
    text: 'Back to login',
    url: '#'
  },
  successMessage: 'If that email matches a workspace, a reset link is on its way.',
  submittingLabel: 'Sending…'
}

const forgotPasswordSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email')
})

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>

const ForgotPassword1 = (props: Props) => {
  const {
    logo,
    heading,
    description,
    emailLabel,
    emailPlaceholder,
    button,
    backLink,
    successMessage,
    submittingLabel,
    className,
    onSubmit
  } = {
    ...defaultProps,
    ...props
  }

  const emailId = useId()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { email: '' }
  })

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log('Forgot password submitted:', data)
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      setIsSubmitted(true)
      form.reset()
    } catch {
      form.setError('root', {
        message: 'Something went wrong. Please try again.'
      })
    }
  }

  return (
    <section className={cn('h-svh max-h-[1200px] min-h-[600px] w-full bg-muted', className)}>
      <div className="flex h-full items-center justify-center px-6">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">
          {logo && (
            <a href={logo.url ?? '#'}>
              <img src={logo.src} alt={logo.alt} className="h-8 dark:invert" />
            </a>
          )}
          <div className="flex w-full flex-col gap-5 rounded-lg border bg-background p-6 shadow-xs">
            <div className="flex flex-col gap-2 text-center">
              <h1 className="text-xl font-semibold">{heading}</h1>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {isSubmitted ? (
              <div
                role="status"
                aria-live="polite"
                className="rounded-lg bg-muted px-4 py-3 text-center text-sm font-medium"
              >
                {successMessage}
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(handleFormSubmit)} className="flex flex-col gap-5">
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={emailId}>{emailLabel}</FieldLabel>
                      <Input
                        {...field}
                        id={emailId}
                        type="email"
                        placeholder={emailPlaceholder}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                {form.formState.errors.root && (
                  <p className="text-sm text-destructive">{form.formState.errors.root.message}</p>
                )}
                <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <LoaderIcon className="size-4 animate-spin" aria-hidden />
                  ) : null}
                  {form.formState.isSubmitting ? submittingLabel : button.text}
                </Button>
              </form>
            )}
          </div>
          {backLink && (
            <a href={backLink.url} className="text-sm font-medium text-primary hover:underline">
              {backLink.text}
            </a>
          )}
        </div>
      </div>
    </section>
  )
}

export { ForgotPassword1 }
