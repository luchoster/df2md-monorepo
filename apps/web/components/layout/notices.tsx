'use client'

import dynamic from 'next/dynamic'

/**
 * The toaster and the "added to cart" notice show nothing until something happens, so they (and
 * sonner) load after hydration instead of shipping as a script tag on every page. They load as
 * one unit with the toaster first: it has to be listening before the notice sends a toast for an
 * item that was added while the code was still loading.
 */
export const Notices = dynamic(
  async () => {
    const [{ AppToaster }, { AddedNotice }] = await Promise.all([
      import('./app-toaster'),
      import('@/components/cart/added-notice')
    ])
    return function Notices() {
      return (
        <>
          <AppToaster />
          <AddedNotice />
        </>
      )
    }
  },
  { ssr: false }
)
