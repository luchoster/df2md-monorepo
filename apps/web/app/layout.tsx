import type { Metadata, Viewport } from 'next'
import { CartProvider } from '@/components/cart/cart-provider'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Notices } from '@/components/layout/notices'
import { SiteJsonLd } from '@/components/layout/site-json-ld'
import { TooltipProvider } from '@/components/ui/tooltip'
import { siteUrl } from '@/lib/site-url'
import { getDefaultShareImage } from '@/sanity/lib/fetchers'
import { urlFor } from '@/sanity/lib/image'
import { SITE_NAME } from '@/sanity/lib/metadata'
import './globals.css'

/** Pages that don't build their own Open Graph data still share with the site's default image. */
export async function generateMetadata(): Promise<Metadata> {
  const share = await getDefaultShareImage()
  const image = share?.asset
    ? urlFor(share as never)
        .width(1200)
        .height(630)
        .url()
    : undefined
  return {
    metadataBase: siteUrl(),
    title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
    icons: { icon: '/brand/favicon.png' },
    openGraph: { siteName: SITE_NAME, type: 'website', images: image ? [image] : undefined },
    twitter: { card: 'summary_large_image' }
  }
}

export const viewport: Viewport = { themeColor: '#00ad4c' }

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col">
        <TooltipProvider>
          <CartProvider>
            <Header />
            <main id="content" className="flex-1">
              {children}
            </main>
            <Footer />
            <SiteJsonLd />
            <Notices />
          </CartProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
