'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { type AutoshipSchedule, clampSchedule, DEFAULT_SCHEDULE } from '@/lib/pricing'

export type CartItem = {
  /** productId:variantKey:autoship — the same size can be in the cart once as one-time and once as Autoship */
  id: string
  productId: string
  variantKey: string
  slug: string
  title: string
  option: string
  /** Display price only. Checkout re-reads prices from Sanity on the server. */
  price: number
  imageUrl: string | null
  quantity: number
  autoship: boolean
  /** Brand excluded from discounts (display only; checkout re-checks) */
  noDiscounts?: boolean
}

type CartContextValue = {
  /** false until the cart has been read from storage */
  ready: boolean
  items: CartItem[]
  count: number
  subtotal: number
  add: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
  /** Switch an item between one-time and Autoship (merges with an existing line of the other kind) */
  setAutoship: (id: string, autoship: boolean) => void
  /** One Autoship schedule per order */
  schedule: AutoshipSchedule
  setSchedule: (s: AutoshipSchedule) => void
  /** Last added item, for the "added to cart" notice */
  lastAdded: CartItem | null
  dismissLastAdded: () => void
}

const STORAGE_KEY = 'df2md.cart.v1'
const SCHEDULE_KEY = 'df2md.schedule.v1'
const CartContext = createContext<CartContextValue | null>(null)

const itemId = (i: { productId: string; variantKey: string; autoship: boolean }) =>
  `${i.productId}:${i.variantKey}:${i.autoship ? 'autoship' : 'once'}`

function load(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [ready, setReady] = useState(false)
  const [lastAdded, setLastAdded] = useState<CartItem | null>(null)
  const [schedule, setScheduleState] = useState<AutoshipSchedule>(DEFAULT_SCHEDULE)

  useEffect(() => {
    setItems(load())
    try {
      const raw = window.localStorage.getItem(SCHEDULE_KEY)
      if (raw) setScheduleState(clampSchedule(JSON.parse(raw)))
    } catch {}
    setReady(true)
    // keep tabs in sync
    const onStorage = (e: StorageEvent) => e.key === STORAGE_KEY && setItems(load())
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {}
  }, [items, ready])

  const add = useCallback<CartContextValue['add']>((item, quantity = 1) => {
    const id = itemId(item)
    let added: CartItem | null = null
    setItems((current) => {
      const existing = current.find((i) => i.id === id)
      if (existing) {
        added = { ...existing, quantity: existing.quantity + quantity }
        return current.map((i) => (i.id === id ? added! : i))
      }
      added = { ...item, id, quantity }
      return [...current, added]
    })
    setLastAdded({ ...item, id, quantity })
  }, [])

  const setQuantity = useCallback((id: string, quantity: number) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((i) => i.id !== id)
        : current.map((i) => (i.id === id ? { ...i, quantity: Math.min(quantity, 99) } : i))
    )
  }, [])

  const remove = useCallback((id: string) => setItems((c) => c.filter((i) => i.id !== id)), [])

  const setAutoship = useCallback((id: string, autoship: boolean) => {
    setItems((current) => {
      const item = current.find((i) => i.id === id)
      if (!item || item.autoship === autoship) return current
      const nextId = itemId({ ...item, autoship })
      const existing = current.find((i) => i.id === nextId)
      const rest = current.filter((i) => i.id !== id)
      return existing
        ? rest.map((i) =>
            i.id === nextId ? { ...i, quantity: Math.min(99, i.quantity + item.quantity) } : i
          )
        : current.map((i) => (i.id === id ? { ...item, id: nextId, autoship } : i))
    })
  }, [])

  const setSchedule = useCallback((s: AutoshipSchedule) => {
    const next = clampSchedule(s)
    setScheduleState(next)
    try {
      window.localStorage.setItem(SCHEDULE_KEY, JSON.stringify(next))
    } catch {}
  }, [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      ready,
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.price, 0),
      add,
      setQuantity,
      remove,
      clear,
      setAutoship,
      schedule,
      setSchedule,
      lastAdded,
      dismissLastAdded: () => setLastAdded(null)
    }),
    [ready, items, add, setQuantity, remove, clear, setAutoship, schedule, setSchedule, lastAdded]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
