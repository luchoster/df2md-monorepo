import { Dog, Trash2 } from 'lucide-react'
import type { Metadata } from 'next'
import { PetForm } from '@/components/account/pet-form'
import { Button } from '@/components/ui/button'
import { removePet } from '@/lib/account/actions'
import { getPets } from '@/lib/account/data'
import { requireUser } from '@/lib/account/session'

export const metadata: Metadata = { title: 'My dogs' }

function age(birth: string) {
  const [y, m, d] = birth.split('-').map(Number)
  const now = new Date()
  let years = now.getFullYear() - y!
  if (now.getMonth() + 1 < m! || (now.getMonth() + 1 === m! && now.getDate() < d!)) years--
  if (years >= 1) return `${years} year${years === 1 ? '' : 's'} old`
  const months =
    (now.getFullYear() - y!) * 12 + now.getMonth() + 1 - m! - (now.getDate() < d! ? 1 : 0)
  return `${Math.max(months, 0)} month${months === 1 ? '' : 's'} old`
}

export default async function DogsPage() {
  await requireUser('/account/dogs')
  const pets = await getPets()
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl tracking-tight md:text-2xl">My dogs</h2>
        <p className="text-sm text-muted-foreground">
          Tell us who we’re feeding. It helps us recommend the right food and portions.
        </p>
      </div>

      {pets.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {pets.map((pet) => (
            <li key={pet.id} className="flex items-center gap-4 rounded-lg border bg-card p-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
                <Dog className="size-5" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{pet.name}</p>
                <p className="truncate text-sm text-muted-foreground">
                  {[pet.breed, pet.birth_date && age(pet.birth_date)].filter(Boolean).join(' · ') ||
                    'No details yet'}
                </p>
              </div>
              <form action={removePet}>
                <input type="hidden" name="id" value={pet.id} />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  aria-label={`Remove ${pet.name}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </form>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          You haven’t added a dog yet.
        </p>
      )}

      <div className="rounded-lg border bg-card p-5 md:p-6">
        <h3 className="mb-4 font-display text-lg font-semibold">Add a dog</h3>
        <PetForm />
      </div>
    </div>
  )
}
