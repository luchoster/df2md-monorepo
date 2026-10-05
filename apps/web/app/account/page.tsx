import type { Metadata } from 'next'
import Link from 'next/link'
import { FormMessage } from '@/components/account/form-field'
import { ProfileForm } from '@/components/account/profile-form'
import { getOrders } from '@/lib/account/data'
import { cents, formatDate, STATUS, TONES } from '@/lib/account/format'
import { getProfile, requireUser } from '@/lib/account/session'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: 'Profile' }

const NOTICES: Record<string, { tone: 'success' | 'error'; text: string }> = {
  password: { tone: 'success', text: 'Your new password is saved.' },
  payments: {
    tone: 'error',
    text: 'Saved cards aren’t available yet. Please try again later or give us a call.'
  }
}

export default async function AccountPage({ searchParams }: PageProps<'/account'>) {
  const user = await requireUser('/account')
  const params = await searchParams
  const [profile, orders] = await Promise.all([getProfile(), getOrders()])
  const notice = NOTICES[String(params.updated ?? params.error ?? '')]
  const last = orders[0]
  return (
    <div className="space-y-8">
      {notice && <FormMessage tone={notice.tone}>{notice.text}</FormMessage>}
      {last && (
        <Link
          href={`/account/orders/${last.number}`}
          className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-card p-4 transition-colors hover:border-brand"
        >
          <div>
            <p className="text-xs text-muted-foreground">Latest order</p>
            <p className="font-semibold">
              #{last.number} · {formatDate(last.created_at)} · {cents(last.total)}
            </p>
          </div>
          <span
            className={cn(
              'rounded-full px-2.5 py-1 text-xs font-semibold',
              TONES[STATUS[last.status].tone]
            )}
          >
            {STATUS[last.status].label}
          </span>
        </Link>
      )}
      <div className="rounded-lg border bg-card p-5 md:p-8">
        <ProfileForm profile={profile} email={user.email} />
      </div>
    </div>
  )
}
