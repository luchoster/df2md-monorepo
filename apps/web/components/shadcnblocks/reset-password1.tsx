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

interface ResetPasswordFormProps {
  logo?: Logo & { url?: string }
  heading: string
  description: string
  passwordLabel?: string
  confirmLabel?: string
  passwordPlaceholder?: string
  confirmPlaceholder?: string
  button: Button
  backLink?: Button
  successMessage: string
  submittingLabel: string
  className?: string
}

interface ResetPassword1Props extends ResetPasswordFormProps {
  onSubmit?: (data: ResetPasswordFormData) => Promise<void>
}
type Props = Partial<ResetPassword1Props>

const defaultProps: ResetPassword1Props = {
  logo: {
    src: 'https://deifkwefumgah.cloudfront.net/shadcnblocks/block/logos/shadcnblockscom-wordmark.svg',
    alt: 'shadcnblocks',
    url: 'https://www.shadcnblocks.com'
  },
  heading: 'Set a new password',
  description:
    'Choose a password you have not used on this workspace. You will stay signed in on this device.',
  passwordLabel: 'New password',
  confirmLabel: 'Confirm password',
  passwordPlaceholder: 'At least 12 characters',
  confirmPlaceholder: 'Repeat password',
  button: {
    text: 'Update password',
    url: '#'
  },
  backLink: {
    text: 'Return to login',
    url: '#'
  },
  successMessage: 'Your password is updated. You can sign in on this device.',
  submittingLabel: 'Updating…'
}

const resetPasswordSchema = z
  .object({
    password: z.string().min(12, 'Use at least 12 characters'),
    confirm: z.string().min(1, 'Confirm your password')
  })
  .refine((data) => data.password === data.confirm, {
    message: 'Passwords do not match',
    path: ['confirm']
  })

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>

const ResetPassword1 = (props: Props) => {
  const {
    logo,
    heading,
    description,
    passwordLabel,
    confirmLabel,
    passwordPlaceholder,
    confirmPlaceholder,
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

  const passwordId = useId()
  const confirmId = useId()
  const [isSubmitted, setIsSubmitted] = useState(false)

  const form = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { password: '', confirm: '' }
  })

  const handleFormSubmit = async (data: ResetPasswordFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data)
      } else {
        console.log('Reset password submitted:', data)
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
                  name="password"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={passwordId}>{passwordLabel}</FieldLabel>
                      <Input
                        {...field}
                        id={passwordId}
                        type="password"
                        placeholder={passwordPlaceholder}
                        aria-invalid={fieldState.invalid}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
                <Controller
                  control={form.control}
                  name="confirm"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={confirmId}>{confirmLabel}</FieldLabel>
                      <Input
                        {...field}
                        id={confirmId}
                        type="password"
                        placeholder={confirmPlaceholder}
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

export { ResetPassword1 }
