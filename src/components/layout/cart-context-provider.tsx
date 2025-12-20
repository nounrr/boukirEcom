"use client"

import { createContext, useContext, useRef } from 'react'
import type { CartPopoverRef } from './cart-popover'

interface CartContextValue {
  cartRef: React.RefObject<CartPopoverRef | null>
}

const CartContext = createContext<CartContextValue>({ 
  cartRef: { current: null } 
})

export const useCart = () => useContext(CartContext)

export function CartContextProvider({ children }: { children: React.ReactNode }) {
  const cartRef = useRef<CartPopoverRef | null>(null)

  return (
    <CartContext.Provider value={{ cartRef }}>
      {children}
    </CartContext.Provider>
  )
}
