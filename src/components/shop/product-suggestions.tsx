'use client'

import { Sparkles } from 'lucide-react'
import { ProductCard } from './product-card'

interface ProductSuggestion {
  id: number
  designation: string
  designation_ar?: string
  designation_en?: string
  prix_vente: number
  prix_promo: number | null
  pourcentage_promo: number
  has_promo: boolean
  image_url: string
  quantite_disponible: number
  has_variants: boolean
  categorie: {
    id: number
    nom: string
  }
  is_wishlisted?: boolean
}

interface ProductSuggestionsProps {
  products: ProductSuggestion[]
  title?: string
  description?: string
}

export function ProductSuggestions({
  products,
  title = "Vous pourriez aimer",
  description = "Découvrez nos suggestions pour vous"
}: ProductSuggestionsProps) {
  // Ensure products is always an array
  const productList = Array.isArray(products) ? products : []
  
  if (productList.length === 0) {
    return null
  }

  return (
    <div className="space-y-6 pt-8 border-t">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
          <Sparkles className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {productList.map((product) => (
          <ProductCard
            key={product.id}
            product={{
              id: product.id,
              name: product.designation,
              price: product.prix_promo || product.prix_vente,
              originalPrice: product.prix_promo ? product.prix_vente : undefined,
              image: product.image_url || '',
              category: product.categorie?.nom || '',
              stock: product.quantite_disponible,
              is_wishlisted: product.is_wishlisted,
              sale: product.pourcentage_promo ? {
                discount: product.pourcentage_promo,
              } : undefined,
            }}
            viewMode="grid"
          />
        ))}
      </div>
    </div>
  )
}
