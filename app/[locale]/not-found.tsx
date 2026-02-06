"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Receipt, ShoppingBag } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"

function getNotFoundVariant(pathname: string) {
  const p = pathname.toLowerCase()
  if (p.includes("/product")) return "product" as const
  if (p.includes("/orders") || p.includes("/order")) return "order" as const
  return "default" as const
}

export default function NotFound() {
  const pathname = usePathname() || "/"
  const locale = useLocale()
  const t = useTranslations("notFound")
  const variant = getNotFoundVariant(pathname)

  const primary =
    variant === "product"
      ? { href: "shop", icon: ShoppingBag }
      : variant === "order"
        ? { href: "orders", icon: Receipt }
        : { href: "", icon: Home }

  const PrimaryIcon = primary.icon

  const title = t(`${variant}.title`)
  const description = t(`${variant}.description`)
  const primaryLabel = t(`${variant}.primaryLabel`)

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 overflow-hidden flex items-start justify-center px-4 pt-4 sm:pt-8">
        <div className="w-full max-w-[980px] h-full flex flex-col items-center gap-6 mt-26">
          <Image
            src="/404.png"
            alt={title}
            width={1400}
            height={1050}
            priority
            sizes="(min-width: 768px) 92vw, 980px"
            className="w-full h-auto max-h-[calc(100%-88px)] object-contain"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/${primary.href}`.replace(/\/$/, "") as any}>
              <Button size="lg" className="text-white gap-2">
                <PrimaryIcon className="w-4 h-4" />
                {primaryLabel}
              </Button>
            </Link>

            <Button
              type="button"
              variant="outline"
              size="lg"
              className="gap-2"
              onClick={() => {
                if (typeof window !== "undefined") window.history.back()
              }}
            >
              <ArrowLeft className="w-4 h-4" />
              {t("back")}
            </Button>
          </div>

          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground max-w-lg">{description}</p>
          </div>
        </div>
      </main>

      <Footer variant="compact" className="mt-10" />
    </div>
  )
}
