"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowLeft, Home, Receipt, ShoppingBag } from "lucide-react"

import { Header } from "@/components/layout/header"
import { Footer } from "@/components/layout/footer"
import { Button } from "@/components/ui/button"

function getLocaleFromPathname(pathname: string) {
  const seg = pathname.split("/").filter(Boolean)[0]
  if (seg === "fr" || seg === "ar") return seg
  return "fr"
}

function getNotFoundCopy(pathname: string) {
  const p = pathname.toLowerCase()

  if (p.includes("/product")) {
    return {
      title: "Produit introuvable",
      description: "Ce produit n'existe pas ou n'est plus disponible.",
      primaryHref: "shop",
      primaryLabel: "Retour à la boutique",
      primaryIcon: ShoppingBag,
    }
  }

  if (p.includes("/orders") || p.includes("/order")) {
    return {
      title: "Commande introuvable",
      description: "Cette commande n'existe pas, ou vous n'y avez pas accès.",
      primaryHref: "orders",
      primaryLabel: "Voir mes commandes",
      primaryIcon: Receipt,
    }
  }

  return {
    title: "Page introuvable",
    description: "L'adresse saisie est incorrecte, ou la page a été déplacée.",
    primaryHref: "",
    primaryLabel: "Retour à l'accueil",
    primaryIcon: Home,
  }
}

export default function NotFound() {
  const pathname = usePathname() || "/"
  const locale = getLocaleFromPathname(pathname)
  const copy = getNotFoundCopy(pathname)
  const PrimaryIcon = copy.primaryIcon

  return (
    <div className="h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 overflow-hidden flex items-start justify-center px-4 pt-4 sm:pt-8">
        <div className="w-full max-w-[980px] h-full flex flex-col items-center gap-6 mt-26">
          <Image
            src="/404.png"
            alt={copy.title}
            width={1400}
            height={1050}
            priority
            sizes="(min-width: 768px) 92vw, 980px"
            className="w-full h-auto max-h-[calc(100%-88px)] object-contain"
          />

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href={`/${locale}/${copy.primaryHref}`.replace(/\/$/, "") as any}>
              <Button size="lg" className="text-white gap-2">
                <PrimaryIcon className="w-4 h-4" />
                {copy.primaryLabel}
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
              Revenir
            </Button>
          </div>
        </div>
      </main>

      <Footer variant="compact" className="mt-10" />
    </div>
  )
}
