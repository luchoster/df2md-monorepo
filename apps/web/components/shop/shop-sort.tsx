'use client'

import { ArrowUpDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useId, useTransition } from 'react'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

/** Sort dropdown for listings. The server builds each option's URL (filters kept, page reset). */
export function ShopSort({
  value,
  options
}: {
  value: string
  options: { value: string; label: string; href: string }[]
}) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const id = useId()
  return (
    <div className={cn('flex items-center gap-2', pending && 'opacity-60')}>
      <Label htmlFor={id} className="shrink-0 text-sm text-muted-foreground">
        <ArrowUpDown className="size-4" aria-hidden /> Sort by
      </Label>
      <Select
        value={value}
        onValueChange={(next) => {
          const href = options.find((o) => o.value === next)?.href
          if (href) startTransition(() => router.push(href, { scroll: false }))
        }}
      >
        <SelectTrigger id={id} className="w-[190px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
