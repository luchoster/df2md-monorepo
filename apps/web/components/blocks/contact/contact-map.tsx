import { Mail, MapPin, Phone } from 'lucide-react'
import { PortableTextRenderer } from '@/components/portable-text-renderer'
import { formatPhone } from '@/lib/format'
import { getSettings } from '@/sanity/lib/fetchers'
import { Section } from '../section'
import type { BlockOf } from '../types'

/**
 * Store info + Google map. With only a map URL it renders the home page's full-width map (50vh);
 * with a heading or text it's the contact layout. Empty fields fall back to Site settings.
 */
export default async function ContactMap(props: BlockOf<'contact-map'> & { isFirst?: boolean }) {
  const { heading, text, mapEmbedUrl, padding, isFirst } = props
  const map = mapEmbedUrl ? (
    <iframe
      src={mapEmbedUrl}
      title="Map to Dog Food 2 My Door"
      loading="lazy"
      referrerPolicy="no-referrer-when-downgrade"
      className="h-[50vh] min-h-[320px] w-full border-0"
      allowFullScreen
    />
  ) : null

  if (!heading && !text?.length) return <Section padding={padding}>{map}</Section>

  const settings = await getSettings()
  const phone = props.phone || settings?.contact?.phone
  const email = props.email || settings?.contact?.email
  const address = props.address || settings?.contact?.address
  const hours = props.hours || settings?.contact?.hours
  const Heading = isFirst ? 'h1' : 'h2'

  return (
    <Section padding={padding}>
      <div className="container grid gap-8 md:grid-cols-2">
        <div>
          {heading && <Heading>{heading}</Heading>}
          <PortableTextRenderer value={text as never} className="mb-4" />
          <ul className="space-y-3">
            {address && (
              <li className="flex gap-3">
                <MapPin className="mt-1 size-5 shrink-0 text-brand" />
                <address className="whitespace-pre-line not-italic">{address}</address>
              </li>
            )}
            {phone && (
              <li className="flex gap-3">
                <Phone className="mt-1 size-5 shrink-0 text-brand" />
                <a href={`tel:${phone.replace(/\D/g, '')}`}>{formatPhone(phone)}</a>
              </li>
            )}
            {email && (
              <li className="flex gap-3">
                <Mail className="mt-1 size-5 shrink-0 text-brand" />
                <a href={`mailto:${email}`}>{email}</a>
              </li>
            )}
            {hours && <li className="whitespace-pre-line pl-8">{hours}</li>}
          </ul>
        </div>
        {map && <div className="overflow-hidden rounded">{map}</div>}
      </div>
    </Section>
  )
}
