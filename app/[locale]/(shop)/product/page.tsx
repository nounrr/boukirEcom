"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useTranslations } from "next-intl"
import { ShoppingCart, Heart, Star, Package, Truck, Shield } from "lucide-react"
import { useState } from "react"

export default function ProductPage() {
  const t = useTranslations('product')
  const [quantity, setQuantity] = useState(1)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Images */}
        <div className="space-y-4">
          <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center">
            <Package className="w-24 h-24 text-muted-foreground" />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((img) => (
              <div key={img} className="aspect-square bg-secondary/50 rounded-lg cursor-pointer hover:ring-2 ring-primary transition-all" />
            ))}
          </div>
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <Badge className="mb-3">In Stock</Badge>
            <h1 className="text-4xl font-bold mb-3">Professional Product Name</h1>
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">(128 reviews)</span>
            </div>
            <p className="text-3xl font-bold text-primary">$199.99</p>
          </div>

          <div className="prose prose-sm">
            <p className="text-muted-foreground">
              High-quality professional hardware product. Perfect for construction and building projects.
              Durable, reliable, and backed by our quality guarantee.
            </p>
          </div>

          {/* Quantity Selector */}
          <div className="flex items-center gap-4">
            <span className="font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3"
              >
                -
              </Button>
              <span className="px-6 py-2 font-medium">{quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
                className="px-3"
              >
                +
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button size="lg" className="flex-1 gap-2">
              <ShoppingCart className="w-5 h-5" />
              Add to Cart
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="w-5 h-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t">
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Free Shipping</p>
                <p className="text-xs text-muted-foreground">On orders over $50</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">Warranty</p>
                <p className="text-xs text-muted-foreground">1 year guarantee</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Package className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-sm">In Stock</p>
                <p className="text-xs text-muted-foreground">Ready to ship</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
