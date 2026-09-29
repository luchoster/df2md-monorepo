'use client'

import { Plus } from 'lucide-react'
import { useActionState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { addPet } from '@/lib/account/actions'
import type { FormState } from '@/lib/account/auth-actions'
import { FormField, FormMessage } from './form-field'

export function PetForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(addPet, {})
  const form = useRef<HTMLFormElement>(null)
  useEffect(() => {
    if (state.done) form.current?.reset()
  }, [state])
  const e = state.fieldErrors ?? {}
  return (
    <form ref={form} action={action} className="space-y-4" noValidate>
      {state.error && <FormMessage>{state.error}</FormMessage>}
      <div className="grid gap-4 sm:grid-cols-3">
        <FormField name="name" label="Dog’s name" required error={e.name} />
        <FormField name="breed" label="Breed" error={e.breed} />
        <FormField
          name="birth_date"
          label="Birthday"
          type="date"
          max={new Date().toISOString().slice(0, 10)}
          error={e.birth_date}
        />
      </div>
      <Button type="submit" variant="outline" disabled={pending}>
        <Plus className="size-4" aria-hidden />
        {pending ? 'Adding…' : 'Add dog'}
      </Button>
    </form>
  )
}
