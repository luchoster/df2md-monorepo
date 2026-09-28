import Link from 'next/link'
import { formatPhone } from '@/lib/format'
import { hrefFor, type LinkValue } from '@/lib/links'
import { getSettings } from '@/sanity/lib/fetchers'
import { FacebookIcon, InstagramIcon } from './social-icons'

function FooterLink({ link, label }: { link: LinkValue; label: string | null }) {
  const href = hrefFor(link)
  if (!href) return null
  return <Link href={href}>{label}</Link>
}

export async function Footer() {
  const settings = await getSettings()
  const contact = settings?.contact
  const [street, ...rest] = (contact?.address ?? '').split('\n')
  const year = new Date().getFullYear()

  return (
    <footer className="bg-footer">
      <div className="grid gap-8 px-6 pt-5 pb-10 sm:grid-cols-2 lg:grid-cols-5">
        {settings?.footerColumns?.map((col) => (
          <div key={col._key}>
            <h2 className="mb-3">{col.title}</h2>
            <ul className="space-y-0.5">
              {col.links?.map((l) => (
                <li key={l._key}>
                  <FooterLink link={l.link} label={l.label} />
                </li>
              ))}
            </ul>
          </div>
        ))}
        <div>
          <h2 className="mb-3">Contact</h2>
          <address className="not-italic text-ink-900">
            {street}
            {rest.length > 0 && <br />}
            {rest.join(', ')}
          </address>
        </div>
        <div className="lg:pt-[60px]">
          <ul className="space-y-0.5">
            {(settings?.social?.instagram || settings?.social?.facebook) && (
              <li className="flex gap-2">
                {settings.social.instagram && (
                  <a
                    href={settings.social.instagram}
                    target="_blank"
                    rel="noopener"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="size-6" />
                  </a>
                )}
                {settings.social.facebook && (
                  <a
                    href={settings.social.facebook}
                    target="_blank"
                    rel="noopener"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="size-6" />
                  </a>
                )}
              </li>
            )}
            {contact?.phone && (
              <li>
                <a href={`tel:${contact.phone.replace(/\D/g, '')}`}>{formatPhone(contact.phone)}</a>
              </li>
            )}
            {contact?.email && (
              <li>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="flex min-h-[100px] items-center bg-footer-bar px-4 text-xs text-muted md:text-base">
        <p className="mb-0">
          {year} Dog Food 2 My Door | All Rights Reserved
          {settings?.legalLinks?.map((l) => (
            <span key={l._key}>
              {' | '}
              <FooterLink link={l.link} label={l.label} />
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
