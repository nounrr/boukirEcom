"use client"

import { cn } from "@/lib/utils"

export interface SimpleVariant {
  id: number
  name?: string
  value?: string
  available?: boolean
  image?: string
}

interface VariantSwatchesProps {
  variants: SimpleVariant[]
  selectedId: number | null
  onSelect: (variant: SimpleVariant) => void
  max?: number
}

const colorMap: Record<string, string> = {
  'Blanc': '#FFFFFF','Blanc Pur': '#FAFAFA','Beige': '#D4C5B9','Beige Sable': '#C9B99B','Noir': '#000000','Gris': '#6B7280','Gris Perle': '#D3D3D3','Rouge': '#EF4444','Bleu': '#3B82F6','Bleu Ciel': '#87CEEB','Vert': '#10B981','Jaune': '#FBBF24','Orange': '#F97316','Violet': '#8B5CF6','Marron': '#92400E'
}

export function VariantSwatches({ variants, selectedId, onSelect, max = 5 }: VariantSwatchesProps) {
  const list = variants.slice(0, max)
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {list.map((variant) => {
        const key = (variant.name || variant.value || '').toString()
        const colorHex = colorMap[key] || colorMap[variant.value || '']
        const isColorVariant = colorHex !== undefined
        const available = variant.available !== false

        if (isColorVariant) {
          return (
            <button
              key={variant.id}
              onClick={() => available && onSelect(variant)}
              disabled={!available}
              className={cn(
                "w-7 h-7 rounded-full border-2 transition-all duration-200 relative",
                selectedId === variant.id ? "border-primary ring-2 ring-primary/20 scale-110" : "border-border hover:border-primary/50",
                !available && "opacity-30 cursor-not-allowed"
              )}
              style={{ backgroundColor: colorHex }}
              title={variant.name || variant.value}
            >
              {(key === 'Blanc' || key === 'Blanc Pur') && (
                <div className="absolute inset-0 rounded-full border border-border/30" />
              )}
              {!available && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-0.5 bg-destructive rotate-45" />
                </div>
              )}
            </button>
          )
        }

        return (
          <button
            key={variant.id}
            onClick={() => available && onSelect(variant)}
            disabled={!available}
            className={cn(
              "px-2 py-0.5 text-xs font-medium rounded-md border transition-all duration-200",
              selectedId === variant.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 hover:bg-muted/50",
              !available && "opacity-30 cursor-not-allowed line-through"
            )}
            title={variant.name || variant.value}
          >
            {variant.value || variant.name}
          </button>
        )
      })}
      {variants.length > max && (
        <span className="text-[10px] text-muted-foreground">+{variants.length - max}</span>
      )}
    </div>
  )
}
