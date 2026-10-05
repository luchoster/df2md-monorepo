'use client'

import { Pause, Pencil, Play, X } from 'lucide-react'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  cancelAutoship,
  pauseAutoship,
  resumeAutoship,
  updateAutoship
} from '@/lib/account/actions'
import type { FormState } from '@/lib/account/auth-actions'
import type { Autoship } from '@/lib/account/data'
import { MAX_INTERVAL_COUNT } from '@/lib/pricing'
import { FormMessage } from './form-field'

type Props = { autoship: Autoship; nextDate: string | null; minDate: string; maxDate: string }

/** Runs a one-button server action and toasts the result. */
function useToastAction(
  action: (state: FormState, form: FormData) => Promise<FormState>,
  success: string,
  onDone?: () => void
) {
  const [state, run, pending] = useActionState(action, {})
  useEffect(() => {
    if (state.done) {
      toast.success(success)
      onDone?.()
    } else if (state.error) toast.error(state.error)
  }, [state, success, onDone])
  return [state, run, pending] as const
}

export function AutoshipActions({ autoship, nextDate, minDate, maxDate }: Props) {
  const paused = autoship.status === 'paused'
  const [, pause, pausing] = useToastAction(pauseAutoship, 'Autoship paused')
  const [, resume, resuming] = useToastAction(resumeAutoship, 'Autoship resumed')
  return (
    <div className="flex flex-wrap gap-2">
      <EditDialog autoship={autoship} nextDate={nextDate} minDate={minDate} maxDate={maxDate} />
      <form action={paused ? resume : pause}>
        <input type="hidden" name="id" value={autoship.id} />
        <Button type="submit" variant="outline" size="sm" disabled={pausing || resuming}>
          {paused ? (
            <Play className="size-4" aria-hidden />
          ) : (
            <Pause className="size-4" aria-hidden />
          )}
          {paused ? 'Resume' : 'Pause'}
        </Button>
      </form>
      <CancelDialog id={autoship.id} />
    </div>
  )
}

function EditDialog({ autoship, nextDate, minDate, maxDate }: Props) {
  const [open, setOpen] = useState(false)
  const [interval, setInterval] = useState(autoship.interval)
  const [state, action, pending] = useToastAction(updateAutoship, 'Autoship updated', () =>
    setOpen(false)
  )
  const e = state.fieldErrors ?? {}
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Pencil className="size-4" aria-hidden />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Autoship</DialogTitle>
          <DialogDescription>
            Changes apply from your next order. Set a quantity to 0 to remove an item.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-5" noValidate>
          <input type="hidden" name="id" value={autoship.id} />
          <input type="hidden" name="interval" value={interval} />
          {state.error && <FormMessage>{state.error}</FormMessage>}

          <div className="space-y-2">
            <Label htmlFor={`count-${autoship.id}`}>Deliver every</Label>
            <div className="grid grid-cols-[90px_1fr] gap-2">
              <Input
                id={`count-${autoship.id}`}
                name="count"
                type="number"
                min={1}
                max={MAX_INTERVAL_COUNT[interval]}
                defaultValue={autoship.count}
                aria-invalid={e.count ? true : undefined}
              />
              <Select value={interval} onValueChange={(v) => setInterval(v as typeof interval)}>
                <SelectTrigger aria-label="Unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Days</SelectItem>
                  <SelectItem value="week">Weeks</SelectItem>
                  <SelectItem value="month">Months</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {e.count && <p className="text-sm text-destructive">{e.count}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor={`next-${autoship.id}`}>Next order</Label>
            <Input
              id={`next-${autoship.id}`}
              name="nextDate"
              type="date"
              min={minDate}
              max={maxDate}
              defaultValue={nextDate ?? minDate}
              aria-invalid={e.nextDate ? true : undefined}
            />
            <p className="text-xs text-muted-foreground">
              We charge your card that morning and deliver on the next delivery day.
            </p>
            {e.nextDate && <p className="text-sm text-destructive">{e.nextDate}</p>}
          </div>

          <fieldset className="space-y-2">
            <legend className="mb-2 text-sm font-medium">Quantities</legend>
            {autoship.lines.map((line) => (
              <div key={line.itemId} className="flex items-center justify-between gap-3">
                <Label htmlFor={`qty-${line.itemId}`} className="font-normal">
                  {line.title}
                  {line.option && <span className="text-muted-foreground"> · {line.option}</span>}
                </Label>
                <Input
                  id={`qty-${line.itemId}`}
                  name={`qty_${line.itemId}`}
                  type="number"
                  min={0}
                  max={99}
                  defaultValue={line.quantity}
                  className="w-20 shrink-0"
                  aria-invalid={e[`qty_${line.itemId}`] ? true : undefined}
                />
              </div>
            ))}
          </fieldset>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? 'Saving…' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({ id }: { id: string }) {
  const [open, setOpen] = useState(false)
  const [, action, pending] = useToastAction(cancelAutoship, 'Autoship cancelled', () =>
    setOpen(false)
  )
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive">
          <X className="size-4" aria-hidden />
          Cancel Autoship
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel this Autoship?</DialogTitle>
          <DialogDescription>
            An Autoship can’t be recovered after you cancel it. If you just need a break, pause it
            instead.
          </DialogDescription>
        </DialogHeader>
        <form action={action}>
          <input type="hidden" name="id" value={id} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Keep Autoship
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? 'Cancelling…' : 'Cancel Autoship'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
