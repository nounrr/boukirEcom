"use client"

import { getVariantColor } from "@/lib/variant-color"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { MobileVariantSelect } from "./mobile-variant-select"

export interface ApiVariant {
  id: number
  variant_name: string
  color_name?: string | null
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
  style?: 'circle' | 'pill'
}

export function VariantSelector({ colorVariants = [], sizeVariants = [], otherVariants = [], selectedId, onChange, onPreviewImage, style = 'circle' }: VariantSelectorProps) {
  const t = useTranslations("productPage")
  const variants = [...colorVariants, ...sizeVariants, ...otherVariants]

  return (
    <>
      <MobileVariantSelect
        options={variants.map(variant => ({
          id: variant.id,
          label: variant.color_name?.trim() && variant.color_name.trim() !== variant.variant_name
            ? `${variant.variant_name} — ${variant.color_name.trim()}`
            : variant.variant_name,
          available: variant.available,
        }))}
        selectedId={selectedId}
        onSelect={id => {
          const variant = variants.find(option => option.id === id)
          if (!variant) return
          onChange(id, variant)
          onPreviewImage?.(variant.image_url || null)
        }}
      />
    <div className={cn("space-y-4", variants.length > 1 && "hidden md:block")}>
      {colorVariants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("colorLabel")}</label>
          </div>
          <div className="flex flex-wrap gap-2">
            {colorVariants.map((variant) => {
              const canonicalColor = variant.color_name?.trim() || variant.variant_name
              const { background: hex, foreground: fg } = getVariantColor(variant.color_name, variant.variant_name)
              const colorTitle = canonicalColor === variant.variant_name
                ? variant.variant_name
                : `${variant.variant_name} — ${canonicalColor}`
              if (style === 'pill') {
                return (
                  <button
                    key={variant.id}
                    onClick={() => {
                      onChange(variant.id, variant)
                      onPreviewImage?.(variant.image_url || null)
                    }}
                    className={cn(
                      "px-3 py-1.5 text-sm font-semibold rounded-full border transition-all flex items-center gap-2 cursor-pointer",
                      selectedId === variant.id ? "ring-2 ring-primary/20 scale-[1.02]" : "",
                    )}
                    style={{ backgroundColor: hex, color: fg }}
                    title={colorTitle}
                  >
                    <span className="w-2.5 h-2.5 rounded-full border border-black/10" style={{ backgroundColor: hex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' }} />
                    <span>{variant.variant_name}</span>
                  </button>
                )
              }
              // circle style: filled colored circle
              return (
                <button
                  key={variant.id}
                  onClick={() => {
                    onChange(variant.id, variant)
                    onPreviewImage?.(variant.image_url || null)
                  }}
                  className={cn(
                    "relative flex w-12 h-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 p-1 text-center text-[10px] font-semibold leading-tight break-all transition-all cursor-pointer",
                    selectedId === variant.id ? "border-primary ring-2 ring-primary/20 scale-105" : "border-border hover:border-primary/50",
                  )}
                  style={{ backgroundColor: hex, color: fg }}
                  title={colorTitle}
                  aria-label={colorTitle}
                  aria-pressed={selectedId === variant.id}
                >
                  <span>{variant.variant_name}</span>
                  {["blanc", "blanc pur", "white"].includes(canonicalColor.toLowerCase()) && (
                    <div className="absolute inset-0 rounded-full border border-border/30" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {sizeVariants.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">{t("sizeLabel")}</label>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {sizeVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onChange(variant.id, variant)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-md border transition-all cursor-pointer",
                  selectedId === variant.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 hover:bg-muted/50",
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
          <label className="text-sm font-medium">{t("optionsLabel")}</label>
          <div className="flex flex-wrap gap-2">
            {otherVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={() => onChange(variant.id, variant)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md border transition-all cursor-pointer",
                  selectedId === variant.id ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50 hover:bg-muted/50",
                )}
              >
                {variant.variant_name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  )
}
