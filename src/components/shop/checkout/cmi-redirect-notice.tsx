"use client"

import { useTranslations } from "next-intl"
import { Lock, ShieldCheck } from "lucide-react"
import CmiSecurityLogos from "./cmi-security-logos"

// Paiement par carte : aucune saisie de carte sur notre site, le client est redirigé vers la page
// sécurisée Chaabi Payment (CMI) après la confirmation de la commande.
export function CmiRedirectNotice() {
  const t = useTranslations("checkout")

  return (
    <div className="flex flex-col gap-3 bg-background border border-border/50 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 pb-3 border-b border-border/50">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
        </div>
        <div className="flex flex-col">
          <h3 className="text-sm font-semibold text-foreground">{t("payment.cmi.title")}</h3>
          <p className="text-[11px] text-muted-foreground">{t("payment.cmi.subtitle")}</p>
        </div>
      </div>

      <p className="flex items-start gap-2 text-sm text-muted-foreground leading-relaxed">
        <Lock className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
        <span>{t("payment.cmi.description")}</span>
      </p>

      <CmiSecurityLogos />
    </div>
  )
}

export default CmiRedirectNotice
