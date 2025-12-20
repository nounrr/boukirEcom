"use client"

import { ReactNode } from "react"
import { Heart, ShoppingCart, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

interface ShopPageLayoutProps {
  children: ReactNode
  title: string
  subtitle?: string
  icon?: "heart" | "cart"
  itemCount?: number
  emptyState?: {
    icon: ReactNode
    title: string
    description: string
    actionLabel?: string
    actionHref?: string
  }
  isEmpty?: boolean
}

export function ShopPageLayout({
  children,
  title,
  subtitle,
  icon = "heart",
  itemCount = 0,
  emptyState,
  isEmpty = false,
}: ShopPageLayoutProps) {
  const IconComponent = icon === "heart" ? Heart : ShoppingCart

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20">
              <IconComponent className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground">{title}</h1>
                {itemCount > 0 && (
                  <Badge variant="secondary" className="text-sm px-3 py-1">
                    {itemCount} {itemCount === 1 ? "article" : "articles"}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="text-muted-foreground mt-1">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content or Empty State */}
        {isEmpty && emptyState ? (
          <div className="flex flex-col items-center justify-center py-20 px-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-full bg-muted/50 mb-6">
              {emptyState.icon}
            </div>
            <h2 className="text-2xl font-semibold text-foreground mb-2">
              {emptyState.title}
            </h2>
            <p className="text-muted-foreground text-center max-w-md mb-8">
              {emptyState.description}
            </p>
            {emptyState.actionLabel && emptyState.actionHref && (
              <Link href={emptyState.actionHref}>
                <Button size="lg" className="gap-2">
                  <Package className="w-4 h-4" />
                  {emptyState.actionLabel}
                </Button>
              </Link>
            )}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  )
}
