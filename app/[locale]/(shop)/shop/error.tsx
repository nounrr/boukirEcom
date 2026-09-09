"use client"

import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"

export default function ShopError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("productsList")
  return (
    <main className="container mx-auto px-6 py-20 text-center" role="alert">
      <h1 className="text-xl font-semibold mb-2">{t("errorTitle")}</h1>
      <p className="text-muted-foreground mb-6">{t("errorDescription")}</p>
      <Button onClick={reset}>{t("retry")}</Button>
    </main>
  )
}
