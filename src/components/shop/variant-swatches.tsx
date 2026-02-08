"use client"

import { cn } from "@/lib/utils"
import { Ruler, Package, Box } from "lucide-react"

export interface SimpleVariant {
  id: number
  name?: string
  value?: string
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

// Color map matching product-filters.tsx exactly
const colorMap: Record<string, string> = {
  'blanc': '#FFFFFF',
  'blanc pur': '#FAFAFA',
  'beige': '#D4C5B9',
  'beige sable': '#C9B99B',
  'noir': '#000000',
  'gris': '#6B7280',
  'gris perle': '#D3D3D3',
  'rouge': '#EF4444',
  'bleu': '#3B82F6',
  'bleu ciel': '#87CEEB',
  'vert': '#10B981',
  'jaune': '#FBBF24',
  'orange': '#F97316',
  'violet': '#8B5CF6',
  'marron': '#92400E'
}

function getForeground(hex: string): string {
  let h = hex.replace('#', '')
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('')
  }
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  // Perceived brightness
  const brightness = (r * 0.299 + g * 0.587 + b * 0.114)
  return brightness > 180 ? '#111111' : '#ffffff'
}

function getColorHex(name?: string) {
  if (!name) return '#e5e7eb'
  const keyRaw = name.trim()
  const key = keyRaw.toLowerCase()
  // Direct CSS color support
  const isHex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(keyRaw)
  const isRgb = /^rgb\s*\(/i.test(keyRaw)
  const isHsl = /^hsl\s*\(/i.test(keyRaw)
  if (isHex || isRgb || isHsl) return keyRaw

  if (colorMap[key]) return colorMap[key]
  // Also handle common English color names
  const english: Record<string, string> = {
    white: '#FFFFFF',
    black: '#000000',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#FBBF24',
    orange: '#F97316',
    purple: '#8B5CF6',
    brown: '#92400E',
    gray: '#6B7280',
    grey: '#6B7280',
    beige: '#D4C5B9',
    // Extra explicit mappings for product card colors
    pink: '#ec4899',
    'light blue': '#60a5fa',
    lightblue: '#60a5fa'
  }
  if (english[key]) return english[key]

  // Pastel HSL fallback based on name hash
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0
  }
  const hue = hash % 360
  return `hsl(${hue}, 70%, 85%)`
}

export function VariantSwatches({ variants, selectedId, onSelect, max = 5, style = 'circle', assumeColor = false }: VariantSwatchesProps) {
  const list = variants.slice(0, max)

  // Detect variant type for better UI
  const detectVariantType = (variant: SimpleVariant): 'color' | 'size' | 'other' => {
    // Prefer the variant value (actual option like "Beige Sable")
    // and fall back to name only if value is missing
    const key = (variant.value || variant.name || '').toString().toLowerCase()
    const type = (variant.type || '').toString().toLowerCase()

    // Check if it's a color
    const isCssColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(key) || /^rgb\s*\(/i.test(key) || /^hsl\s*\(/i.test(key)
    const englishColorKeys = ['white', 'black', 'red', 'blue', 'green', 'yellow', 'orange', 'purple', 'brown', 'gray', 'grey', 'beige']
    if (isCssColor || Object.keys(colorMap).some(color => key.includes(color)) || englishColorKeys.some(color => key.includes(color))) {
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
        const keyRaw = (variant.value || variant.name || '').toString()
        const keyLc = keyRaw.toLowerCase()
        const colorHex = colorMap[keyLc] || getColorHex(keyLc)
        const variantType = assumeColor ? 'color' : detectVariantType(variant)
        const available = variant.available !== false

        if (variantType === 'color' && colorHex) {
          if (style === 'pill') {
            const fg = getForeground(colorHex)
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
                title={variant.name || variant.value}
              >
                <Box className="w-3 h-3 opacity-80" />
                <span>{variant.value || variant.name}</span>
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
                "w-6 h-6 sm:w-8 sm:h-8 rounded-full border-2 transition-all duration-200 hover:scale-110 relative",
                selectedId === variant.id ? "border-primary scale-110 shadow-md" : "border-border hover:border-border/60 hover:scale-105",
                !available && "opacity-30 cursor-not-allowed"
              )}
              style={{ backgroundColor: colorHex }}
              title={variant.name || variant.value}
            >
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
