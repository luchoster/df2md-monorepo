'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

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
}

type CartContextValue = {
  items: CartItem[]
  count: number
  subtotal: number
  add: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => void
  setQuantity: (id: string, quantity: number) => void
  remove: (id: string) => void
  clear: () => void
  /** Last added item, for the "added to cart" notice */
  lastAdded: CartItem | null
  dismissLastAdded: () => void
}

const STORAGE_KEY = 'df2md.cart.v1'
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

  useEffect(() => {
    setItems(load())
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
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.quantity, 0),
      subtotal: items.reduce((n, i) => n + i.quantity * i.price, 0),
      add,
      setQuantity,
      remove,
      clear,
      lastAdded,
      dismissLastAdded: () => setLastAdded(null)
    }),
    [items, add, setQuantity, remove, clear, lastAdded]
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>')
  return ctx
}
