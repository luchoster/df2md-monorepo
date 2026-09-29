'use client'

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { updateProfile } from '@/lib/account/actions'
import type { FormState } from '@/lib/account/auth-actions'
import type { Profile } from '@/lib/supabase/types'
import { FormField, FormMessage } from './form-field'

export function ProfileForm({ profile, email }: { profile: Profile | null; email: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {})
  useEffect(() => {
    if (state.done) toast.success('Your details are saved')
  }, [state])
  const e = state.fieldErrors ?? {}
  return (
    <form action={action} className="space-y-8" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <fieldset className="space-y-4">
        <legend className="mb-4 font-display text-lg font-semibold">Personal information</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            name="first_name"
            label="First name"
            autoComplete="given-name"
            defaultValue={profile?.first_name ?? ''}
            error={e.first_name}
          />
          <FormField
            name="last_name"
            label="Last name"
            autoComplete="family-name"
            defaultValue={profile?.last_name ?? ''}
            error={e.last_name}
          />
          <FormField name="email" label="Email" value={email} disabled readOnly />
          <FormField
            name="phone"
            label="Phone"
            type="tel"
            autoComplete="tel"
            defaultValue={profile?.phone ?? ''}
            error={e.phone}
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-1 font-display text-lg font-semibold">Delivery address</legend>
        <p className="text-sm text-muted-foreground">We’ll fill this in for you at checkout.</p>
        <FormField
          name="address_line1"
          label="Street address"
          autoComplete="address-line1"
          defaultValue={profile?.address_line1 ?? ''}
          error={e.address_line1}
        />
        <FormField
          name="address_line2"
          label="Apartment, suite, gate code (optional)"
          autoComplete="address-line2"
          defaultValue={profile?.address_line2 ?? ''}
          error={e.address_line2}
        />
        <div className="grid gap-4 sm:grid-cols-[1fr_90px_140px]">
          <FormField
            name="city"
            label="City"
            autoComplete="address-level2"
            defaultValue={profile?.city ?? ''}
            error={e.city}
          />
          <FormField
            name="state"
            label="State"
            autoComplete="address-level1"
            defaultValue={profile?.state ?? 'NV'}
            maxLength={2}
            error={e.state}
          />
          <FormField
            name="postal_code"
            label="ZIP code"
            autoComplete="postal-code"
            inputMode="numeric"
            defaultValue={profile?.postal_code ?? ''}
            error={e.postal_code}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="f-delivery_notes">Delivery notes (optional)</Label>
          <Textarea
            id="f-delivery_notes"
            name="delivery_notes"
            rows={3}
            placeholder="Leave at the side gate, beware of the (friendly) dog…"
            defaultValue={profile?.delivery_notes ?? ''}
          />
        </div>
      </fieldset>

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
