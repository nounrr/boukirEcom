"use client"

import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ApiVariant {
  id: number
  variant_name: string
  variant_type: string
  available: boolean
  image_url?: string | null
}

interface VariantSelectorProps {
  colorVariants?: ApiVariant[]
  sizeVariants?: ApiVariant[]
  otherVariants?: ApiVariant[]
  selectedId: number | null
  onChange: (id: number, variant: ApiVariant) => void
  onPreviewImage?: (imageUrl: string | null) => void
}

const colorMap: Record<string, string> = {
  'blanc': '#FFFFFF','blanc pur': '#FAFAFA','beige': '#D4C5B9','beige sable': '#C9B99B','noir': '#000000','gris': '#6B7280','gris perle': '#D3D3D3','rouge': '#EF4444','bleu': '#3B82F6','bleu ciel': '#87CEEB','vert': '#10B981','jaune': '#FBBF24','orange': '#F97316','violet': '#8B5CF6','marron': '#92400E'
}

function getColorHex(name?: string) {
  if (!name) return '#e5e7eb'
  const key = name.trim().toLowerCase()
  if (colorMap[key]) return colorMap[key]
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 85%)`
}

export function VariantSelector({ colorVariants = [], sizeVariants = [], otherVariants = [], selectedId, onChange, onPreviewImage }: VariantSelectorProps) {
  return (
    <div className="space-y-4">
      {colorVariants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Couleur</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => {
                  onChange(variant.id, variant)
                  onPreviewImage?.(variant.image_url || null)
                }}
                disabled={!variant.available}
                className={cn(
                  "relative w-10 h-10 rounded-full border-2 transition-all bg-white",
                  selectedId === variant.id ? "border-primary ring-2 ring-primary/20 scale-105" : "border-border hover:border-primary/50",
                  !variant.available && "opacity-30 cursor-not-allowed"
                )}
                title={variant.variant_name}
              >
                <span
                  aria-hidden
                  className="absolute inset-1 rounded-full"
                  style={{ backgroundColor: getColorHex(variant.variant_name) }}
                />
                {["blanc","blanc pur","white"].includes(variant.variant_name?.toLowerCase?.() || '') && (
                  <div className="absolute inset-1 rounded-full border border-border/30" />
                )}
                {!variant.available && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-full h-0.5 bg-destructive rotate-45" />
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {sizeVariants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Taille</label>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {sizeVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onChange(variant.id, variant)}
                disabled={!variant.available}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md border transition-all",
                  selectedId === variant.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 hover:bg-muted/50",
                  !variant.available && "opacity-30 cursor-not-allowed line-through"
                )}
              >
                {variant.variant_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {otherVariants.length > 0 && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Options</label>
          <div className="flex flex-wrap gap-2">
            {otherVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onChange(variant.id, variant)}
                disabled={!variant.available}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border transition-all",
                  selectedId === variant.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 hover:bg-muted/50",
                  !variant.available && "opacity-30 cursor-not-allowed line-through"
                )}
              >
                {variant.variant_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
