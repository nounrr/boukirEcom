import { Header } from "@/components/layout/header"
import { DynamicBreadcrumb } from "@/components/layout/dynamic-breadcrumb"
import type React from "react"

export default function ShopLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <DynamicBreadcrumb />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
