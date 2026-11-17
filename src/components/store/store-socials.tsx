import { ArrowUpRight, Smartphone, Star } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import { CONTACT, whatsappHref } from "@/lib/contact"
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "./brand-icons"

type Card = { key: string; href: string; external: boolean; title: string; hint: string; icon: React.ReactNode; tone: string }

/** Cartes des réseaux : Instagram, Facebook, WhatsApp, avis Google, application mobile. */
export async function StoreSocials({ locale, compact = false }: { locale: string; compact?: boolean }) {
  const t = await getTranslations({ locale, namespace: "storePage.socials" })
  const instagram = CONTACT.socials.find((s) => s.kind === "instagram")
  const facebook = CONTACT.socials.find((s) => s.kind === "facebook")
  const wa = whatsappHref(t("whatsappMessage"))

  const cards: Card[] = [
    ...(instagram ? [{ key: "ig", href: instagram.href, external: true, title: "Instagram", hint: t("instagram"), icon: <InstagramIcon className="size-6" />, tone: "bg-linear-to-br from-[#feda75] via-[#d62976] to-[#4f5bd5] text-white" }] : []),
    ...(facebook ? [{ key: "fb", href: facebook.href, external: true, title: "Facebook", hint: t("facebook"), icon: <FacebookIcon className="size-6" />, tone: "bg-[#1877f2] text-white" }] : []),
    ...(wa ? [{ key: "wa", href: wa, external: true, title: "WhatsApp", hint: t("whatsapp"), icon: <WhatsAppIcon className="size-6" />, tone: "bg-[#25d366] text-[#073b1c]" }] : []),
    ...(CONTACT.reviewUrl ? [{ key: "review", href: CONTACT.reviewUrl, external: true, title: t("reviewTitle"), hint: t("review"), icon: <Star className="size-6 fill-brand-yellow text-brand-orange" />, tone: "bg-white text-neutral-900" }] : []),
    { key: "app", href: `/${locale}/magasin#app-mobile`, external: false, title: t("appTitle"), hint: t("app"), icon: <Smartphone className="size-6" />, tone: "bg-gold text-ink" },
  ]

  return (
    <ul className={cn("grid grid-cols-2 gap-3 lg:grid-cols-5", compact && "sm:grid-cols-3")}>
      {cards.map((card, index) => (
        // Nombre impair de cartes : la dernière prend toute la ligne sur mobile (et ferme la 2e ligne à 3 colonnes).
        <li key={card.key} className={cn(cards.length % 2 === 1 && index === cards.length - 1 && "col-span-2 lg:col-span-1")}>
          <a
            href={card.href}
            {...(card.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className={cn(
              "group flex h-full flex-col justify-between gap-6 rounded-3xl p-4 shadow-[0_20px_40px_-30px_rgba(0,0,0,0.6)] transition-[translate,box-shadow] duration-500 ease-hover hover:-translate-y-1 hover:shadow-[0_28px_50px_-30px_rgba(0,0,0,0.75)] sm:p-5",
              compact && "gap-4 sm:p-4",
              card.tone
            )}
          >
            <span className="flex items-start justify-between gap-3">
              <span className="grid size-11 place-items-center rounded-2xl bg-black/10">{card.icon}</span>
              <ArrowUpRight className="size-5 opacity-70 transition-[translate] duration-500 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-extrabold leading-tight">{card.title}</span>
              {!compact ? <span className="mt-1 block text-sm opacity-80">{card.hint}</span> : null}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
