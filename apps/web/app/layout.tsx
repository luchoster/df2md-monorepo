import type { Metadata, Viewport } from 'next'
import { AddedNotice } from '@/components/cart/added-notice'
import { CartProvider } from '@/components/cart/cart-provider'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SITE_NAME } from '@/sanity/lib/metadata'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://dogfood2mydoor.com'),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  icons: { icon: '/brand/favicon.png' }
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
            <AddedNotice />
            <Toaster position="bottom-right" richColors closeButton />
          </CartProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
