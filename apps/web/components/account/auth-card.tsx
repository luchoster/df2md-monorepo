import { PawPrint } from 'lucide-react'
import Link from 'next/link'
import { accountsEnabled } from '@/lib/supabase/env'

/** shadcnblocks Login 2 / Signup 4 shell: muted band, brand mark, heading, bordered card. */
export function AuthCard({
  heading,
  description,
  children,
  footer
}: {
  heading: string
  description?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <section className="bg-footer py-12 md:py-20">
      <div className="container flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="grid size-12 place-items-center rounded-full bg-brand text-white">
            <PawPrint className="size-6" aria-hidden />
          </span>
          <h1 className="text-2xl tracking-tight md:text-3xl">{heading}</h1>
          {description && <p className="max-w-sm text-muted-foreground">{description}</p>}
        </div>
        <div className="w-full max-w-sm rounded-lg border bg-background px-6 py-8 shadow-sm">
          {accountsEnabled ? children : <AccountsOff />}
        </div>
        {footer && (
          <div className="flex flex-wrap justify-center gap-1 text-sm text-muted-foreground">
            {footer}
          </div>
        )}
      </div>
    </section>
  )
}

function AccountsOff() {
  return (
    <div className="space-y-3 text-center text-sm">
      <p className="font-medium text-foreground">Customer accounts are coming soon.</p>
      <p className="text-muted-foreground">
        You can still order as a guest. Questions? Call{' '}
        <a href="tel:702-971-2484" className="text-brand">
          702-971-2484
        </a>
        .
      </p>
      <Link href="/shop" className="inline-block font-medium text-brand hover:underline">
        Continue shopping
      </Link>
    </div>
  )
}
