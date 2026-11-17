"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { cn } from "@/lib/utils"

type NavigationLike = { canGoBack?: boolean }

/**
 * Vrai si la page précédente de l'onglet est une page du site.
 * - Navigation API (Chrome, Edge, Safari, Firefox récents) : `canGoBack` ne compte que les
 *   entrées du même site qui se suivent, donc faux quand on arrive depuis Google ou WhatsApp.
 * - Sinon : on a déjà changé de page dans le site depuis le chargement, ou le référent est le site.
 */
function canGoBackInSite() {
  const navigation = (window as unknown as { navigation?: NavigationLike }).navigation
  if (navigation && typeof navigation.canGoBack === "boolean") return navigation.canGoBack

  const landing = (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined)?.name
  if (landing && landing !== window.location.href) return true
  try {
    return Boolean(document.referrer) && new URL(document.referrer).origin === window.location.origin
  } catch {
    return false
  }
}

/**
 * Bouton « Retour » : revient à la dernière page visitée sur le site. Si l'on est arrivé
 * directement sur cette page (lien externe, favori), il mène à la page parente (`fallbackHref`)
 * au lieu de quitter le site.
 */
export function BackButton({ fallbackHref, label, className }: { fallbackHref: string; label: string; className?: string }) {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => (canGoBackInSite() ? router.back() : router.push(fallbackHref))}
      className={cn(
        "group inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted/40 ps-2 pe-3 text-[11px] font-semibold text-foreground transition-[background-color,border-color] duration-500 ease-hover hover:border-primary/50 hover:bg-muted sm:text-sm",
        "outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
        className
      )}
    >
      <span className="grid size-5 place-items-center rounded-full bg-background shadow-sm transition-[background-color,color] duration-500 ease-hover group-hover:bg-primary group-hover:text-primary-foreground">
        <ArrowLeft className="size-3 rtl:rotate-180" aria-hidden="true" />
      </span>
      {label}
    </button>
  )
}
