"use client"

import { cn } from "@/lib/utils"
import { Package, Box } from "lucide-react"
import { getVariantColor, resolveColorHex } from "@/lib/variant-color"

export interface SimpleVariant {
  id: number
  name?: string
  value?: string
  colorName?: string
  type?: string
  available?: boolean
  image?: string
}

interface VariantSwatchesProps {
  variants: SimpleVariant[]
  selectedId: number | null
  onSelect: (variant: SimpleVariant) => void
  max?: number
  style?: 'circle' | 'pill'
  // When true, always treat variants as colors (for product cards)
  assumeColor?: boolean
}

export function VariantSwatches({ variants, selectedId, onSelect, max = 5, style = 'circle', assumeColor = false }: VariantSwatchesProps) {
  const list = variants.slice(0, max)

  // Detect variant type for better UI
  const detectVariantType = (variant: SimpleVariant): 'color' | 'size' | 'other' => {
    // Prefer the variant value (actual option like "Beige Sable")
    // and fall back to name only if value is missing
    const key = (variant.colorName || variant.value || variant.name || '').toString().toLowerCase()
    const type = (variant.type || '').toString().toLowerCase()

    if (['couleur', 'color', 'coloris', 'couleurs'].includes(type) || resolveColorHex(key)) {
      return 'color'
    }

    // Check if it's a size / dimension / thickness
    if (
      /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|5xl)$/.test(key) ||
      key.includes('taille') ||
      key.includes('épaisseur') ||
      key.includes('epaisseur') ||
      key.includes('thickness') ||
      /\d+(\.\d+)?\s?(mm|cm|m|kg|g|l|ml)$/i.test(key) ||
      ['size', 'taille', 'épaisseur', 'epaisseur', 'thickness', 'dimension', 'dimensions'].some((t) => type.includes(t))
    ) {
      return 'size'
    }

    return 'other'
  }

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
      {list.map((variant) => {
        // Use the variant value (e.g. "Beige Sable") as the color key,
        // just like product-filters does when mapping availableColors
        const keyRaw = (variant.colorName || variant.value || variant.name || '').toString()
        const keyLc = keyRaw.toLowerCase()
        const { background: colorHex, foreground: fg } = getVariantColor(variant.colorName, variant.value || variant.name)
        const variantType = assumeColor ? 'color' : detectVariantType(variant)
        const available = variant.available !== false
        const technicalLabel = (variant.value || variant.name || '').toString()
        const colorTitle = variant.colorName && variant.colorName !== technicalLabel
          ? `${technicalLabel} — ${variant.colorName}`
          : technicalLabel

        if (variantType === 'color' && colorHex) {
          if (style === 'pill') {
            return (
              <button
                key={variant.id}
                onClick={() => available && onSelect(variant)}
                disabled={!available}
                className={cn(
                  "px-2.5 py-0.5 text-xs font-semibold rounded-full border transition-all duration-200 flex items-center gap-1",
                  selectedId === variant.id ? "ring-2 ring-primary/20 scale-[1.02]" : "",
                  !available && "opacity-50 cursor-not-allowed line-through"
                )}
                style={{ backgroundColor: colorHex, color: fg }}
                title={colorTitle}
              >
                <Box className="w-3 h-3 opacity-80" />
                <span>{technicalLabel}</span>
              </button>
            )
          }
          // circle style: filled colored circle (matching product-filters size and styling)
          return (
            <button
              key={variant.id}
              onClick={() => available && onSelect(variant)}
              disabled={!available}
              className={cn(
                "flex w-10 h-10 sm:w-11 sm:h-11 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 p-1 text-center text-[9px] sm:text-[10px] font-semibold leading-tight break-all transition-all duration-200 hover:scale-110 relative",
                selectedId === variant.id ? "border-primary scale-110 shadow-md" : "border-border hover:border-border/60 hover:scale-105",
                !available && "opacity-30 cursor-not-allowed"
              )}
              style={{ backgroundColor: colorHex, color: fg }}
              title={colorTitle}
              aria-label={colorTitle}
              aria-pressed={selectedId === variant.id}
            >
              <span>{technicalLabel}</span>
              {(keyLc === 'blanc' || keyLc === 'blanc pur' || keyLc === 'white') && (
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

        if (variantType === 'size') {
          return (
            <button
              key={variant.id}
              onClick={() => available && onSelect(variant)}
              disabled={!available}
              className={cn(
                "px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-semibold rounded-md border transition-all duration-200 min-w-7 sm:min-w-8 flex items-center justify-center gap-1",
                selectedId === variant.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/20"
                  : "border-border hover:border-primary/50 hover:bg-muted/50 text-foreground",
                !available && "opacity-30 cursor-not-allowed line-through"
              )}
              title={variant.name || variant.value}
            >
              {(variant.value || variant.name)?.toUpperCase()}
            </button>
          )
        }

        return (
          <button
            key={variant.id}
            onClick={() => available && onSelect(variant)}
            disabled={!available}
            className={cn(
              "px-1.5 py-0.5 sm:px-2 sm:py-1 text-[11px] sm:text-xs font-medium rounded-md border transition-all duration-200 flex items-center gap-1",
              selectedId === variant.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border hover:border-primary/50 hover:bg-muted/50",
              !available && "opacity-30 cursor-not-allowed line-through"
            )}
            title={variant.name || variant.value}
          >
            <Package className="w-3 h-3" />
            {variant.value || variant.name}
          </button>
        )
      })}
      {variants.length > max && (
        <span className="text-[9px] sm:text-[10px] font-medium text-muted-foreground px-1.5 py-0.5 bg-muted/50 rounded">+{variants.length - max}</span>
      )}
    </div>
  )
}
