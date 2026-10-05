'use client'

import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

/**
 * react-headroom's behaviour without the dependency: the header scrolls away when scrolling down
 * and slides back in on any scroll up. Sticky + transform, so nothing below it jumps.
 */
export function Headroom({
  children,
  className
}: {
  children: React.ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    let last = window.scrollY
    let ticking = false
    const onScroll = () => {
      if (ticking) return
      ticking = true
      requestAnimationFrame(() => {
        const y = window.scrollY
        const height = ref.current?.offsetHeight ?? 0
        if (y > last && y > height) setHidden(true)
        else if (y < last) setHidden(false)
        last = y
        ticking = false
      })
    }
    // keep it pinned while anything inside has focus (keyboard users, open menus)
    const onFocus = () => setHidden(false)
    const el = ref.current
    window.addEventListener('scroll', onScroll, { passive: true })
    el?.addEventListener('focusin', onFocus)
    return () => {
      window.removeEventListener('scroll', onScroll)
      el?.removeEventListener('focusin', onFocus)
    }
  }, [])

  return (
    <div
      ref={ref}
      className={cn(
        'sticky top-0 z-40 transition-transform duration-200 ease-in-out motion-reduce:transition-none',
        hidden && '-translate-y-full',
        className
      )}
    >
      {children}
    </div>
  )
}
