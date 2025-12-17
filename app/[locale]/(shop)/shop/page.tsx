"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslations } from "next-intl"
import { Search, SlidersHorizontal } from "lucide-react"
import { useState } from "react"

export default function ShopPage() {
  const t = useTranslations('shop')
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Shop</h1>
        <p className="text-muted-foreground">Browse our complete catalog of products</p>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ltr:pl-10 rtl:pr-10 h-12"
            />
          </div>
        </div>
        <Button variant="outline" className="gap-2 h-12">
          <SlidersHorizontal className="w-5 h-5" />
          Filters
        </Button>
      </div>

      {/* Products Grid - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
          <div key={item} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
            <div className="aspect-square bg-secondary/50 rounded-md mb-4 flex items-center justify-center">
              <span className="text-muted-foreground">Product {item}</span>
            </div>
            <h3 className="font-semibold mb-2">Product Name {item}</h3>
            <p className="text-sm text-muted-foreground mb-3">Short product description</p>
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-primary">$99.99</span>
              <Button size="sm">Add to Cart</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
