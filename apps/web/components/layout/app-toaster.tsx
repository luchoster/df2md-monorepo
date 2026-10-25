'use client'

import { useEffect, useState } from 'react'
import { Toaster } from '@/components/ui/sonner'

/** Below this width the header scrolls away and a bottom toast is easy to miss (phones). */
const PHONE = '(max-width: 767px)'

/**
 * Toasts sit bottom-right on desktop. On phones they drop in from the top, where the eye goes
 * after tapping Add to cart, and above any browser toolbar at the bottom of the screen.
 */
export function AppToaster() {
  // Start with the desktop position so server and first client render match
  const [phone, setPhone] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(PHONE)
    const update = () => setPhone(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return (
    <Toaster
      position={phone ? 'top-center' : 'bottom-right'}
      mobileOffset={{ top: 12, left: 12, right: 12, bottom: 16 }}
      richColors
      closeButton
    />
  )
}
