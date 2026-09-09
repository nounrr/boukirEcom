"use client"

import { useTranslations } from "next-intl"

interface MobileVariantSelectProps {
  options: { id: number; label: string; available: boolean }[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function MobileVariantSelect({ options, selectedId, onSelect }: MobileVariantSelectProps) {
  const t = useTranslations("productCard")
  if (options.length <= 1) return null

  return (
    <select
      aria-label={t("variantLabelFallback")}
      className="md:hidden block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-border bg-background px-3 py-2 text-base text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      value={options.some(option => option.id === selectedId) ? String(selectedId) : ""}
      onClick={event => event.stopPropagation()}
      onKeyDown={event => event.stopPropagation()}
      onChange={event => {
        const selected = options.find(option => option.id === Number(event.target.value))
        if (selected) onSelect(selected.id)
      }}
    >
      <option value="" disabled>{t("variantLabelFallback")}</option>
      {options.map(option => (
        <option key={option.id} value={option.id}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
