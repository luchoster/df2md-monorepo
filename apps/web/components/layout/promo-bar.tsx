import { PortableText } from '@portabletext/react'
import type { PortableTextBlock } from '@portabletext/types'
import { ButtonLink } from '@/components/button-link'
import type { Settings } from './nav-types'

/** The blue "SAVE 20% TODAY" bar. Edited in Site settings → Promo bar. */
export function PromoBar({ announcement }: { announcement: Settings['announcement'] }) {
  if (!announcement?.active || !announcement.text?.length) return null
  return (
    <div className="bg-sky px-4 py-3 text-center text-white lg:py-5">
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-base font-normal lg:text-2xl">
        <div className="[&_a]:text-white [&_p]:mb-0">
          <PortableText value={announcement.text as PortableTextBlock[]} />
        </div>
        {announcement.button && (
          <ButtonLink
            link={announcement.button}
            size="sm"
            className="my-0 px-2 py-0.5 text-xs uppercase"
          >
            {announcement.button.title}
          </ButtonLink>
        )}
      </div>
    </div>
  )
}
