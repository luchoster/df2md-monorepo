import { Phone } from 'lucide-react'
import Link from 'next/link'
import { SanityImage, type SanityImageValue } from '@/components/sanity-image'
import { Button } from '@/components/ui/button'
import { formatPhone, formatPhoneHref } from '@/lib/format'

/**
 * A product that's hidden from the shop (draft or archived) but whose link people may have
 * bookmarked: say it isn't available online and point them to the store instead of a 404.
 */
export function ProductUnavailable({
  title,
  image,
  phone
}: {
  title: string | null
  image?: SanityImageValue | null
  phone: string
}) {
  return (
    <section className="container max-w-xl py-16 text-center md:py-24">
      {image?.asset && (
        <div className="mx-auto mb-8 w-40 opacity-60 grayscale">
          <SanityImage image={image} sizes="160px" className="h-auto w-full" />
        </div>
      )}
      <h1 className="mb-3 text-3xl">{title ?? 'This product'} isn’t available online</h1>
      <p className="mb-8 text-muted-foreground">
        It may be out of season or no longer carried. Please call the store and we’ll help you find
        it or a good alternative.
      </p>
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg">
          <a href={formatPhoneHref(phone)}>
            <Phone /> Call {formatPhone(phone)}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/shop">Browse the shop</Link>
        </Button>
      </div>
    </section>
  )
}
