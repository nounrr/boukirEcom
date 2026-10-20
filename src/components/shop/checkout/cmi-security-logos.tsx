import Image from "next/image"
import { cn } from "@/lib/utils"

// Logos de sécurité exigés par le CMI (kit d'intégration Chaabi Payment) à proximité du bouton de paiement.
const LOGOS = [
  { src: "/payments/cmi.png", alt: "CMI - Centre Monétique Interbancaire", width: 41, height: 32 },
  { src: "/payments/chaabi-payment.jpeg", alt: "Chaabi Payment", width: 64, height: 32 },
  { src: "/payments/visa.svg", alt: "Visa", width: 52, height: 32 },
  { src: "/payments/master-card.svg", alt: "Mastercard", width: 52, height: 32 },
  { src: "/payments/verified-by-visa.jpeg", alt: "Verified by Visa", width: 56, height: 32 },
  { src: "/payments/mastercard-securecode.jpeg", alt: "Mastercard SecureCode", width: 56, height: 32 },
] as const

export function CmiSecurityLogos({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {LOGOS.map((logo) => (
        <Image
          key={logo.src}
          src={logo.src}
          alt={logo.alt}
          width={logo.width}
          height={logo.height}
          sizes={`${logo.width}px`}
          className="h-7 w-auto opacity-95"
        />
      ))}
    </div>
  )
}

export default CmiSecurityLogos
