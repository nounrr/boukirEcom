import Image from "next/image"
import { Bell, HardHat, PackageCheck, ShoppingBag, Smartphone, Wallet } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import { MOBILE_APP, STORE_PHOTOS } from "@/lib/store-media"
import { AppleIcon, GooglePlayIcon } from "./brand-icons"

function StoreButton({ href, store, soon, small, big }: { href: string | null; store: "apple" | "google"; soon: string; small: string; big: string }) {
  const t = { small, big }
  const content = (
    <>
      {store === "apple" ? <AppleIcon className="size-7 shrink-0" /> : <GooglePlayIcon className="size-7 shrink-0" />}
      <span className="flex flex-col text-start leading-tight">
        <span className="text-[10px] font-medium uppercase tracking-wide opacity-80">{t.small}</span>
        <span className="text-lg font-semibold">{t.big}</span>
      </span>
    </>
  )
  const base = "relative inline-flex h-14 min-w-[180px] items-center gap-3 rounded-2xl border border-white/20 bg-black px-4 text-white shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)] transition-[translate,border-color,background-color] duration-500 ease-hover"
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={cn(base, "hover:-translate-y-0.5 hover:border-brand-yellow")}>
        {content}
      </a>
    )
  }
  return (
    <span aria-disabled="true" className={cn(base, "cursor-default opacity-70")} title={soon}>
      {content}
      <span className="absolute -top-2.5 end-3 rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">{soon}</span>
    </span>
  )
}

/** Section « Téléchargez l'application » : avantages, boutons App Store / Google Play, aperçu du téléphone. */
export async function AppDownloadSection({ locale, id = "app-mobile" }: { locale: string; id?: string }) {
  const t = await getTranslations({ locale, namespace: "storePage.app" })
  const features = [
    { icon: ShoppingBag, text: t("features.order") },
    { icon: PackageCheck, text: t("features.track") },
    { icon: Wallet, text: t("features.balance") },
    { icon: HardHat, text: t("features.maalems") },
    { icon: Bell, text: t("features.alerts") },
  ]
  const screen = STORE_PHOTOS[7]

  return (
    <section id={id} className="relative scroll-mt-32 overflow-hidden bg-ink py-16 text-white lg:py-24" aria-labelledby={`${id}-title`}>
      <div className="pointer-events-none absolute -start-32 top-10 size-[30rem] rounded-full bg-brand-orange/15 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -end-20 bottom-0 size-80 rounded-full bg-brand-yellow/10 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1440px] items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:px-10">
        <div>
          <p className="kicker flex items-center gap-3 !text-brand-yellow">
            <Smartphone className="size-4" aria-hidden="true" />{t("kicker")}
          </p>
          <h2 id={`${id}-title`} className="display-lg mt-4 max-w-[16ch] text-4xl sm:text-5xl">{t("title")}</h2>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-white/65">{t("description")}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-white/85">
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/10 text-brand-yellow"><Icon className="size-4" aria-hidden="true" /></span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-10 flex flex-wrap gap-4">
            <StoreButton store="apple" href={MOBILE_APP.appStoreUrl} soon={t("soon")} small={t("appStoreSmall")} big="App Store" />
            <StoreButton store="google" href={MOBILE_APP.playStoreUrl} soon={t("soon")} small={t("playStoreSmall")} big="Google Play" />
          </div>
        </div>

        {/* Aperçu du téléphone */}
        <div className="relative mx-auto w-full max-w-[300px]" aria-hidden="true">
          <div className="absolute inset-x-6 bottom-0 top-12 rounded-full bg-brand-orange/25 blur-3xl" />
          <div className="relative aspect-[9/19] rotate-[4deg] rounded-[2.8rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-[0_50px_100px_-40px_rgba(0,0,0,0.9)] ring-1 ring-white/10">
            <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
            <div className="relative size-full overflow-hidden rounded-[2.1rem] bg-[#0d0d0d]">
              <Image src={screen.src} alt="" fill sizes="300px" className="object-cover opacity-80" />
              <div className="absolute inset-0 bg-linear-to-b from-black/70 via-black/10 to-black/90" />
              <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-4 pt-9">
                <span className="grid size-9 place-items-center overflow-hidden rounded-xl bg-white">
                  <Image src="/logo.png" alt="" width={32} height={32} className="object-contain" />
                </span>
                <span className="text-sm font-bold">{MOBILE_APP.name}</span>
              </div>
              <div className="absolute inset-x-3 bottom-4 space-y-2">
                {[t("features.order"), t("features.track"), t("features.balance")].map((label, index) => (
                  <div key={label} className="flex items-center gap-2 rounded-2xl bg-white/90 p-2.5 text-[11px] font-semibold text-neutral-900 shadow-lg" style={{ opacity: 1 - index * 0.12 }}>
                    <span className="grid size-6 place-items-center rounded-lg bg-gold text-ink"><ShoppingBag className="size-3.5" /></span>
                    <span className="truncate">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
