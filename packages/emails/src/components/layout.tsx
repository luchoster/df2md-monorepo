import {
  Body,
  Container,
  Font,
  Head,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text
} from '@react-email/components'
import type { ReactNode } from 'react'

/** The site's palette (apps/web/app/globals.css) */
export const brand = {
  green: '#00ad4c',
  sky: '#0886c4',
  sun: '#ffd300',
  ink: '#1f2328',
  body: '#4a4f55',
  line: '#e3e6e8',
  muted: '#f4f5f6'
}

export const font = "Trueno, 'Helvetica Neue', Arial, sans-serif"

export type Store = {
  siteUrl: string
  phone: string
  email: string
  address: string
}

/** Green header with the white logo, white card, store details in the footer. */
export function Layout({
  preview,
  store,
  children
}: {
  preview: string
  store: Store
  children: ReactNode
}) {
  return (
    <Html lang="en">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Font
          fontFamily="Trueno"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url: `${store.siteUrl}/fonts/trueno-400.woff2`, format: 'woff2' }}
          fontWeight={400}
        />
        <Font
          fontFamily="Trueno"
          fallbackFontFamily={['Helvetica', 'Arial', 'sans-serif']}
          webFont={{ url: `${store.siteUrl}/fonts/trueno-700.woff2`, format: 'woff2' }}
          fontWeight={700}
        />
      </Head>
      <Preview>{preview}</Preview>
      <Body
        style={{ backgroundColor: brand.muted, margin: 0, padding: '24px 0', fontFamily: font }}
      >
        <Container style={{ maxWidth: 600, width: '100%', margin: '0 auto' }}>
          <Section
            style={{
              backgroundColor: brand.green,
              borderRadius: '12px 12px 0 0',
              padding: '20px 24px'
            }}
          >
            <Link href={store.siteUrl}>
              <Img
                src={`${store.siteUrl}/brand/logo-white.png`}
                alt="Dog Food 2 My Door"
                height={48}
                style={{ height: 48, width: 'auto' }}
              />
            </Link>
          </Section>
          <Section
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '0 0 12px 12px',
              padding: '28px 24px'
            }}
          >
            {children}
          </Section>
          <Text
            style={{
              color: brand.body,
              fontSize: 12,
              lineHeight: '18px',
              textAlign: 'center',
              margin: '16px 24px 0'
            }}
          >
            Dog Food 2 My Door · {store.address.replace(/\n/g, ', ')}
            <br />
            <Link href={`tel:${store.phone.replace(/\D/g, '')}`} style={{ color: brand.body }}>
              {store.phone}
            </Link>
            {' · '}
            <Link href={`mailto:${store.email}`} style={{ color: brand.body }}>
              {store.email}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
