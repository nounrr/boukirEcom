import { Header } from "@/components/layout/header"
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb"
import { CartContextProvider } from "@/components/layout/cart-context-provider"
import { AuthDialogProvider } from "@/components/providers/auth-dialog-provider"
import type React from "react"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CartContextProvider>
      <AuthDialogProvider>
        <div className="min-h-screen flex flex-col">
          <Header />
          <DynamicBreadcrumb />
          <main className="flex-1">
            {children}
          </main>
        </div>
      </AuthDialogProvider>
    </CartContextProvider>
  )
}
