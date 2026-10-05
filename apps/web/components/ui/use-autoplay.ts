'use client'

import type { EmblaCarouselType } from 'embla-carousel'
import { useEffect, useRef, useState } from 'react'

/** Minimal autoplay: pauses on hover/focus, off for prefers-reduced-motion. */
export function useAutoplay(api: EmblaCarouselType | undefined, delay: number, enabled = true) {
  const paused = useRef(false)
  useEffect(() => {
    if (!api || !enabled || delay <= 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = api.rootNode()
    const pause = () => {
      paused.current = true
    }
    const resume = () => {
      paused.current = false
    }
    root.addEventListener('mouseenter', pause)
    root.addEventListener('mouseleave', resume)
    root.addEventListener('focusin', pause)
    root.addEventListener('focusout', resume)
    const timer = window.setInterval(() => {
      if (!paused.current && document.visibilityState === 'visible') api.scrollNext()
    }, delay)
    return () => {
      window.clearInterval(timer)
      root.removeEventListener('mouseenter', pause)
      root.removeEventListener('mouseleave', resume)
      root.removeEventListener('focusin', pause)
      root.removeEventListener('focusout', resume)
    }
  }, [api, delay, enabled])
}

/** Selected index + snap count for dots. */
export function useDots(api: EmblaCarouselType | undefined) {
  const [state, setState] = useState({ selected: 0, count: 0 })
  useEffect(() => {
    if (!api) return
    const update = () =>
      setState({ selected: api.selectedScrollSnap(), count: api.scrollSnapList().length })
    update()
    api.on('select', update).on('reInit', update)
    return () => {
      api.off('select', update).off('reInit', update)
    }
  }, [api])
  return state
}
