import Image from "next/image"
import { Bell, HardHat, PackageCheck, ShoppingBag, Smartphone, Wallet } from "lucide-react"
import { getTranslations } from "next-intl/server"

import { cn } from "@/lib/utils"
import { APP_SCREENS, MOBILE_APP } from "@/lib/store-media"
import { AppleIcon, GooglePlayIcon } from "./brand-icons"

function StoreButton({ href, store, soon, small, big }: { href: string | null; store: "apple" | "google"; soon: string; small: string; big: string }) {
  const content = (
    <>
      {store === "apple" ? <AppleIcon className="size-6 shrink-0 sm:size-7" /> : <GooglePlayIcon className="size-6 shrink-0 sm:size-7" />}
      <span className="flex min-w-0 flex-col text-start leading-tight">
        <span className="truncate text-[9px] font-medium uppercase opacity-80 sm:text-[10px] sm:tracking-wide">{small}</span>
        <span className="text-base font-semibold sm:text-lg">{big}</span>
      </span>
    </>
  )
  const base = "relative inline-flex h-12 min-w-0 items-center gap-2 rounded-2xl border border-white/20 bg-black px-3 text-white sm:h-14 sm:min-w-[180px] sm:gap-3 sm:px-4 shadow-[0_12px_30px_-18px_rgba(0,0,0,0.9)] transition-[translate,border-color,background-color] duration-500 ease-hover"
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
      <span className="absolute -top-3 end-3 rounded-full bg-gold px-2 text-[10px] font-bold leading-4 text-ink shadow-[0_4px_10px_-4px_rgba(0,0,0,0.8)]">{soon}</span>
    </span>
  )
}

/** Téléphone : cadre, barre d'état avec encoche, puis la capture de l'application. */
function Phone({ src, className }: { src: string; className?: string }) {
  return (
    <div className={cn("relative shrink-0 rounded-[1.9rem] bg-neutral-900 p-1.5 shadow-[0_40px_80px_-30px_rgba(0,0,0,0.95)] ring-1 ring-white/15", className)}>
      <div className="overflow-hidden rounded-[1.55rem] bg-black">
        <div className="flex h-5 items-center justify-center">
          <span className="h-3 w-12 rounded-full bg-neutral-900 ring-1 ring-white/10" />
        </div>
        <div className="relative aspect-[500/877]">
          <Image src={src} alt="" fill sizes="(min-width: 1024px) 215px, (min-width: 640px) 190px, 150px" className="object-cover object-top" />
        </div>
      </div>
      {/* Reflet sur la vitre */}
      <div className="pointer-events-none absolute inset-1.5 rounded-[1.55rem] bg-linear-to-br from-white/12 via-transparent to-transparent" />
    </div>
  )
}

/** Section « Téléchargez l'application » : avantages, boutons App Store / Google Play, trois écrans de l'application. */
export async function AppDownloadSection({ locale, id = "app-mobile" }: { locale: string; id?: string }) {
  const t = await getTranslations({ locale, namespace: "storePage.app" })
  const features = [
    { icon: ShoppingBag, text: t("features.order") },
    { icon: PackageCheck, text: t("features.track") },
    { icon: Wallet, text: t("features.balance") },
    { icon: HardHat, text: t("features.maalems") },
    { icon: Bell, text: t("features.alerts") },
  ]
  const side = "w-[118px] translate-y-5 opacity-95 transition-[rotate,translate] duration-700 ease-hover sm:w-[155px] lg:w-[172px]"

  return (
    <section id={id} className="relative scroll-mt-32 overflow-hidden bg-ink py-12 text-white lg:py-14" aria-labelledby={`${id}-title`}>
      <div className="pointer-events-none absolute -start-32 -top-20 size-[26rem] rounded-full bg-brand-orange/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-[1440px] grid-cols-1 items-center gap-8 px-5 sm:px-8 lg:grid-cols-[1fr_auto] lg:gap-16 lg:px-10">
        <div className="min-w-0">
          <p className="kicker flex items-center gap-3 !text-brand-yellow">
            <Smartphone className="size-4" aria-hidden="true" />{t("kicker")}
          </p>
          <h2 id={`${id}-title`} className="display-lg mt-3 max-w-[18ch] text-[2rem] sm:text-5xl">{t("title")}</h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/65">{t("description")}</p>
          <ul data-no-reveal className="no-scrollbar -mx-5 mt-6 flex max-w-2xl gap-2 overflow-x-auto px-5 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] py-1.5 ps-1.5 pe-3.5 text-[13px] text-white/85">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand-yellow/15 text-brand-yellow"><Icon className="size-3.5" aria-hidden="true" /></span>
                {text}
              </li>
            ))}
          </ul>
          <div className="mt-7 grid grid-cols-2 gap-3 sm:mt-8 sm:flex sm:flex-wrap sm:gap-4">
            <StoreButton store="apple" href={MOBILE_APP.appStoreUrl} soon={t("soon")} small={t("appStoreSmall")} big="App Store" />
            <StoreButton store="google" href={MOBILE_APP.playStoreUrl} soon={t("soon")} small={t("playStoreSmall")} big="Google Play" />
          </div>
        </div>

        {/* Trois écrans de l'application, en éventail (décoratif ; toujours de gauche à droite) */}
        <div dir="ltr" className="group/phones relative flex items-end justify-center lg:px-6" aria-hidden="true">
          <div className="absolute inset-x-8 bottom-4 top-16 rounded-full bg-brand-orange/25 blur-3xl" />
          <Phone src={APP_SCREENS.home} className={cn(side, "-me-9 -rotate-[8deg] group-hover/phones:-rotate-[11deg] sm:-me-12")} />
          <Phone src={APP_SCREENS.catalogue} className="z-10 w-[150px] transition-[translate] duration-700 ease-hover group-hover/phones:-translate-y-2 sm:w-[190px] lg:w-[215px]" />
          <Phone src={APP_SCREENS.deals} className={cn(side, "-ms-9 rotate-[8deg] group-hover/phones:rotate-[11deg] sm:-ms-12")} />
        </div>
      </div>
    </section>
  )
}
